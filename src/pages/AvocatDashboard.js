import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import CasesManager from '../components/CasesManager';
import BookingModal from '../components/BookingModal';
import FileViewer from '../components/FileViewer';
import { rendezVousAPI, authAPI, userAPI } from '../services/api';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '../utils/password';
import { useTranslation } from 'react-i18next';

// Helper: parse common created timestamp fields and sort newest first
function getCreatedTime(obj) {
  if (!obj) return 0;
  const possible = obj.createdAt || obj.createDate || obj.created || obj.dateCreated || obj.created_at || obj.createdOn || obj.createdAt;
  const t = possible ? new Date(possible).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function sortAppointmentsByCreated(arr) {
  try {
    return [...(arr || [])].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
  } catch (e) {
    return arr || [];
  }
}

// Check if an appointment should be auto-canceled (past date and not confirmed)
function shouldAutoCancelAppointment(appointment) {
  if (!appointment || appointment.statut !== 'en_attente') {
    return false; // Only auto-cancel pending appointments
  }
  
  try {
    // Parse appointment date and time
    const appointmentDate = new Date(appointment.date);
    if (!appointment.heure) {
      // If no time specified, assume end of day
      appointmentDate.setHours(23, 59, 59, 999);
    } else {
      // Parse time (format: "HH:MM")
      const [hours, minutes] = appointment.heure.split(':').map(Number);
      appointmentDate.setHours(hours, minutes || 0, 0, 0);
    }
    
    const now = new Date();
    return appointmentDate < now; // Past the appointment time
  } catch (error) {
    console.error('Error checking auto-cancel for appointment:', error);
    return false;
  }
}

// Process appointments and auto-cancel past pending ones
function processAppointmentsWithAutoCancel(appointments, t) {
  return appointments.map(appointment => {
    if (shouldAutoCancelAppointment(appointment)) {
      return {
        ...appointment,
        statut: 'annulé', // Auto-canceled status
        autoCanceled: true, // Flag to indicate it was auto-canceled
        cancelReason: t('avocatDashboard.autoCancelReason')
      };
    }
    return appointment;
  });
}

  const AvocatDashboard = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [currentView, setCurrentView] = useState('appointments');
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [statistics, setStatistics] = useState({
      totalAppointments: 0,
      pendingRequests: 0,
      paidAppointments: 0,
      confirmedAppointments: 0,
      rejectedAppointments: 0,
      canceledAppointments: 0,
      todayAppointments: 0
    });
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'en_attente' | 'payé' | 'confirmé' | 'refusé' | 'today'
    const [appointmentDetailsModalOpen, setAppointmentDetailsModalOpen] = useState(false);
    const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);    // Profile editing states
    const [profileData, setProfileData] = useState({
      fullName: '',
      email: '',
      phone: '',
      specialization: '',
      experience: '',
      // align with signup fields: ville (city) and adresseCabinet
      ville: '',
      adresseCabinet: '',
      bio: '',
      languages: [],
      avatarUrl: ''
    });
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    // Avatar upload states
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Working hours states
    const [workingHours, setWorkingHours] = useState({
      monday: { start: '09:00', end: '17:00', isOpen: true },
      tuesday: { start: '09:00', end: '17:00', isOpen: true },
      wednesday: { start: '09:00', end: '17:00', isOpen: true },
      thursday: { start: '09:00', end: '17:00', isOpen: true },
      friday: { start: '09:00', end: '17:00', isOpen: true },
      saturday: { start: '09:00', end: '13:00', isOpen: false },
      sunday: { start: '09:00', end: '17:00', isOpen: false }
    });
    const [isEditingWorkingHours, setIsEditingWorkingHours] = useState(false);
    const [workingHoursLoading, setWorkingHoursLoading] = useState(false);

    const isVerified = user?.verified || user?.isVerified || false;

    // Refresh user data on component mount to get latest verification status
    useEffect(() => {
      const refreshUserStatus = async () => {
        try {
          const updatedUser = await userAPI.refreshUserData();
          if (updatedUser && updatedUser.verified !== user?.verified) {
            // User verification status changed, update the auth context
            updateUser(updatedUser);
          }
        } catch (error) {
          console.error('Error refreshing user status:', error);
        }
      };

      // Only refresh if user exists and is a lawyer
      if (user && user.userType === 'avocat') {
        refreshUserStatus();
      }
    }, [user, updateUser]); // Add missing dependencies

    // Periodic refresh to check for verification status changes
    useEffect(() => {
      const interval = setInterval(async () => {
        try {
          const updatedUser = await userAPI.refreshUserData();
          if (updatedUser && updatedUser.verified !== user?.verified) {
            updateUser(updatedUser);
          }
        } catch (error) {
          console.error('Error in periodic refresh:', error);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }, [user?.verified, updateUser]); // Re-run if verification status changes

    // logout handled here for the dashboard sidebar
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    };

    const handleProfileInputChange = (e) => {
      const { name, value } = e.target;
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Start editing: prefill the form with current user data
    const startEditingProfile = () => {
      setProfileData({
        fullName: user.fullName || user.nom || '',
        email: user.email || user.nom || '',
        phone: user.phone || user.telephone || '',
        specialization: user.specialites || user.specialization || '',
        experience: user.anneExperience ? String(user.anneExperience) : (user.experience ? String(user.experience) : ''),
        ville: user.ville || user.adresseCabinet || user.address || '',
        adresseCabinet: user.adresseCabinet || user.address || '',
        bio: user.bio || user.biographie || '',
        languages: user.languages || user.langues || [],
        avatarUrl: user.avatarUrl || ''
      });
      setIsEditingProfile(true);
    };

    // Cancel editing: restore the form to the user's current saved values
    const cancelEditingProfile = () => {
      setProfileData({
        fullName: user.fullName || user.nom || '',
        email: user.email || user.nom || '',
        phone: user.phone || user.telephone || '',
        specialization: user.specialites || user.specialization || '',
        experience: user.anneExperience ? String(user.anneExperience) : (user.experience ? String(user.experience) : ''),
        ville: user.ville || user.adresseCabinet || user.address || '',
        adresseCabinet: user.adresseCabinet || user.address || '',
        bio: user.bio || user.biographie || '',
        languages: user.languages || user.langues || [],
        avatarUrl: user.avatarUrl || ''
      });
      setIsEditingProfile(false);
    };

    const handlePasswordInputChange = (e) => {
      const { name, value } = e.target;
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setProfileLoading(true);

      try {
        // First upload avatar if there's a new one
        let avatarUrl = profileData.avatarUrl || '';
        if (avatarFile) {
          const uploadedAvatarUrl = await uploadAvatar();
          if (uploadedAvatarUrl) {
            avatarUrl = uploadedAvatarUrl;
          }
        }

        const mappedData = {
          email: profileData.email,
          // Remove fullName - lawyers cannot change their name
          phone: profileData.phone,
          ville: profileData.ville || '',
          adresseCabinet: profileData.adresseCabinet || '',
          specialites: profileData.specialization || '',
          diplome: profileData.diplome || '',
          bio: profileData.bio || '',
          anneExperience: profileData.experience ? parseInt(profileData.experience) : (profileData.experience === '' ? null : null),
          langues: Array.isArray(profileData.languages) ? profileData.languages : (profileData.languages ? [profileData.languages] : []),
          avatarUrl: avatarUrl,
          disponibilites: profileData.disponibilite || []
        };

        const response = await authAPI.updateProfile(mappedData);
        if (response && response.data) {
          updateUser(response.data.user);
          setIsEditingProfile(false);
          
          // Clean up avatar states
          setAvatarFile(null);
          setAvatarPreview(null);
          
          alert(t('avocatDashboard.profileUpdated'));
        }
      } catch (error) {
        console.error('❌ Error updating profile:', error);
      const errorMessage = error.response?.data?.error || error.message || t('avocatDashboard.errorUpdatingProfile');
      alert(`${t('common.errorPrefix')} ${errorMessage}`);
      } finally {
        setProfileLoading(false);
      }
    };

    const handleChangePassword = async (e) => {
      e.preventDefault();

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert(t('avocatDashboard.passwordMismatch'));
        return;
      }

      if (!validatePassword(passwordData.newPassword)) {
        alert(PASSWORD_POLICY_MESSAGE);
        return;
      }

      setPasswordLoading(true);
      try {
        const response = await authAPI.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });

        if (response.status === 200) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setIsChangingPassword(false);
          alert(t('avocatDashboard.passwordChanged'));
        }
      } catch (error) {
        console.error('Error changing password:', error);
  const msg = error.response?.data?.error || error.response?.data?.message || error.message || t('avocatDashboard.errorChangingPassword');
  alert(`${t('common.errorPrefix')} ${msg}`);
      } finally {
        setPasswordLoading(false);
      }
    };

    // Working hours handlers
    const handleWorkingHoursChange = (day, field, value) => {
      setWorkingHours(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      }));
    };

    const handleSaveWorkingHours = async () => {
      setWorkingHoursLoading(true);
      try {
        const response = await authAPI.updateLawyerWorkingHours(user.id || user._id, workingHours);
        if (response.status === 200 || response.data) {
          setIsEditingWorkingHours(false);
          alert(t('avocatDashboard.workingHoursSaved'));
          
          // Optionally reload working hours to ensure sync
          try {
            const updatedResponse = await authAPI.getLawyerWorkingHours(user.id || user._id);
            if (updatedResponse.data && updatedResponse.data.workingHours) {
              setWorkingHours(updatedResponse.data.workingHours);
            }
          } catch (reloadError) {
            console.warn('Could not reload working hours after save:', reloadError);
          }
        }
      } catch (error) {
        console.error('Error saving working hours:', error);
        const errorMessage = error.response?.data?.message || error.message || t('avocatDashboard.errorSavingWorkingHours');
        alert(`${t('common.errorPrefix')} ${errorMessage}`);
      } finally {
        setWorkingHoursLoading(false);
      }
    };

    // Avatar upload handlers
    const handleAvatarChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(t('avocatDashboard.avatarTooLarge'));
          return;
        }
        if (!file.type.startsWith('image/')) {
          alert(t('avocatDashboard.avatarInvalidType'));
          return;
        }
        setAvatarFile(file);
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
      }
    };

    const uploadAvatar = async () => {
      if (!avatarFile) return null;
      
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      try {
        const response = await authAPI.uploadAvatar(formData);
        return response.data.avatarUrl;
      } catch (error) {
        console.error('Avatar upload error:', error);
        alert(t('avocatDashboard.avatarUploadError'));
        return null;
      } finally {
        setAvatarUploading(false);
      }
    };

    useEffect(() => {
      if (user && isVerified) {
        setLoading(true);
        const today = new Date().toDateString();
        rendezVousAPI.getLawyerRendezVous(user.id || user._id)
          .then(response => {
              const appointmentData = response.data || response || [];
              // Process appointments and auto-cancel past pending ones
              const processedAppointments = processAppointmentsWithAutoCancel(appointmentData, t);
              const sorted = sortAppointmentsByCreated(processedAppointments);
              setAppointments(sorted);
                const todayCount = sorted.filter(a => 
                  new Date(a.date).toDateString() === today && a.statut === 'confirmé'
                ).length;
              setStatistics({
                totalAppointments: processedAppointments.length,
                pendingRequests: processedAppointments.filter(a => a.statut === 'en_attente').length,
                paidAppointments: processedAppointments.filter(a => a.statut === 'payé').length,
                confirmedAppointments: processedAppointments.filter(a => a.statut === 'confirmé').length,
                rejectedAppointments: processedAppointments.filter(a => a.statut === 'refusé').length,
                canceledAppointments: processedAppointments.filter(a => a.statut === 'annulé').length,
                todayAppointments: todayCount
              });
          })
          .catch(err => console.error('Error loading appointments:', err))
          .finally(() => setLoading(false));
      }
    }, [user, isVerified, t]);

    // keep profileData synced with user when not editing
    useEffect(() => {
      if (!user) return;
      if (isEditingProfile) return; // don't overwrite while editing
      setProfileData({
        fullName: user.fullName || user.nom || '',
        email: user.email || '',
        phone: user.phone || '',
        specialization: user.specialites || user.specialization || '',
        experience: user.anneExperience ? String(user.anneExperience) : (user.experience ? String(user.experience) : ''),
        ville: user.ville || '',
        adresseCabinet: user.adresseCabinet || '',
        bio: user.bio || user.biographie || '',
        languages: user.languages || user.langues || [],
        avatarUrl: user.avatarUrl || ''
      });
    }, [user, isEditingProfile]);

    // Load cities (same list used on SignupAvocat)
    useEffect(() => {
      const loadCities = () => {
        setLoadingCities(true);
        setTimeout(() => {
          const tunisianCities = [
            'Tunis', 'Sfax', 'Sousse', 'Gabes', 'Bizerte', 'Ariana', 
            'Gafsa', 'Monastir', 'Kairouan', 'Kasserine', 'Mahdia', 
            'Nabeul', 'Tataouine', 'Kebili', 'Siliana', 'Kef',
            'Jendouba', 'Zaghouan', 'Beja', 'Manouba', 'Medenine',
            'Tozeur', 'Sidi Bouzid', 'Ben Arous'
          ];
          setCities(tunisianCities.sort());
          setLoadingCities(false);
        }, 300);
      };

      loadCities();
    }, []);

    // Load working hours from server
    useEffect(() => {
      const loadWorkingHours = async () => {
        if (user && (user.id || user._id)) {
          try {
            const response = await authAPI.getLawyerWorkingHours(user.id || user._id);
            if (response.data && response.data.workingHours) {
              setWorkingHours(response.data.workingHours);
            }
          } catch (error) {
            console.error('Error loading working hours:', error);
            // Keep default working hours if loading fails
          }
        }
      };

      loadWorkingHours();
    }, [user]);

  const handleApproveAppointment = async (appointmentId) => {
    try {
      await rendezVousAPI.approveRendezVous(appointmentId);
  setAppointments(prev => sortAppointmentsByCreated(prev.map(apt => apt._id === appointmentId ? { ...apt, statut: 'confirmé' } : apt)));
      // Update statistics based on current appointment status
      const currentAppointment = appointments.find(apt => apt._id === appointmentId);
      setStatistics(prev => {
        const newStats = { ...prev, confirmedAppointments: prev.confirmedAppointments + 1 };
        if (currentAppointment?.statut === 'en_attente') {
          newStats.pendingRequests = prev.pendingRequests - 1;
        } else if (currentAppointment?.statut === 'payé') {
          newStats.paidAppointments = prev.paidAppointments - 1;
        }
        return newStats;
      });
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert(t('avocatDashboard.errorApproving'));
    }
  };

  const computeStatisticsFrom = (arr) => {
    const appointmentData = arr || [];
    const today = new Date().toDateString();
    const todayCount = appointmentData.filter(a => new Date(a.date).toDateString() === today && a.statut === 'confirmé').length;
    return {
      totalAppointments: appointmentData.length,
      pendingRequests: appointmentData.filter(a => a.statut === 'en_attente').length,
      paidAppointments: appointmentData.filter(a => a.statut === 'payé').length,
      confirmedAppointments: appointmentData.filter(a => a.statut === 'confirmé').length,
      rejectedAppointments: appointmentData.filter(a => a.statut === 'refusé').length,
      canceledAppointments: appointmentData.filter(a => a.statut === 'annulé').length,
      todayAppointments: todayCount
    };
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm(t('avocatDashboard.confirmCancel'))) return;

    // Optimistic UI update
    let previous = null;
    setAppointments(prev => {
      previous = prev;
      const next = prev.map(a => a._id === appointmentId ? { ...a, statut: 'annulé' } : a);
      const sorted = sortAppointmentsByCreated(next);
      setStatistics(computeStatisticsFrom(sorted));
      return sorted;
    });

    try {
      await rendezVousAPI.updateRendezVous(appointmentId, { statut: 'annulé' });
    } catch (err) {
      console.error('Error cancelling appointment', err);
      alert(t('avocatDashboard.cancelError'));
      if (previous) {
        setAppointments(sortAppointmentsByCreated(previous));
        setStatistics(computeStatisticsFrom(previous));
      }
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    const apt = appointments.find(a => a._id === appointmentId);
    if (!apt) return alert(t('avocatDashboard.appointmentNotFound'));
    setAppointmentToReschedule(apt);
    setBookingModalOpen(true);
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      await rendezVousAPI.rejectRendezVous(appointmentId);
  setAppointments(prev => sortAppointmentsByCreated(prev.map(apt => apt._id === appointmentId ? { ...apt, statut: 'refusé' } : apt)));
      // Update statistics based on current appointment status
      const currentAppointment = appointments.find(apt => apt._id === appointmentId);
      setStatistics(prev => {
        const newStats = { ...prev };
        if (currentAppointment?.statut === 'en_attente') {
          newStats.pendingRequests = prev.pendingRequests - 1;
        } else if (currentAppointment?.statut === 'payé') {
          newStats.paidAppointments = prev.paidAppointments - 1;
        }
        return newStats;
      });
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert(t('avocatDashboard.errorRejecting'));
    }
  };

  const handleMarkAsPaid = async (appointmentId) => {
    try {
      // Call API to mark appointment as paid in person
      await rendezVousAPI.markAsPaid(appointmentId, {
        paymentStatus: 'paid_in_person',
        paymentMethod: 'in_person',
        paymentConfirmedBy: user._id,
        paymentConfirmedAt: new Date()
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === appointmentId 
            ? { 
                ...apt, 
                paymentStatus: 'paid_in_person',
                paymentMethod: 'in_person',
                paymentConfirmedAt: new Date()
              } 
            : apt
        )
      );
      
      alert(t('avocatDashboard.paymentConfirmed'));
    } catch (error) {
      console.error('Error marking appointment as paid:', error);
      alert(t('avocatDashboard.paymentError'));
    }
  };

  // Handle opening appointment details modal
  const handleOpenAppointmentDetails = (appointment) => {
    console.log('Opening appointment details for:', appointment);
    console.log('Appointment data structure:', JSON.stringify(appointment, null, 2));
    setSelectedAppointmentDetails(appointment);
    setAppointmentDetailsModalOpen(true);
  };

  const renderAppointmentCard = (appointment) => {
    console.log('Rendering appointment card for:', appointment);
    console.log('Client ID data:', appointment.clientId);
    console.log('Client Info data:', appointment.clientInfo);
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmé': return 'linear-gradient(135deg, #10b981, #059669)';
        case 'en_attente': return 'linear-gradient(135deg, #f59e0b, #d97706)';
        case 'payé': return 'linear-gradient(135deg, #CFAE70, #B8941F)';
        case 'refusé': return 'linear-gradient(135deg, #ef4444, #dc2626)';
        default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'confirmé': return t('avocatDashboard.statusConfirmed');
        case 'en_attente': return t('avocatDashboard.statusWaiting');
        case 'payé': return t('avocatDashboard.statusPaid');
        case 'refusé': return t('avocatDashboard.statusRejected');
        default: return status;
      }
    };

    const appointmentDate = new Date(appointment.date);
    const isUpcoming = appointmentDate >= new Date() && appointment.statut === 'confirmé';

    return (
      <div key={appointment._id} className={`appointment-card-elegant ${appointment.statut} ${isUpcoming ? 'upcoming' : ''}`}>
        <div className="appointment-card-main" onClick={() => handleOpenAppointmentDetails(appointment)}>
          <div className="appointment-header-elegant">
            <div className="client-info-elegant">
              <h3 className="client-name-elegant">
                {appointment.clientId?.fullName || 
                 appointment.clientId?.nom || 
                 appointment.clientInfo?.nom || 
                 appointment.clientNom || 
                 t('avocatDashboard.client')}
              </h3>
              <p className="client-email-elegant">
                {appointment.clientId?.email || 
                 appointment.clientInfo?.email || 
                 appointment.clientEmail || 
                 t('avocatDashboard.noEmail')}
              </p>
              <div 
                className="status-pill"
                style={{ background: getStatusColor(appointment.statut) }}
              >
                {getStatusText(appointment.statut)}
              </div>
            </div>
            
            <div className="appointment-timing">
              <div className="date-display">
                <span className="day">{appointmentDate.getDate()}</span>
                <span className="month">{appointmentDate.toLocaleDateString('ar', { month: 'short' })}</span>
              </div>
              <div className="time-display">
                <span className="time">{appointment.heure}</span>
                <span className="day-name">{appointmentDate.toLocaleDateString('ar', { weekday: 'short' })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="appointment-actions-elegant" onClick={(e) => e.stopPropagation()}>
          {/* Status-specific primary actions */}
          {appointment.statut === 'en_attente' && (
            <div className="primary-actions">
              <button 
                className="action-btn primary-action approve-action"
                onClick={() => handleApproveAppointment(appointment._id)}
              >
                <span className="btn-icon">✅</span>
                {t('avocatDashboard.approve')}
              </button>
              <button 
                className="action-btn danger-action"
                onClick={() => handleRejectAppointment(appointment._id)}
              >
                <span className="btn-icon">❌</span>
                {t('avocatDashboard.reject')}
              </button>
            </div>
          )}

          {appointment.statut === 'payé' && (
            <div className="primary-actions">
              <button 
                className="action-btn primary-action approve-action"
                onClick={() => handleApproveAppointment(appointment._id)}
              >
                <span className="btn-icon">✅</span>
                {t('avocatDashboard.confirmAppointment')}
              </button>
              <button 
                className="action-btn danger-action"
                onClick={() => handleRejectAppointment(appointment._id)}
              >
                <span className="btn-icon">❌</span>
                {t('avocatDashboard.reject')}
              </button>
            </div>
          )}

          {/* Secondary actions for all statuses */}
          <div className="secondary-actions">
            {appointment.statut === 'confirmé' && (
              <button 
                className="action-btn secondary-action"
                onClick={() => handleMarkAsPaid(appointment._id)}
                title={t('avocatDashboard.markAsPaidTitle')}
              >
                <span className="btn-icon">💳</span>
                {t('avocatDashboard.markAsPaid')}
              </button>
            )}
            
            {(appointment.statut === 'confirmé' || appointment.statut === 'en_attente' || appointment.statut === 'payé') && (
              <>
                
                
              </>
            )}
          </div>
        </div>

        {/* Additional Info - Message and Payment */}
        {(appointment.message || appointment.paymentStatus) && (
          <div className="appointment-details-elegant">
            {appointment.message && (
              <div className="appointment-message-elegant">
                <h4 className="message-title">{t('avocatDashboard.message')}</h4>
                <p className="message-content">{appointment.message}</p>
              </div>
            )}

            {appointment.paymentStatus && (
              <div className="payment-info-elegant">
                <h4 className="payment-title">{t('avocatDashboard.paymentInfo')}</h4>
                <div className="payment-details">
                  <span className="payment-status">
                    {t(`avocatDashboard.paymentStatus.${appointment.paymentStatus}`, appointment.paymentStatus)}
                  </span>
                  {appointment.paymentMethod && (
                    <span className="payment-method">
                      {t('avocatDashboard.method')}: {t(`avocatDashboard.paymentMethod.${appointment.paymentMethod}`, appointment.paymentMethod.replace('_', ' '))}
                    </span>
                  )}
                  {appointment.paymentConfirmedAt && (
                    <span className="payment-confirmed">
                      {t('avocatDashboard.confirmedOn')}: {new Date(appointment.paymentConfirmedAt).toLocaleDateString('ar')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentsView = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('avocatDashboard.loadingData')}</p>
        </div>
      );
    }

    const pendingAppointments = appointments.filter(a => a.statut === 'en_attente');
    const paidAppointments = appointments.filter(a => a.statut === 'payé');
    const confirmedAppointments = appointments.filter(a => a.statut === 'confirmé');
    const rejectedAppointments = appointments.filter(a => a.statut === 'refusé');

    const filteredAppointments = filterStatus === 'all' ? appointments : (
      filterStatus === 'today'
        ? appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString())
        : appointments.filter(a => a.statut === filterStatus)
    );

    return (
      <div className="appointments-view">
        <div className="view-header">
          <h2 className="view-title">{t('avocatDashboard.appointmentManagement')}</h2>
          <p className="view-subtitle">{t('avocatDashboard.reviewManageRequests')}</p>
        </div>

        {/* Statistics Cards (click a card to filter) */}
        <div className="stats-grid">
          <div className={`stat-card stat-small ${filterStatus === 'all' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('all')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.total')}</div>
            <div className="stat-content">
              <h4>{statistics.totalAppointments}</h4>
              <p className="stat-label-small">{t('avocatDashboard.totalAppointments')}</p>
            </div>
          </div>
          <div className={`stat-card stat-small ${filterStatus === 'en_attente' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('en_attente')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.pending')}</div>
            <div className="stat-content">
              <h4>{statistics.pendingRequests}</h4>
              <p className="stat-label-small">{t('avocatDashboard.pending')}</p>
            </div>
          </div>
          <div className={`stat-card stat-small ${filterStatus === 'refusé' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('refusé')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.statusRejected')}</div>
            <div className="stat-content">
              <h4>{statistics.rejectedAppointments}</h4>
              <p className="stat-label-small">{t('avocatDashboard.statusRejected')}</p>
            </div>
          </div>
          <div className={`stat-card stat-small ${filterStatus === 'confirmé' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('confirmé')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.confirmed')}</div>
            <div className="stat-content">
              <h4>{statistics.confirmedAppointments}</h4>
              <p className="stat-label-small">{t('avocatDashboard.confirmed')}</p>
            </div>
          </div>
          <div className={`stat-card stat-small ${filterStatus === 'annulé' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('annulé')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.canceled')}</div>
            <div className="stat-content">
              <h4>{statistics.canceledAppointments}</h4>
              <p className="stat-label-small">{t('avocatDashboard.statusCanceled')}</p>
            </div>
          </div>
          <div className={`stat-card stat-small today ${filterStatus === 'today' ? 'active-filter' : ''}`} onClick={() => setFilterStatus('today')} role="button" tabIndex={0}>
            <div className="stat-icon">{t('avocatDashboard.today')}</div>
            <div className="stat-content">
              <h4>{statistics.todayAppointments}</h4>
              <p className="stat-label-small">{t('avocatDashboard.today')}</p>
            </div>
          </div>
        </div>

  {/* Note: filter bar removed — stat cards are the only filters now */}

        {/* Appointments listing: grouped when filter is 'all', otherwise show filtered list */}
        {filterStatus === 'all' ? (
          <>
            {pendingAppointments.length > 0 && (
              <div className="appointments-section">
                <h3 className="section-title">
                  {t('avocatDashboard.pendingRequests')} ({pendingAppointments.length})
                </h3>
                <div className="appointments-grid">
                  {pendingAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {paidAppointments.length > 0 && (
              <div className="appointments-section">
                <h3 className="section-title">
                  {t('avocatDashboard.paidAppointments')} ({paidAppointments.length})
                </h3>
                <div className="appointments-grid">
                  {paidAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {confirmedAppointments.length > 0 && (
              <div className="appointments-section">
                <h3 className="section-title">
                  {t('avocatDashboard.confirmedAppointments')} ({confirmedAppointments.length})
                </h3>
                <div className="appointments-grid">
                  {confirmedAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {rejectedAppointments.length > 0 && (
              <div className="appointments-section">
                <h3 className="section-title">
                  {t('avocatDashboard.rejectedAppointments')} ({rejectedAppointments.length})
                </h3>
                <div className="appointments-grid">
                  {rejectedAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>{t('avocatDashboard.noAppointments')}</h3>
                <p>{t('avocatDashboard.noScheduledAppointments')}</p>
              </div>
            )}
          </>
        ) : (
          <div className="appointments-section">
            <h3 className="section-title">
              {filterStatus === 'today' ? t('avocatDashboard.todayAppointments') : 
               filterStatus === 'confirmé' ? t('avocatDashboard.confirmedAppointments') :
               filterStatus === 'en_attente' ? t('avocatDashboard.pendingRequests') :
               filterStatus === 'refusé' ? t('avocatDashboard.rejectedAppointments') :
               filterStatus === 'annulé' ? t('avocatDashboard.canceledAppointments') :
               t('avocatDashboard.filteredResults')}
            </h3>
            <div className="appointments-grid">
              {filteredAppointments.length > 0 ? filteredAppointments.map(renderAppointmentCard) : (
                <div className="empty-state">
                  <h3>{t('avocatDashboard.noAppointments')}</h3>
                  <p>{t('avocatDashboard.noFilteredAppointments')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfileView = () => {
    return (
      <div className="profile-view">
        

        {/* Profile Hero Section */}
        <div className="profile-hero">
          <div className="profile-hero-avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName || 'Avocat'} className="hero-avatar-img" />
            ) : (
              <div className="hero-avatar-placeholder">
                {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
          </div>
          <div className="profile-hero-info">
            <h1 className="hero-name">{user.fullName || user.nom || 'Avocat'}</h1>
            <p className="hero-specialization">{user.specialites || user.specialization || t('avocatDashboard.notProvided')}</p>
            <div className="hero-meta">
              <span className="hero-experience">{user.anneExperience || '0'} {t('avocatDashboard.yearsOfExperience')}</span>
              <span className="hero-location">
                {user.ville ? t(`avocatDashboard.cities.${user.ville}`, user.ville) : t('avocatDashboard.notProvided')}
              </span>
            </div>
          </div>
          <div className="profile-hero-actions">
            {!isEditingProfile && (
              <button 
                className="modern-edit-btn"
                onClick={startEditingProfile}
              >
                <span className="btn-icon">✏️</span>
                {t('avocatDashboard.edit')}
              </button>
            )}
          </div>
        </div>

        <div className="profile-sections">
          {/* Personal Information Section */}
          <div className="modern-profile-section">
            <div className="modern-section-header">
              <div className="section-header-content">
                <h3 className="modern-section-title">
                  {t('avocatDashboard.personalInformation')}
                </h3>
                <p className="section-description">Manage your personal and contact information</p>
              </div>
            </div>

            {isEditingProfile ? (
              <div className="modern-form-container">
                <form onSubmit={handleUpdateProfile} className="modern-profile-form">
                  {/* Avatar Upload Section */}
                  <div className="modern-form-group full-width avatar-upload-section">
                    <label className="modern-label">{t('avocatDashboard.profilePicture')}</label>
                    <div className="avatar-upload-container">
                      <div className="avatar-preview">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview-img" />
                        ) : user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Current Avatar" className="avatar-preview-img" />
                        ) : (
                          <div className="avatar-preview-placeholder">
                            {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                      </div>
                      <div className="avatar-upload-controls">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="avatar-file-input"
                          id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload" className={`avatar-upload-btn ${avatarUploading ? 'uploading' : ''}`}>
                          <span className="btn-icon">📷</span>
                          {avatarUploading ? t('avocatDashboard.saving') : t('avocatDashboard.changePhoto')}
                        </label>
                        <p className="avatar-help-text">{t('avocatDashboard.avatarHelpText')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="modern-form-grid">
                    {/* Full Name - Read Only */}
                    <div className="modern-form-group">
                      <label htmlFor="fullName" className="modern-label">{t('avocatDashboard.fullName')}</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={user.fullName || user.nom || ''}
                        className="modern-input read-only"
                        placeholder="Full name"
                        readOnly
                        disabled
                      />
                      <p className="read-only-note">{t('avocatDashboard.nameCannotBeChanged')}</p>
                    </div>
                    
                    <div className="modern-form-group">
                      <label htmlFor="email" className="modern-label">{t('avocatDashboard.email')}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        className="modern-input"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div className="modern-form-group">
                      <label htmlFor="phone" className="modern-label">{t('avocatDashboard.phone')}</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileInputChange}
                        className="modern-input"
                        placeholder="+212 6XX XX XX XX"
                      />
                    </div>
                    
                    <div className="modern-form-group">
                      <label htmlFor="specialization" className="modern-label">{t('avocatDashboard.specialization')}</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleProfileInputChange}
                        className="modern-select"
                      >
                        <option value="">{t('avocatDashboard.selectSpeciality')}</option>
                        <option value="civilLaw">{t('avocatDashboard.civilLaw')}</option>
                        <option value="criminalLaw">{t('avocatDashboard.criminalLaw')}</option>
                        <option value="corporateLaw">{t('avocatDashboard.corporateLaw')}</option>
                        <option value="familyLaw">{t('avocatDashboard.familyLaw')}</option>
                        <option value="intellectualProperty">{t('avocatDashboard.intellectualProperty')}</option>
                        <option value="laborLaw">{t('avocatDashboard.laborLaw')}</option>
                        <option value="taxLaw">{t('avocatDashboard.taxLaw')}</option>
                        <option value="realEstateLaw">{t('avocatDashboard.realEstateLaw')}</option>
                      </select>
                    </div>
                    
                    <div className="modern-form-group">
                      <label htmlFor="experience" className="modern-label">{t('avocatDashboard.yearsOfExperience')}</label>
                      <input
                        type="number"
                        id="experience"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleProfileInputChange}
                        className="modern-input"
                        placeholder="5"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                  
                  <div className="modern-form-group full-width">
                    <label className="modern-label">{t('avocatDashboard.ville')}</label>
                    <select
                      name="ville"
                      id="ville"
                      value={profileData.ville}
                      onChange={handleProfileInputChange}
                      className="modern-select"
                      disabled={loadingCities}
                    >
                      <option value="">{loadingCities ? t('avocatDashboard.loadingCities') : t('avocatDashboard.selectCity')}</option>
                      {cities.map(c => (
                        <option key={c} value={c}>
                          {t(`avocatDashboard.cities.${c}`, c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modern-form-group full-width">
                    <label htmlFor="adresseCabinet" className="modern-label">{t('avocatDashboard.adresseCabinet')}</label>
                    <input
                      type="text"
                      id="adresseCabinet"
                      name="adresseCabinet"
                      placeholder={t('avocatDashboard.officeAddress')}
                      value={profileData.adresseCabinet}
                      onChange={handleProfileInputChange}
                      className="modern-input"
                    />
                  </div>
                  
                  <div className="modern-form-group full-width">
                    <label htmlFor="bio" className="modern-label">{t('avocatDashboard.biography')}</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileInputChange}
                      rows="4"
                      className="modern-textarea"
                      placeholder={t('avocatDashboard.describeBackground')}
                    />
                  </div>

                  <div className="modern-form-actions">
                    <button 
                      type="button" 
                      className="modern-cancel-btn"
                      onClick={cancelEditingProfile}
                    >
                      <span className="btn-icon">✖️</span>
                      {t('avocatDashboard.cancel')}
                    </button>
                    <button 
                      type="submit" 
                      className="modern-save-btn"
                      disabled={profileLoading}
                    >
                      <span className="btn-icon">{profileLoading ? '⏳' : '💾'}</span>
                      {profileLoading ? t('avocatDashboard.saving') : t('avocatDashboard.save')}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modern-profile-display">
                <div className="profile-info-cards">
                  <div className="info-card">
                    <div className="info-card-header">
                      <h4 className="info-title">{t('avocatDashboard.fullName')}</h4>
                    </div>
                    <p className="info-value">{profileData.fullName || user.fullName || user.nom || t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <span className="info-icon">📧</span>
                      <h4 className="info-title">{t('avocatDashboard.email')}</h4>
                    </div>
                    <p className="info-value">{user.email || t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <span className="info-icon">📱</span>
                      <h4 className="info-title">{t('avocatDashboard.phone')}</h4>
                    </div>
                    <p className="info-value">{user.phone || t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <span className="info-icon">⚖️</span>
                      <h4 className="info-title">{t('avocatDashboard.specialization')}</h4>
                    </div>
                    <p className="info-value">{profileData.specialization || user.specialites || t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <span className="info-icon">🎓</span>
                      <h4 className="info-title">{t('avocatDashboard.yearsOfExperience')}</h4>
                    </div>
                    <p className="info-value">{(profileData.experience || user.anneExperience) ? `${profileData.experience || user.anneExperience} years` : t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-header">
                      <span className="info-icon">🏛️</span>
                      <h4 className="info-title">{t('avocatDashboard.barNumber')}</h4>
                    </div>
                    <p className="info-value">{profileData.barNumber || user.barNumber || t('avocatDashboard.notProvided')}</p>
                  </div>
                  
                  <div className="info-card full-width">
                    <div className="info-card-header">
                      <span className="info-icon">📍</span>
                      <h4 className="info-title">{t('avocatDashboard.address')}</h4>
                    </div>
                    <p className="info-value">{profileData.adresseCabinet ? `${profileData.adresseCabinet}, ${profileData.ville || user.ville || ''}` : (profileData.ville || user.ville || t('avocatDashboard.notProvided'))}</p>
                  </div>
                  
                  <div className="info-card full-width">
                    <div className="info-card-header">
                      <span className="info-icon">📝</span>
                      <h4 className="info-title">{t('avocatDashboard.biography')}</h4>
                    </div>
                    <p className="info-value bio-text">{profileData.bio || user.bio || t('avocatDashboard.noBiographyProvided')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="modern-profile-section">
            <div className="modern-section-header">
              <div className="section-header-content">
                <h3 className="modern-section-title">
                  <span className="section-icon">🔒</span>
                  {t('avocatDashboard.security')}
                </h3>
                <p className="section-description">Update your password and security settings</p>
              </div>
              {!isChangingPassword && (
                <button 
                  className="modern-secondary-btn"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <span className="btn-icon">🔑</span>
                  {t('avocatDashboard.changePassword')}
                </button>
              )}
            </div>

            {isChangingPassword && (
              <div className="modern-form-container">
                <form onSubmit={handleChangePassword} className="modern-password-form">
                  <div className="modern-form-group">
                    <label htmlFor="currentPassword" className="modern-label">{t('avocatDashboard.currentPassword')}</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="modern-input"
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label htmlFor="newPassword" className="modern-label">{t('avocatDashboard.newPassword')}</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength="8"
                      className="modern-input"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label htmlFor="confirmPassword" className="modern-label">{t('avocatDashboard.confirmNewPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength="8"
                      className="modern-input"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="modern-form-actions">
                    <button 
                      type="button" 
                      className="modern-cancel-btn"
                      onClick={() => setIsChangingPassword(false)}
                    >
                      <span className="btn-icon">✖️</span>
                      {t('avocatDashboard.cancel')}
                    </button>
                    <button 
                      type="submit" 
                      className="modern-save-btn"
                      disabled={passwordLoading}
                    >
                      <span className="btn-icon">{passwordLoading ? '⏳' : '🔒'}</span>
                      {passwordLoading ? t('avocatDashboard.changing') : t('avocatDashboard.changePasswordBtn')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Working Hours Section */}
          <div className="modern-profile-section">
            <div className="modern-section-header">
              <div className="section-header-content">
                <h3 className="modern-section-title">
                  <span className="section-icon">🕒</span>
                  {t('avocatDashboard.workingHours')}
                </h3>
                <p className="section-description">Manage your availability and working schedule</p>
              </div>
              {!isEditingWorkingHours && (
                <button 
                  className="modern-secondary-btn"
                  onClick={() => setIsEditingWorkingHours(true)}
                >
                  <span className="btn-icon">✏️</span>
                  {t('avocatDashboard.edit')}
                </button>
              )}
            </div>

            {isEditingWorkingHours ? (
              <div className="modern-form-container">
                <div className="working-hours-form">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="working-hours-day">
                      <div className="day-header">
                        <label className="day-name">
                          <input
                            type="checkbox"
                            checked={hours.isOpen}
                            onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                            className="day-checkbox"
                          />
                          {t(`avocatDashboard.days.${day}`)}
                        </label>
                      </div>
                      {hours.isOpen && (
                        <div className="time-inputs">
                          <div className="time-input-group">
                            <label className="time-label">{t('avocatDashboard.from')}</label>
                            <input
                              type="time"
                              value={hours.start}
                              onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                              className="modern-time-input"
                            />
                          </div>
                          <div className="time-input-group">
                            <label className="time-label">{t('avocatDashboard.to')}</label>
                            <input
                              type="time"
                              value={hours.end}
                              onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                              className="modern-time-input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="modern-form-actions">
                    <button 
                      type="button" 
                      className="modern-cancel-btn"
                      onClick={() => setIsEditingWorkingHours(false)}
                    >
                      <span className="btn-icon">✖️</span>
                      {t('avocatDashboard.cancel')}
                    </button>
                    <button 
                      type="button" 
                      className="modern-save-btn"
                      onClick={handleSaveWorkingHours}
                      disabled={workingHoursLoading}
                    >
                      <span className="btn-icon">{workingHoursLoading ? '⏳' : '💾'}</span>
                      {workingHoursLoading ? t('avocatDashboard.saving') : t('avocatDashboard.save')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="working-hours-display">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="working-hours-item">
                    <div className="day-info">
                      <span className="day-name">{t(`avocatDashboard.days.${day}`)}</span>
                      <div className="day-schedule">
                        {hours.isOpen ? (
                          <span className="schedule-time">{hours.start} - {hours.end}</span>
                        ) : (
                          <span className="schedule-closed">{t('avocatDashboard.closed')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="calendar-view">
        <div className="view-header">
          <h2 className="view-title">{t('avocatDashboard.calendar')}</h2>
          <p className="view-subtitle">{t('avocatDashboard.calendarViewSubtitle')}</p>
        </div>
        <div className="coming-soon">
          <div className="coming-soon-icon"></div>
          <h3>{t('avocatDashboard.calendarComingSoon')}</h3>
          <p>{t('avocatDashboard.calendarComingSoonDesc')}</p>
        </div>
      </div>
    );
  };

  const renderCasesView = () => {
    return <CasesManager appointments={appointments} user={user} />;
  };

  const renderStatisticsView = () => {
    return (
      <div className="statistics-view">
        <div className="view-header">
          <h2 className="view-title">{t('avocatDashboard.statistics')}</h2>
          <p className="view-subtitle">{t('avocatDashboard.analyzePerformance')}</p>
        </div>

        <div className="stats-overview">
          <div className="overview-card">
            <h3>{t('avocatDashboard.overview')}</h3>
            <div className="overview-stats">
              <div className="overview-stat">
                <span className="stat-value">{statistics.totalAppointments}</span>
                <span className="stat-label">{t('avocatDashboard.totalAppointments')}</span>
              </div>
              <div className="overview-stat">
                <span className="stat-value">{statistics.confirmedAppointments}</span>
                <span className="stat-label">{t('avocatDashboard.confirmedAppointments')}</span>
              </div>
              <div className="overview-stat">
                <span className="stat-value">{statistics.pendingRequests}</span>
                <span className="stat-label">{t('avocatDashboard.pendingRequests')}</span>
              </div>
            </div>
          </div>

          <div className="overview-card">
            <h3>{t('avocatDashboard.performance')}</h3>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">{t('avocatDashboard.approvalRate')}</span>
                <span className="metric-value">
                  {statistics.totalAppointments > 0 
                    ? Math.round((statistics.confirmedAppointments / statistics.totalAppointments) * 100)
                    : 0}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">{t('avocatDashboard.todayAppointments')}</span>
                <span className="metric-value">{statistics.todayAppointments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'appointments':
        return renderAppointmentsView();
      case 'calendar':
        return renderCalendarView();
      case 'cases':
        return renderCasesView();
      case 'profile':
        return renderProfileView();
      case 'statistics':
        return renderStatisticsView();
      default:
        return renderAppointmentsView();
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('avocatDashboard.loading')}</p>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-icon">⚖</div>
          <h2 className="verification-title">
            {t('avocatDashboard.accountVerificationRequired')}
          </h2>
          <p className="verification-text">
            {t('avocatDashboard.verificationPendingText')}
          </p>
          <div className="verification-status">
            {t('avocatDashboard.verificationInProgress')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="dashboard-container">
      {/* Sticky Navbar */}
      <div className="navbar-wrapper">
        <Navbar />
      </div>

      {/* Mobile Menu Toggle */}
      <div className="mobile-menu-toggle">
        <button 
          className="menu-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      <div className="main-layout">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-content">
            

         

          <div className="nav-menu">
            <button className={`nav-item ${currentView === 'appointments' ? 'active' : ''}`} onClick={() => { setCurrentView('appointments'); setIsMobileMenuOpen(false); }}>
              <span className="nav-text">{t('avocatDashboard.myConsultations')}</span>
            </button>
            <button className={`nav-item ${currentView === 'cases' ? 'active' : ''}`} onClick={() => { setCurrentView('cases'); setIsMobileMenuOpen(false); }}>
              <span className="nav-text">{t('avocatDashboard.myCases')}</span>
            </button>
            <button className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false); }}>
              <span className="nav-text">{t('avocatDashboard.myInformation')}</span>
            </button>
            <button className={`nav-item ${currentView === 'statistics' ? 'active' : ''}`} onClick={() => { setCurrentView('statistics'); setIsMobileMenuOpen(false); }}>
              <span className="nav-text">{t('avocatDashboard.statistics')}</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <button className="signout-btn" onClick={handleLogout}><span className="signout-text">{t('avocatDashboard.signOut')}</span></button>
          </div>
          </div>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>

      <BookingModal
        avocat={user} // Use current user (the lawyer) instead of appointment's avocatId
        open={bookingModalOpen}
        onClose={() => { setBookingModalOpen(false); setAppointmentToReschedule(null); }}
        mode="reschedule"
        existingAppointment={appointmentToReschedule}
        onRescheduled={(updated) => {
          const updatedObj = updated._id ? updated : updated.rendezvous || updated;
          setAppointments(prev => {
            const next = prev.map(a => a._id === updatedObj._id ? updatedObj : a);
            const sorted = sortAppointmentsByCreated(next);
            setStatistics(computeStatisticsFrom(sorted));
            return sorted;
          });
        }}
      />


  <style>{`
        /* Elegant design tokens */
        :root{
          --bg: #F7F8FA;
          --card: #FFFFFF;
          --muted: #6b7280;
          --text: #1f2937;
          --accent: #234e52; /* deeper teal */
          --gold: #cfae70;
          --shadow-elev: 0 10px 30px rgba(15,23,42,0.08);
          --radius-lg: 14px;
          --radius-md: 10px;
        }

        .dashboard-container {
          background: var(--bg);
          min-height: 100vh;
          font-family: var(--font-sans);
          color: var(--text);
          -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
        }

        /* Sticky Navbar Wrapper */
        .navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--primary-navy);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .main-layout { display:flex; flex-direction: column; min-height:calc(100vh - 80px); }

        /* Desktop Sidebar - Traditional vertical sidebar */
        .sidebar {
          position: fixed;
  top: 80px;
  left: 0;
  flex-direction: column; /* FIX: était "flex direction" */
  width: 280px;
  height: calc(100vh - 80px);
  background: linear-gradient(135deg, #0f2740 0%, #102d3d 100%);
  color: #fff;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  z-index: 1000;
  overflow-y: auto;
  transition: all 0.3s ease;
        }

        .sidebar-content {
          padding: 20px 0;
        }

        .sidebar-header{ 
          padding: 20px; 
          text-align: center; 
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-subtitle{ 
          color: rgba(255,255,255,0.85); 
          font-weight: 700; 
          letter-spacing: 0.2px; 
          font-size: 1.1rem;
          white-space: nowrap;
        }

        .user-profile {
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-card { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          padding: 8px; 
          background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent); 
          border-radius: 12px; 
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .profile-card:hover{ 
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); 
        }
        .profile-avatar-card{ 
          width: 40px; 
          height: 40px; 
          border-radius: 12px; 
          overflow: hidden; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: var(--gold); 
          color: #08303a; 
          font-weight: 800; 
          font-size: 16px; 
          transition: all 0.3s ease; 
          flex-shrink: 0;
        }
        .profile-avatar-card:hover{ transform: scale(1.05); }
        .profile-card-details .profile-name{ 
          margin: 0; 
          font-size: 14px; 
          font-weight: 800; 
          color: #fff; 
        }
        .profile-card-details .profile-role{ 
          color: rgba(255,255,255,0.8); 
          font-size: 11px; 
          margin-top: 2px; 
        }

        .nav-menu { 
          padding: 0; 
          display: flex; 
          flex-direction: column; 
          list-style: none;
          margin: 0;
        }
        .nav-item{ 
          text-align: left; 
          padding: 15px 25px; 
          background: transparent; 
          color: rgba(255,255,255,0.95); 
          border: none; 
          cursor: pointer; 
          font-weight: 600; 
          transition: all .3s ease; 
          width: 100%;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid transparent;
        }
        .nav-item:hover{ 
          color: var(--gold); 
          background: rgba(255,255,255,0.05); 
        }
        .nav-item.active{ 
          background: rgba(255,255,255,0.08); 
          color: var(--gold); 
          border-left-color: var(--gold); 
        }

        .sidebar-footer{ 
          padding: 20px; 
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: auto;
        }
        .signout-btn{ 
          padding: 12px 20px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  color: #fff;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 14px;
  width: 100%;
  cursor: pointer;
        }
        }
        .signout-btn:hover{ 
          background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-1px);
        }
@media (max-width: 768px) {
  /* Bouton hamburger visible sur mobile */
  .mobile-menu-toggle {
    display: block;
  }

  /* Sidebar devient un drawer qui slide depuis la gauche */
  .sidebar {
    position: fixed;
    top: 0;
    left: -100%; /* Caché par défaut */
    width: 85%;
    max-width: 320px;
    height: 100vh;
    z-index: 1002;
    transition: left 0.3s ease;
    box-shadow: 3px 0 15px rgba(0,0,0,0.2);
  }

  /* Quand le menu est ouvert */
  .sidebar.mobile-open {
    left: 0;
  }

  /* Overlay sombre */
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1001;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar-overlay.active {
    opacity: 1;
    pointer-events: auto;
  }

  /* Content prend toute la largeur */
  .content-area {
    margin-left: 0;
    padding-top: 80px;
  }

  /* Navigation items en mode mobile */
  .nav-item {
    width: 100%;
    text-align: left;
    border-left: 4px solid transparent;
    padding: 15px 25px;
  }

  .nav-item.active {
    border-left-color: var(--gold);
  }

  /* Profile card ajustements */
  .profile-card {
    white-space: normal;
  }
}

/* 4. SMALL MOBILE */
@media (max-width: 480px) {
  .sidebar {
    width: 90%;
    max-width: 280px;
  }

  .sidebar-subtitle {
    font-size: 1rem;
  }

  .nav-item {
    padding: 12px 20px;
    font-size: 14px;
  }
}
        /* Loading Animation */
        .loading-container{ display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; }
        .loading-spinner{ width:40px; height:40px; border:3px solid rgba(207,174,112,0.2); border-top:3px solid var(--secondary-gold); border-radius:50%; animation: spin 1s linear infinite; margin-bottom:16px; }
        @keyframes spin{ 0%{ transform: rotate(0deg); } 100%{ transform: rotate(360deg); } }

        /* Status badges with transitions */
        .status-badge{ padding:4px 8px; border-radius:6px; font-size:12px; font-weight:700; transition: all 0.2s ease; }
        .status-confirmed{ background:#10b981; }
        .status-pending{ background:#f59e0b; }
        .status-paid{ background:var(--secondary-gold); }
        .status-refused{ background:#ef4444; }

        /* Refresh status button */
        .profile-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .refresh-status-btn {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .refresh-status-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          transform: rotate(90deg);
        }
        
        .refresh-status-btn:active {
          transform: rotate(180deg);
        }

        /* Mobile Menu Toggle */
        .mobile-menu-toggle {
          display: none;
          position: fixed;
          top: 70px;
          left: 16px;
          z-index: 1001;
          background: var(--primary-navy);
          border-radius: 8px;
          padding: 4px;
        }

        .menu-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hamburger {
          width: 24px;
          height: 18px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hamburger span {
          display: block;
          height: 3px;
          width: 100%;
          background: white;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          color: white;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }

        .sidebar-overlay {
          display: none;
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          min-width: max-content;
        }

        /* Content */
        .content-area{ 
          margin-left: 280px;
          padding: 20px; 
          min-height: calc(100vh - 80px); 
          background: #f8fafc;
          transition: all 0.3s ease; 
        }

        /* Mobile overlay */
        .sidebar-overlay {
          display: none;
        }
        .view-title{ font-family: var(--font-serif); font-size:28px; color:#0b2540; margin:0 0 6px 0; transition: color 0.2s ease; }
        .view-subtitle{ color:var(--muted); margin:0 0 18px 0; transition: color 0.2s ease; }

  /* Cards & stats */
  .stats-grid{ 
    display: flex; 
    gap: 1rem; 
    margin-bottom: 2rem; 
    overflow-x: auto; 
    padding-bottom: 8px; 
    scrollbar-width: thin; 
    scrollbar-color: var(--gold) transparent; 
  }
  
  .stats-grid::-webkit-scrollbar {
    height: 6px;
  }

  .stats-grid::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .stats-grid::-webkit-scrollbar-thumb {
    background: var(--gold);
    border-radius: 3px;
  }
  
  .stat-card{ 
    background: var(--card); 
    border-radius: var(--radius-lg); 
    padding: 1rem 1.2rem; 
    box-shadow: var(--shadow-elev); 
    border: 1px solid #f3f4f6; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    min-width: 140px; 
    flex-shrink: 0; 
    display: flex; 
    gap: 8px; 
    align-items: center; 
  }
  .stat-card{ transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms, border-color 220ms, background-color 220ms, color 220ms }
  .stat-card:hover{ transform: translateY(-6px); box-shadow: 0 14px 30px rgba(15,23,42,0.08) }
  .stat-card.stat-small .stat-content h4{ color:var(--accent); margin:0; font-size:1.1rem }
  .stat-card .stat-icon{ font-size:11px; color:var(--muted); min-width:30px; transition: color 220ms }
  .stat-card .stat-content .stat-label-small{ font-size:11px; color:var(--muted); margin:0; transition: color 220ms }
  .stat-card .stat-content h4{ transition: color 220ms }
  .stat-card.active-filter{ 
    border-color: rgba(0,0,0,0.06);
    background: var(--secondary-gold);
    color: var(--primary-navy);
    box-shadow: 0 10px 26px rgba(27,38,59,0.06), inset 0 0 0 2px rgba(27,38,59,0.02);
  }
  /* ensure icon, label and heading inherit the active text color and animate */
  .stat-card.active-filter .stat-icon, .stat-card.active-filter .stat-content, .stat-card.active-filter .stat-content h4 { color: var(--primary-navy); }

        .appointments-grid{ display:grid; gap:18px; transition: all 0.3s ease; }
        .appointment-card{ background:var(--card); border-radius:12px; padding:18px; box-shadow:0 6px 20px rgba(15,23,42,0.04); border:1px solid rgba(15,23,42,0.03); transition: all 0.3s ease; }
        .appointment-card:hover{ transform: translateY(-4px); box-shadow:0 12px 32px rgba(15,23,42,0.08); }

        /* Elegant Appointment Card Styles for Lawyer Dashboard */
        .appointment-card-elegant {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 0;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          margin-bottom: 1rem;
          overflow: hidden;
          position: relative;
        }

        .appointment-card-elegant::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--gold) 0%, var(--accent) 100%);
        }

        .appointment-card-elegant:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: var(--accent);
        }

        .appointment-card-elegant.confirmé::before {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .appointment-card-elegant.en_attente::before {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }

        .appointment-card-elegant.payé::before {
          background: linear-gradient(90deg, #CFAE70, #B8941F);
        }

        .appointment-card-elegant.refusé::before {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .appointment-card-main {
          padding: 1.5rem;
          background: transparent;
        }

        .appointment-header-elegant {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .client-info-elegant {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .client-name-elegant {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.3;
          font-family: var(--font-serif);
        }

        .client-email-elegant {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 1rem;
          border-radius: 20px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          max-width: fit-content;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .appointment-timing {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          min-width: 100px;
        }

        .date-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, var(--accent) 0%, #1e40af 100%);
          color: white;
          border-radius: 12px;
          padding: 0.75rem;
          min-width: 70px;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }

        .date-display .day {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1;
        }

        .date-display .month {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }

        .time-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .time-display .time {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .time-display .day-name {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .appointment-actions-elegant {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .primary-actions {
          display: flex;
          gap: 1rem;
        }

        .secondary-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-family: var(--font-sans);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-btn .btn-icon {
          font-size: 1rem;
        }

        .primary-action {
          background: linear-gradient(135deg, var(--gold) 0%, #d97706 100%);
          color: white;
          flex: 1;
          justify-content: center;
        }

        .primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(217, 119, 6, 0.3);
        }

        .approve-action {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          flex: 1;
          justify-content: center;
        }

        .approve-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        }

        .secondary-action {
          background: linear-gradient(135deg, var(--accent) 0%, #1e40af 100%);
          color: white;
        }

        .secondary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
        }

        .danger-action {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .danger-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
        }

        .appointment-details-elegant {
          padding: 1rem 1.5rem;
          background: rgba(248, 250, 252, 0.5);
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .appointment-message-elegant,
        .payment-info-elegant {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }

        .message-title,
        .payment-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .message-title::before {
          content: '💬';
          font-size: 1rem;
        }

        .payment-title::before {
          content: '💳';
          font-size: 1rem;
        }

        .message-content {
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
        }

        .payment-status,
        .payment-method,
        .payment-confirmed {
          color: #64748b;
        }

        .payment-status {
          font-weight: 600;
          color: #1e293b;
        }

        /* Responsive Design - Mobile */
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block;
          }

          .main-layout {
            flex-direction: column;
          }

          /* Mobile: Convert sidebar to drawer */
          .sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            width: 85%;
            max-width: 320px;
            height: 100vh;
            background: linear-gradient(135deg, #0f2740 0%, #102d3d 100%);
            z-index: 1001;
            transition: left 0.3s ease;
            overflow-y: auto;
            box-shadow: 3px 0 15px rgba(0,0,0,0.2);
          }

          .sidebar.mobile-open {
            left: 0;
          }

          .sidebar-content {
            flex-direction: column;
            height: 100%;
            padding: 0;
          }

          .sidebar-header {
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
          }

          .close-sidebar-btn {
            background: none;
            border: none;
            color: var(--gold);
            font-size: 24px;
            cursor: pointer;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1001;
            min-width: 40px;
            min-height: 40px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .close-sidebar-btn:hover {
            background-color: rgba(207, 174, 112, 0.1);
          }

          .user-profile {
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 20px;
          }

          .sidebar-content {
            flex-direction: column;
            height: 100%;
            min-width: auto;
            align-items: stretch;
          }

          .sidebar-header {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 28px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .sidebar-subtitle {
            white-space: normal;
            font-size: 1.25rem;
          }

          .mobile-close-btn {
            display: block;
          }

          .user-profile {
            border-right: none;
            padding: 20px;
            border-bottom: none;
          }

          .profile-card {
            white-space: normal;
            padding: 14px;
          }

          .profile-avatar-card {
            width: 64px;
            height: 64px;
            font-size: 20px;
          }

          .profile-card-details .profile-name {
            font-size: 16px;
          }

          .profile-card-details .profile-role {
            font-size: 13px;
            margin-top: 4px;
          }

          .nav-menu {
            flex-direction: column;
            padding: 16px 0;
            gap: 0;
            flex: 1;
          }

          .nav-item {
            width: 100%;
            padding: 12px 20px;
            text-align: left;
            border-left: 4px solid transparent;
            white-space: normal;
            min-width: auto;
            color: rgba(255,255,255,0.9) !important;
            font-size: 16px;
            font-weight: 500;
          }

          .nav-item:hover {
            background: rgba(255,255,255,0.1);
            color: var(--gold) !important;
          }

          .nav-item.active {
            border-left-color: var(--gold);
            background: rgba(207,174,112,0.15);
            color: var(--gold) !important;
          }

          .sidebar-footer {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding: 18px;
            position: relative;
          }

          .signout-btn {
            width: 100%;
            padding: 12px;
            font-size: 14px;
            white-space: normal;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
          }

          .content-area {
            margin-left: 0;
            margin-top: 80px;
            padding: 15px;
          }

          .nav-item:hover {
            transform: translateX(6px);
          }

          .nav-item.active {
            border-bottom: none;
            box-shadow: inset 3px 0 0 var(--gold);
          }

          .sidebar-footer {
            border-left: none;
            padding: 18px;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }

          .signout-btn {
            width: 100%;
            padding: 12px 14px;
            font-size: 14px;
            white-space: normal;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .sidebar.mobile-open .sidebar-overlay {
            opacity: 1;
          }

          .content-area {
            margin-left: 0;
            padding: 20px;
            padding-top: 80px;
            min-height: calc(100vh - 80px);
          }

          /* Profile Section Mobile Improvements */
          .profile-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-input, .form-textarea, .form-select {
            padding: 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
            border-radius: 12px;
            border: 2px solid #e2e8f0;
          }

          .form-input:focus, .form-textarea:focus, .form-select:focus {
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(207, 174, 112, 0.1);
          }

          .form-label {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #374151;
          }

          .btn, .modern-btn {
            padding: 1rem 1.5rem;
            font-size: 1rem;
            border-radius: 12px;
            min-height: 48px; /* Better touch targets */
            font-weight: 600;
          }

          .card {
            border-radius: 16px;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }

          .card-header {
            padding: 1.5rem;
          }

          .card-content {
            padding: 1.5rem;
          }

          .card-title {
            font-size: 1.25rem;
            font-weight: 700;
          }

          /* Avatar Upload Mobile Improvements */
          .avatar-upload-section {
            text-align: center;
            padding: 1rem;
          }

          .avatar-preview {
            width: 120px;
            height: 120px;
            margin: 0 auto 1rem;
          }

          .avatar-upload-btn {
            width: 100%;
            padding: 1rem;
            font-size: 1rem;
          }

          /* Working Hours Mobile Improvements */
          .working-hours-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .working-hours-day {
            padding: 1rem;
            border-radius: 12px;
          }

          /* Language Selection Mobile */
          .language-selection {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .language-checkbox {
            min-width: 120px;
            padding: 0.75rem;
          }
        }

        /* Extra Mobile Responsive Improvements */
        @media (max-width: 480px) {
          .content-area {
            padding: 16px;
            padding-top: 75px;
          }

          .sidebar {
            width: 260px;
            left: -100%;
          }

          .sidebar-header {
            padding: 16px;
          }

          .sidebar-subtitle {
            font-size: 1.1rem;
          }

          /* Extra small screen form improvements */
          .form-input, .form-textarea, .form-select {
            padding: 0.875rem;
            font-size: 16px;
          }

          .btn, .modern-btn {
            padding: 0.875rem 1.25rem;
            font-size: 0.95rem;
          }

          .card-header, .card-content {
            padding: 1rem;
          }

          .view-title {
            font-size: 1.5rem;
          }

          .avatar-preview {
            width: 100px;
            height: 100px;
          }
        }

          /* Close overlay when clicked */
          .sidebar:not(.mobile-open) .sidebar-overlay {
            pointer-events: none;
          }
        }

        /* Mobile responsiveness for elegant cards */
        @media (max-width: 768px) {
          .appointment-header-elegant {
            flex-direction: column;
            gap: 1rem;
          }

          .appointment-timing {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            align-items: center;
          }

          .appointment-actions-elegant {
            padding: 1rem;
          }

          .primary-actions {
            flex-direction: column;
            gap: 0.75rem;
          }

          .secondary-actions {
            justify-content: space-between;
          }

          .date-display {
            padding: 0.5rem;
            min-width: 60px;
          }

          .date-display .day {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .appointment-card-elegant {
            margin: 0 -0.5rem 1rem -0.5rem;
            border-radius: 12px;
          }

          .appointment-card-main {
            padding: 1rem;
          }

          .client-name-elegant {
            font-size: 1.1rem;
          }

          .secondary-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .action-btn {
            justify-content: center;
          }
        }

        /* Profile & forms */
        .profile-section{ background:var(--card); border-radius:var(--radius-lg); padding:26px; box-shadow:var(--shadow-elev); border:1px solid rgba(15,23,42,0.03); transition: all 0.3s ease; }
        .profile-section:hover{ box-shadow:0 12px 32px rgba(15,23,42,0.08); }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .section-title{ font-size:1.1rem; font-weight:800; color:#0b2540; transition: color 0.2s ease; }

        /* Modern Profile Styles */
        .profile-hero{ 
          background: linear-gradient(135deg, var(--primary-navy) 0%, #1a4856 100%); 
          border-radius: 20px; 
          padding: 40px; 
          margin-bottom: 32px; 
          display: flex; 
          align-items: center; 
          gap: 24px; 
          color: white;
          box-shadow: 0 20px 60px rgba(15,23,42,0.15);
          position: relative;
          overflow: hidden;
        }
        .profile-hero::before{
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(207,174,112,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .profile-hero-avatar{ 
          position: relative; 
          z-index: 2; 
        }
        .hero-avatar-img, .hero-avatar-placeholder{ 
          width: 120px; 
          height: 120px; 
          border-radius: 20px; 
          object-fit: cover;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .hero-avatar-placeholder{ 
          background: var(--secondary-gold); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 48px; 
          font-weight: 800; 
          color: var(--primary-navy);
        }

        .profile-hero-info{ flex: 1; z-index: 2; position: relative; }
        .hero-name{ 
          font-size: 32px; 
          font-weight: 800; 
          margin: 0 0 8px 0; 
          color: white;
          font-family: var(--font-serif);
        }
        .hero-specialization{ 
          font-size: 18px; 
          color: var(--secondary-gold); 
          margin: 0 0 16px 0; 
          font-weight: 600;
        }
        .hero-meta{ 
          display: flex; 
          gap: 24px; 
          font-size: 14px; 
          color: rgba(255,255,255,0.8); 
        }
        .hero-experience, .hero-location{ 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }
        .hero-experience::before{ content: '🎓'; }
        .hero-location::before{ content: '📍'; }

        .profile-hero-actions{ z-index: 2; position: relative; }
        .modern-edit-btn{
          background: var(--secondary-gold);
          color: var(--primary-navy);
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(207,174,112,0.3);
        }
        .modern-edit-btn:hover{
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(207,174,112,0.4);
        }

        .modern-profile-section{
          background: var(--card);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.06);
          transition: all 0.3s ease;
        }
        .modern-profile-section:hover{
          box-shadow: 0 8px 40px rgba(15,23,42,0.08);
          transform: translateY(-2px);
        }

        .modern-section-header{
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(15,23,42,0.04);
        }

        .section-header-content{ flex: 1; }
        .modern-section-title{
          font-size: 20px;
          font-weight: 800;
          color: var(--primary-navy);
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-description{
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .modern-secondary-btn{
          background: transparent;
          color: var(--primary-navy);
          border: 2px solid rgba(15,23,42,0.1);
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .modern-secondary-btn:hover{
          background: rgba(15,23,42,0.04);
          border-color: rgba(15,23,42,0.2);
          transform: translateY(-1px);
        }

        /* Modern Info Cards */
        .profile-info-cards{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .info-card{
          background: rgba(15,23,42,0.02);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(15,23,42,0.06);
          transition: all 0.2s ease;
        }
        .info-card:hover{
          background: rgba(15,23,42,0.03);
          border-color: rgba(15,23,42,0.12);
          transform: translateY(-1px);
        }
        .info-card.full-width{
          grid-column: 1 / -1;
        }

        .info-card-header{
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .info-icon{
          font-size: 18px;
        }
        .info-title{
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-navy);
          margin: 0;
        }
        .info-value{
          font-size: 16px;
          color: var(--text);
          margin: 0;
          line-height: 1.5;
        }
        .bio-text{
          line-height: 1.6;
          color: var(--muted);
        }

        /* Modern Form Styles */
        .modern-form-container{
          background: rgba(207,174,112,0.02);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(207,174,112,0.1);
        }

        .modern-form-grid{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .modern-form-group{
          display: flex;
          flex-direction: column;
        }
        .modern-form-group.full-width{
          grid-column: 1 / -1;
        }

        .modern-label{
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-navy);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .modern-input, .modern-select, .modern-textarea{
          width: 100%;
          padding: 14px 16px;
          border: 2px solid rgba(15,23,42,0.08);
          border-radius: 10px;
          font-size: 15px;
          color: var(--text);
          background: white;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .modern-input:focus, .modern-select:focus, .modern-textarea:focus{
          outline: none;
          border-color: var(--secondary-gold);
          box-shadow: 0 0 0 3px rgba(207,174,112,0.1);
          transform: translateY(-1px);
        }
        .modern-input:hover, .modern-select:hover, .modern-textarea:hover{
          border-color: rgba(15,23,42,0.15);
        }

        .address-inputs{
          display: flex;
          gap: 12px;
          align-items: stretch;
        }
        .city-select{
          min-width: 200px;
          flex-shrink: 0;
        }
        .address-input{
          flex: 1;
        }

        .modern-form-actions{
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(15,23,42,0.08);
        }

        .modern-cancel-btn{
          background: transparent;
          color: var(--muted);
          border: 2px solid rgba(15,23,42,0.1);
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .modern-cancel-btn:hover{
          background: rgba(15,23,42,0.04);
          color: var(--text);
          border-color: rgba(15,23,42,0.2);
        }

        .modern-save-btn{
          background: var(--secondary-gold);
          color: var(--primary-navy);
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(207,174,112,0.2);
        }
        .modern-save-btn:hover:not(:disabled){
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(207,174,112,0.3);
        }
        .modern-save-btn:disabled{
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-icon{
          font-size: 16px;
          line-height: 1;
        }

        /* Working Hours Styles */
        .working-hours-form{
          display: grid;
          gap: 20px;
        }
        
        .working-hours-day{
          padding: 20px;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 12px;
          background: rgba(15,23,42,0.02);
          transition: all 0.2s ease;
        }
        .working-hours-day:hover{
          border-color: rgba(15,23,42,0.12);
          background: rgba(15,23,42,0.04);
        }
        
        .day-header{
          margin-bottom: 16px;
        }
        
        .day-name{
          font-size: 16px;
          font-weight: 700;
          color: var(--primary-navy);
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }
        
        .day-checkbox{
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid rgba(15,23,42,0.2);
          background: white;
          cursor: pointer;
        }
        .day-checkbox:checked{
          background: var(--secondary-gold);
          border-color: var(--secondary-gold);
        }
        
        .time-inputs{
          display: flex;
          gap: 16px;
          align-items: end;
        }
        
        .time-input-group{
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .time-label{
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
        }
        
        .modern-time-input{
          padding: 10px 12px;
          border: 2px solid rgba(15,23,42,0.08);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text);
          background: white;
          transition: all 0.2s ease;
        }
        .modern-time-input:focus{
          outline: none;
          border-color: var(--secondary-gold);
          box-shadow: 0 0 0 3px rgba(207,174,112,0.1);
        }
        
        .working-hours-display{
          display: grid;
          gap: 12px;
        }
        
        .working-hours-item{
          padding: 16px 20px;
          border-radius: 10px;
          background: rgba(15,23,42,0.02);
          border: 1px solid rgba(15,23,42,0.06);
          transition: all 0.2s ease;
        }
        .working-hours-item:hover{
          background: rgba(15,23,42,0.04);
          border-color: rgba(15,23,42,0.12);
        }
        
        .day-info{
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .working-hours-item .day-name{
          font-size: 15px;
          font-weight: 700;
          color: var(--primary-navy);
          text-transform: capitalize;
        }
        
        .day-schedule{
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .schedule-time{
          font-size: 14px;
          color: var(--text);
          font-weight: 600;
          padding: 4px 8px;
          background: rgba(207,174,112,0.1);
          border-radius: 6px;
        }
        
        .schedule-closed{
          font-size: 14px;
          color: var(--muted);
          font-style: italic;
        }

        /* Avatar Upload Styles */
        .avatar-upload-section{
          margin-bottom: 32px;
        }
        
        .avatar-upload-container{
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .avatar-preview{
          width: 120px;
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          border: 3px solid rgba(15,23,42,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,0.02);
        }
        
        .avatar-preview-img{
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-preview-placeholder{
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--secondary-gold);
          color: var(--primary-navy);
          font-size: 48px;
          font-weight: 800;
        }
        
        .avatar-upload-controls{
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .avatar-file-input{
          display: none;
        }
        
        .avatar-upload-btn{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--secondary-gold);
          color: var(--primary-navy);
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 14px;
          width: fit-content;
        }
        .avatar-upload-btn:hover{
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(207,174,112,0.3);
        }
        .avatar-upload-btn.uploading{
          opacity: 0.7;
          cursor: not-allowed;
          pointer-events: none;
        }
        
        .avatar-help-text{
          font-size: 12px;
          color: var(--muted);
          margin: 0;
          line-height: 1.4;
        }

        /* Read-only field styles */
        .modern-input.read-only{
          background: rgba(15,23,42,0.03);
          border-color: rgba(15,23,42,0.06);
          color: var(--muted);
          cursor: not-allowed;
        }
        
        .read-only-note{
          font-size: 12px;
          color: var(--muted);
          margin: 4px 0 0 0;
          font-style: italic;
        }

        .edit-btn{ background:transparent; color:var(--accent); border:1px solid rgba(15,23,42,0.06); padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; transition: all .16s ease; }
        .edit-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(15,23,42,0.06); background: rgba(207,174,112,0.04); }

        .form-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; }
        .form-group label{ display:block; font-weight:700; color:#334155; margin-bottom:8px; font-size:13px; }

        .form-input, .form-textarea{ width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(15,23,42,0.06); background: #fff; font-size:14px; color:var(--text); transition: all .2s ease; }
        .form-input:focus, .form-textarea:focus{ outline:none; box-shadow:0 8px 24px rgba(15,23,42,0.06); border-color:var(--accent); transform: translateY(-1px); }
        .form-input:hover, .form-textarea:hover{ border-color: rgba(15,23,42,0.12); }

        .form-actions{ display:flex; gap:12px; justify-content:flex-end; margin-top:16px; }
        .cancel-btn{ padding:10px 18px; background:transparent; border:1px solid rgba(15,23,42,0.06); color:var(--accent); border-radius:8px; font-weight:800; transition: all 0.2s ease; }
        .cancel-btn:hover{ background: rgba(15,23,42,0.02); transform: translateY(-1px); box-shadow:0 4px 12px rgba(15,23,42,0.08); }
        .save-btn{ padding:10px 18px; background:var(--gold); color:#10202a; border:none; border-radius:8px; font-weight:800; box-shadow:0 8px 20px rgba(207,174,112,0.12); transition: all 0.2s ease; }
        .save-btn:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 12px 28px rgba(207,174,112,0.2); }
        .save-btn:disabled{ opacity:0.6; cursor:not-allowed; }
        .mark-paid-btn{ padding:8px 14px; background:var(--secondary-gold); color:var(--primary-navy); border:none; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; transition: all 0.2s ease; }
        .mark-paid-btn:hover{ transform:translateY(-1px); box-shadow:0 4px 12px rgba(207,174,112,0.3); }
        .approve-btn{ padding:8px 14px; background:#10b981; color:white; border:none; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; transition: all 0.2s ease; }
        .approve-btn:hover{ transform:translateY(-1px); box-shadow:0 4px 12px rgba(16,185,129,0.3); }
        .reject-btn{ padding:8px 14px; background:#ef4444; color:white; border:none; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; transition: all 0.2s ease; }
        .reject-btn:hover{ transform:translateY(-1px); box-shadow:0 4px 12px rgba(239,68,68,0.3); }
        .appointment-actions{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }

        .info-item label{ font-weight:700; color:var(--muted); font-size:12px; text-transform:uppercase; margin-bottom:6px; }
        .info-item p{ color:var(--text); font-size:14px; margin:0; padding:8px 0; }

        /* Enhanced responsive design for mobile devices */
        
        /* Large tablets and small desktops */
        @media (max-width: 1024px) {
          .dashboard-container{ flex-direction: column; }
          .sidebar{ width: 100%; height: auto; position: static; border-radius: 0; border-right: none; border-bottom: 1px solid var(--border); }
          .sidebar-nav{ flex-direction: row; overflow-x: auto; gap: 8px; padding: 12px; }
          .sidebar-nav-item{ min-width: max-content; flex-shrink: 0; padding: 8px 16px; font-size: 12px; }
          .content-area{ margin-left: 0; padding: 20px; min-height: calc(100vh - 140px); }
          .hero-card{ padding: 20px; }
          .hero-content{ flex-direction: column; text-align: center; gap: 16px; }
          .hero-avatar{ margin-bottom: 12px; }
          .modern-form-grid{ grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        }

        /* Tablets */
        @media (max-width: 768px) {
          .content-area{ padding: 16px; }
          .hero-card{ padding: 16px; margin-bottom: 16px; }
          .hero-name{ font-size: 1.4rem; }
          .hero-location, .hero-experience{ font-size: 12px; }
          .section-card{ padding: 16px; margin-bottom: 16px; }
          .section-title{ font-size: 1.1rem; }
          .stats-grid{ 
            gap: 0.8rem; 
            margin-bottom: 1.5rem; 
          }
          
          .stat-card {
            min-width: 120px;
            padding: 0.8rem 1rem;
          }
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
} }
          .stat-card{ padding: 12px; }
          .stat-number{ font-size: 1.4rem; }
          .stat-label{ font-size: 11px; }
          .filter-controls{ flex-wrap: wrap; gap: 8px; }
          .modern-btn{ padding: 8px 12px; font-size: 12px; min-width: auto; }
          .avatar-section{ flex-direction: column; align-items: center; text-align: center; gap: 12px; }
          .avatar-preview{ margin-bottom: 12px; }
          .working-hours-grid{ grid-template-columns: 1fr; gap: 8px; }
          .day-schedule{ padding: 12px; }
        }

        /* Large phones */
        @media (max-width: 480px) {
          .content-area{ padding: 12px; }
          .hero-card{ padding: 12px; margin-bottom: 12px; }
          .hero-name{ font-size: 1.2rem; }
          .hero-location, .hero-experience{ font-size: 11px; }
          .section-card{ padding: 12px; margin-bottom: 12px; }
          .section-title{ font-size: 1rem; margin-bottom: 12px; }
          .stats-grid{ display: flex; flex-wrap: wrap; gap: 6px; }
          .stat-card{ padding: 10px; }
          .stat-number{ font-size: 1.2rem; }
          .stat-label{ font-size: 10px; }
          .modern-form-grid{ grid-template-columns: 1fr; gap: 12px; }
          .modern-btn{ padding: 8px 12px; font-size: 11px; width: 100%; }
          .filter-controls{ flex-direction: column; }
          .appointment-card{ padding: 12px; }
          .appointment-header{ flex-direction: column; align-items: flex-start; gap: 8px; }
          .appointment-actions{ flex-direction: column; }
          .approve-btn, .reject-btn{ width: 100%; justify-content: center; }
          .sidebar-nav{ padding: 8px; gap: 4px; }
          .sidebar-nav-item{ padding: 6px 12px; font-size: 11px; }
          .avatar-upload-btn{ width: 100%; justify-content: center; padding: 10px; }
          .modern-input, .modern-select, .modern-textarea{ font-size: 14px; padding: 12px; }
          .working-hours-title{ font-size: 14px; }
          .time-inputs{ gap: 4px; }
          .time-input{ font-size: 12px; padding: 6px; }
        }

        /* Small phones */
        @media (max-width: 375px) {
          .content-area{ padding: 8px; }
        }

        /* Appointment Details Modal Styles */
        .appointment-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 1rem;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          isolation: isolate;
          overflow-y: auto;
        }

        .appointment-details-modal-content {
          background: white;
          border-radius: var(--radius-lg);
          max-width: 600px;
          width: 100%;
          max-height: 85vh;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 10000;
          margin: auto;
          transform: scale(1);
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .appointment-details-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .appointment-details-modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--muted);
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .appointment-details-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .appointment-details-section {
          margin-bottom: 2rem;
        }

        .appointment-details-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: var(--text);
          font-weight: 700;
        }

        .lawyer-info-card {
          display: flex;
          gap: 1rem;
          background: #f9fafb;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid #f3f4f6;
        }

        .lawyer-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .lawyer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lawyer-details {
          flex: 1;
        }

        .lawyer-details h5 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: var(--text);
        }

        .lawyer-details p {
          margin: 0.25rem 0;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .client-details {
          flex: 1;
        }

        .client-details h5 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: var(--text);
          font-weight: 700;
        }

        .client-details p {
          margin: 0 0 0.25rem 0;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .appointment-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .payment-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: var(--radius-md);
          border: 1px solid #f3f4f6;
        }

        .info-label {
          font-weight: 600;
          color: var(--muted);
        }

        .info-value {
          font-weight: 600;
          color: var(--text);
        }

        .status-value {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .message-content, .note-content {
          background: #f9fafb;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid #f3f4f6;
        }

        .message-content p, .note-content p {
          margin: 0;
          color: var(--text);
          line-height: 1.6;
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: var(--radius-md);
          border: 1px solid #f3f4f6;
        }

        .document-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .document-name {
          flex: 1;
          color: var(--text);
          font-weight: 500;
        }

        .document-download {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--accent);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .document-download:hover {
          background: var(--accent);
          color: white;
        }

        .appointment-details-modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          flex-shrink: 0;
        }

        .appointment-details-modal-footer .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .appointment-details-modal-footer .primary-action,
        .appointment-details-modal-footer .approve-action {
          background: var(--gold);
          color: white;
        }

        .appointment-details-modal-footer .secondary-action {
          background: var(--accent);
          color: white;
        }

        .appointment-details-modal-footer .danger-action {
          background: #ef4444;
          color: white;
        }

        .appointment-details-modal-footer .action-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .pay-now-btn-modal,
        .cancel-btn-modal,
        .reschedule-btn-modal {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pay-now-btn-modal {
          background: var(--gold);
          color: white;
        }

        .cancel-btn-modal {
          background: #ef4444;
          color: white;
        }

        .reschedule-btn-modal {
          background: var(--accent);
          color: white;
        }

        .pay-now-btn-modal:hover,
        .cancel-btn-modal:hover,
        .reschedule-btn-modal:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* Mobile responsiveness for appointment details modal */
        @media (max-width: 768px) {
          .appointment-details-modal {
            padding: 0.5rem;
          }

          .appointment-details-modal-content {
            margin: 1rem;
            max-height: calc(100vh - 2rem);
          }

          .appointment-info-grid,
          .payment-info-grid {
            grid-template-columns: 1fr;
          }

          .client-info-card {
            flex-direction: column;
            text-align: center;
          }

          .client-avatar {
            margin: 0 auto;
          }

          .appointment-details-modal-footer {
            flex-wrap: wrap;
            justify-content: center;
          }

          .appointment-details-modal-footer .action-btn {
            flex: 1;
            min-width: 120px;
          }
        }

        /* Cursor pointer for clickable appointment cards */
        .appointment-card-main {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .appointment-card-main:hover {
          background: rgba(207, 174, 112, 0.02);
        }
          .hero-card, .section-card{ padding: 10px; margin-bottom: 10px; }
          .hero-name{ font-size: 1.1rem; }
          .section-title{ font-size: 0.9rem; margin-bottom: 10px; }
          .stats-grid{ display: flex; flex-wrap: wrap; gap: 6px; }
          .stat-card{ padding: 8px; }
          .modern-btn{ padding: 6px 10px; font-size: 10px; }
          .sidebar-nav-item{ padding: 4px 8px; font-size: 10px; }
          .avatar-preview{ width: 60px; height: 60px; }
          .appointment-card{ padding: 10px; }
          .filter-controls{ gap: 6px; }
        }

        /* Landscape phone orientation adjustments */
        @media (max-width: 768px) and (orientation: landscape) {
          .hero-content{ flex-direction: row; text-align: left; }
          .stats-grid{ display: flex; flex-wrap: wrap; gap: 8px; }
          .working-hours-grid{ grid-template-columns: repeat(2, 1fr); }
        }

        /* High density displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .hero-avatar, .avatar-preview{ image-rendering: -webkit-optimize-contrast; }
        }

        /* Touch-friendly interactive elements */
        @media (hover: none) and (pointer: coarse) {
          .modern-btn, .sidebar-nav-item, .approve-btn, .reject-btn, .avatar-upload-btn{ 
            min-height: 44px; 
            padding: 12px 16px; 
          }
          .filter-controls .modern-btn{ min-width: 120px; }
          .appointment-actions .approve-btn, .appointment-actions .reject-btn{ 
            min-height: 40px; 
            flex: 1; 
          }
        }

        /* Arabic RTL Support */
        [dir="rtl"] .main-layout {
          direction: rtl;
        }

        [dir="rtl"] .sidebar {
          left: auto;
          right: 0;
        }

        [dir="rtl"] .content-area {
          margin-left: 0;
          margin-right: 300px;
        }

        [dir="rtl"] .sidebar-nav-item {
          text-align: right;
          border-left: none;
          border-right: 4px solid transparent;
        }

        [dir="rtl"] .sidebar-nav-item.active {
          border-right-color: var(--gold);
        }

        [dir="rtl"] .hero-content {
          text-align: right;
        }

        [dir="rtl"] .profile-info {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .appointment-actions {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .appointment-details {
          text-align: right;
        }

        @media (max-width: 768px) {
          [dir="rtl"] .content-area {
            margin-right: 0;
          }
        }
  `}</style>
    </div>

    {/* Appointment Details Modal - Outside dashboard container for proper overlay */}
    {appointmentDetailsModalOpen && selectedAppointmentDetails && createPortal(
      <div className="appointment-details-modal" onClick={() => setAppointmentDetailsModalOpen(false)}>
        <div className="appointment-details-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="appointment-details-modal-header">
            <h3>{t('avocatDashboard.appointmentDetails')}</h3>
            <button className="close-btn" onClick={() => setAppointmentDetailsModalOpen(false)}>×</button>
          </div>
          
          <div className="appointment-details-modal-body">
            <div className="appointment-details-section">
              <h4>{t('avocatDashboard.clientInformation')}</h4>
              <div className="lawyer-info-card">
                <div className="lawyer-avatar">
                  {selectedAppointmentDetails.clientId?.avatarUrl ? (
                    <img src={selectedAppointmentDetails.clientId.avatarUrl} alt="Client" />
                  ) : (
                    <span className="avatar-placeholder">
                      {(selectedAppointmentDetails.clientId?.fullName || selectedAppointmentDetails.clientNom || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="lawyer-details">
                  <h5>{selectedAppointmentDetails.clientId?.fullName || selectedAppointmentDetails.clientId?.nom || selectedAppointmentDetails.clientInfo?.nom || selectedAppointmentDetails.clientNom || t('avocatDashboard.client')}</h5>
                  <p>{selectedAppointmentDetails.clientId?.specialization || 'Client'}</p>
                  <p>{selectedAppointmentDetails.clientId?.email || selectedAppointmentDetails.clientInfo?.email || selectedAppointmentDetails.clientEmail || t('avocatDashboard.noEmail')}</p>
                  {selectedAppointmentDetails.clientId?.phone && (
                    <p>{selectedAppointmentDetails.clientId.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="appointment-details-section">
              <h4>{t('avocatDashboard.appointmentInformation')}</h4>
              <div className="appointment-info-grid">
                <div className="info-item">
                  <span className="info-label">{t('avocatDashboard.date')}:</span>
                  <span className="info-value">
                    {selectedAppointmentDetails.date ? 
                      new Date(selectedAppointmentDetails.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Date not available'
                    }
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('avocatDashboard.time')}:</span>
                  <span className="info-value">{selectedAppointmentDetails.heure || 'Time not available'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('avocatDashboard.status')}:</span>
                  <span className="info-value status-value" style={{ color: (() => {
                    switch (selectedAppointmentDetails.statut) {
                      case 'confirmé': return '#10b981';
                      case 'en_attente': return '#f59e0b';
                      case 'payé': return '#CFAE70';
                      case 'refusé': return '#ef4444';
                      default: return '#6b7280';
                    }
                  })() }}>
                    {(() => {
                      switch (selectedAppointmentDetails.statut) {
                        case 'confirmé': return t('avocatDashboard.statusConfirmed');
                        case 'en_attente': return t('avocatDashboard.statusWaiting');
                        case 'payé': return t('avocatDashboard.statusPaid');
                        case 'refusé': return t('avocatDashboard.statusRejected');
                        default: return selectedAppointmentDetails.statut;
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {selectedAppointmentDetails.message && (
              <div className="appointment-details-section">
                <h4>{t('avocatDashboard.clientMessage')}</h4>
                <div className="message-content">
                  <p>{selectedAppointmentDetails.message}</p>
                </div>
              </div>
            )}

            {selectedAppointmentDetails.note && (
              <div className="appointment-details-section">
                <h4>{t('avocatDashboard.yourNotes')}</h4>
                <div className="note-content">
                  <p>{selectedAppointmentDetails.note}</p>
                </div>
              </div>
            )}

            {selectedAppointmentDetails.caseFiles && selectedAppointmentDetails.caseFiles.length > 0 && (
              <div className="appointment-details-section">
                <h4>{t('avocatDashboard.clientFiles')}</h4>
                <div className="documents-list">
                  {selectedAppointmentDetails.caseFiles.map((doc, index) => (
                    <FileViewer 
                      key={index}
                      file={doc.url || doc}
                      fileName={doc.filename || `Document ${index + 1}`}
                      showPreview={true}
                      className="appointment-document"
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedAppointmentDetails.lawyerFiles && selectedAppointmentDetails.lawyerFiles.length > 0 && (
              <div className="appointment-details-section">
                <h4>{t('avocatDashboard.yourFiles')}</h4>
                <div className="documents-list">
                  {selectedAppointmentDetails.lawyerFiles.map((doc, index) => (
                    <FileViewer 
                      key={index}
                      file={doc.url || doc}
                      fileName={doc.name || `Legal Document ${index + 1}`}
                      showPreview={true}
                      className="appointment-document"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {selectedAppointmentDetails.paymentStatus && (
              <div className="appointment-details-section">
                <h4>{t('avocatDashboard.paymentInfo')}</h4>
                <div className="appointment-info-grid">
                  <div className="info-item">
                    <span className="info-label">{t('avocatDashboard.paymentStatus.status')}:</span>
                    <span className="info-value">
                      {t(`avocatDashboard.paymentStatus.${selectedAppointmentDetails.paymentStatus}`)}
                    </span>
                  </div>
                  {selectedAppointmentDetails.paymentMethod && (
                    <div className="info-item">
                      <span className="info-label">{t('avocatDashboard.method')}:</span>
                      <span className="info-value">
                        {t(`avocatDashboard.paymentMethod.${selectedAppointmentDetails.paymentMethod}`)}
                      </span>
                    </div>
                  )}
                  {selectedAppointmentDetails.paymentDate && (
                    <div className="info-item">
                      <span className="info-label">{t('avocatDashboard.confirmedOn')}:</span>
                      <span className="info-value">
                        {new Date(selectedAppointmentDetails.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="appointment-details-modal-footer">
            {selectedAppointmentDetails.statut === 'en_attente' && (
              <>
                <button 
                  className="pay-now-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleApproveAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.approve')}
                </button>
                <button 
                  className="cancel-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleRejectAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.reject')}
                </button>
              </>
            )}

            {selectedAppointmentDetails.statut === 'payé' && (
              <>
                <button 
                  className="pay-now-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleApproveAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.confirmAppointment')}
                </button>
                <button 
                  className="cancel-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleRejectAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.reject')}
                </button>
              </>
            )}

            {selectedAppointmentDetails.statut === 'confirmé' && (
              <button 
                className="reschedule-btn-modal"
                onClick={() => {
                  setAppointmentDetailsModalOpen(false);
                  handleMarkAsPaid(selectedAppointmentDetails._id);
                }}
              >
                {t('avocatDashboard.markAsPaid')}
              </button>
            )}

            {(selectedAppointmentDetails.statut === 'confirmé' || selectedAppointmentDetails.statut === 'en_attente' || selectedAppointmentDetails.statut === 'payé') && (
              <>
                <button 
                  className="reschedule-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleRescheduleAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.reschedule')}
                </button>
                <button 
                  className="cancel-btn-modal"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handleCancelAppointment(selectedAppointmentDetails._id);
                  }}
                >
                  {t('avocatDashboard.cancel')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

// Render BookingModal outside of return to be included in the component tree
// (placed at the end of the file to avoid inline JSX duplication)

// NOTE: we need to export default AvocatDashboard; BookingModal is rendered inside the component's return in practice.

export default AvocatDashboard;
