import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:4000', // Backend server URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Log the error but don't automatically clear storage for debugging
      console.error('401 Unauthorized error:', error.response?.data);
      console.error('Request headers:', error.config?.headers);
      
      // Temporarily disable automatic logout for debugging
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      //   window.location.href = '/login';
      // }
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // User login
  loginUser: (credentials) => api.post('/api/auth/login', credentials),

  // Client signup
  signupClient: (userData) => api.post('/api/auth/signup/client', userData),

  // Avocat signup
  signupAvocat: (userData) => {
    // Check if userData is FormData (for file uploads)
    if (userData instanceof FormData) {
      // For FormData, let browser set the Content-Type header automatically
      // Do NOT manually set Content-Type for FormData as it needs boundary info
      return api.post('/api/auth/signup/avocat', userData, {
        headers: {
          'Content-Type': undefined, // Let browser set this automatically
        },
      });
    } else {
      // For regular JSON data
      return api.post('/api/auth/signup/avocat', userData);
    }
  },

  // Get user profile
  getUserProfile: () => api.get('/api/auth/profile'),

  // Update user profile
  updateProfile: (profileData) => {
  console.log('updateProfile called with data:', profileData);
    
    // Check if profileData is FormData (for file uploads)
    if (profileData instanceof FormData) {
      return api.patch('/api/auth/profile', profileData, {
        headers: {
          'Content-Type': undefined, // Let browser set this automatically for FormData
        },
      });
    } else {
      // For regular JSON data, use the main profile endpoint
      return api.patch('/api/auth/profile', profileData);
    }
  },

  // Change password
  changePassword: (passwordData) => api.put('/api/auth/change-password', passwordData),

  // Get lawyer working hours
  getLawyerWorkingHours: (lawyerId) => api.get(`/api/auth/working-hours/${lawyerId}`),

  // Update lawyer working hours
  updateLawyerWorkingHours: (lawyerId, workingHours) => api.put(`/api/auth/working-hours/${lawyerId}`, { workingHours }),

  // Upload avatar
  uploadAvatar: (formData) => {
    return api.post('/api/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Logout (client-side only for now)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

// Admin API calls
export const adminAPI = {
  // Get pending lawyers
  getPendingLawyers: () => api.get('/api/admin/pending-lawyers'),

  // Verify lawyer
  verifyLawyer: (lawyerId, action) => api.post(`/api/admin/verify-lawyer/${lawyerId}`, { action }),

  // Get unverified avocats (legacy)
  getUnverifiedAvocats: () => api.get('/api/admin/avocats/unverified'),

  // Verify avocat (legacy)
  verifyAvocat: (avocatId) => api.patch(`/api/admin/avocats/${avocatId}/verify`),

  // Delete avocat (legacy)
  deleteAvocat: (avocatId) => api.delete(`/api/admin/avocats/${avocatId}`),
};

// Rendez-vous (Appointment) API calls
export const rendezVousAPI = {
  // Get available slots for a lawyer
  getAvailableSlots: (avocatId, day, date) =>
    api.get('/api/rendezvous/slots', { params: { avocatId, day, date } }),

  // Book a rendezvous
  bookRendezVous: (data) =>
    api.post('/api/rendezvous/book', data),

  // Approve a rendezvous
  approveRendezVous: (id) =>
    api.post(`/api/rendezvous/approve/${id}`),

  // Reject a rendezvous
  rejectRendezVous: (id) =>
    api.post(`/api/rendezvous/reject/${id}`),

  // Get all rendezvous for a lawyer
  getLawyerRendezVous: (avocatId) =>
    api.get('/api/rendezvous', { params: { avocatId } }).catch(err => {
      console.error('Error fetching lawyer appointments:', err);
      return { data: [] };
    }),

  // Get all rendezvous for a client
  getClientRendezVous: (clientId) =>
    api.get('/api/rendezvous', { params: { clientId } }).catch(err => {
      console.error('Error fetching client appointments:', err);
      return { data: [] };
    }),
  // Update an appointment (reschedule/change type/status)
  updateRendezVous: (id, data) =>
    api.patch(`/api/rendezvous/update/${id}`, data),

  // Mark appointment as paid
  markAsPaid: (id, paymentData) =>
    api.patch(`/api/rendezvous/mark-paid/${id}`, paymentData),
};

// User profile API
export const userAPI = {
  // Refresh current user data (for lawyers to check verification status)
  refreshUserData: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = user.userType || user.role || 'unknown';
      
      console.log('Refreshing user data for:', userType);
      console.log('Current user in localStorage:', user);
      console.log('User keys:', Object.keys(user));
      
      let response;
      
      // Check if this is a lawyer (avocat)
      if (userType === 'avocat' || user.specialites || user.diplome || user.verified !== undefined) {
        console.log('Detected as lawyer, calling /api/avocat/me...');
        response = await api.get('/api/avocat/me');
        console.log('Response from /api/avocat/me:', response.data);
      } else if (userType === 'client' || userType === 'admin') {
        console.log('Detected as client/admin, calling /api/client/me...');
        response = await api.get('/api/client/me'); // We'll add this endpoint if needed
      } else {
        console.error('Cannot determine user type. User object:', user);
        throw new Error(`Unknown user type: ${userType}. Available keys: ${Object.keys(user).join(', ')}`);
      }
      
      if (response.data.success) {
        // Update user data in localStorage
        const updatedUser = {
          ...user,
          ...response.data.user,
          userType: userType === 'unknown' ? 'avocat' : userType // Default to avocat for lawyers
        };
        
        console.log('Updated user data:', updatedUser);
        console.log('Verification status changed from', user.verified, 'to', updatedUser.verified);
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      
      return user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return JSON.parse(localStorage.getItem('user') || '{}');
    }
  }
};

// Case management API
export const caseAPI = {
  createCase: (formData) => {
    // formData should be FormData for files
    return api.post('/api/cases', formData, { headers: { 'Content-Type': undefined } });
  },
  getCases: () => api.get('/api/cases'),
  getCase: (id) => api.get(`/api/cases/${id}`),
  updateCase: (id, formData) => api.put(`/api/cases/${id}`, formData, { headers: { 'Content-Type': undefined } }),
  deleteCase: (id) => api.delete(`/api/cases/${id}`),
  deleteFile: (id, fileUrl) => api.post(`/api/cases/${id}/delete-file`, { file: fileUrl }),
  addFiles: (id, formData) => api.post(`/api/cases/${id}/add-files`, formData, { headers: { 'Content-Type': undefined } }),
}
export default api;