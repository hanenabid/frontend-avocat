import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import CasesManager from '../components/CasesManager';
import PaymentModal from '../components/PaymentModal';
import BookingModal from '../components/BookingModal';
import FileViewer from '../components/FileViewer';
import { rendezVousAPI, authAPI } from '../services/api';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '../utils/password';
import { useTranslation } from 'react-i18next';
import Chatbot from '../components/chatbot';

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

const ClientDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState({
    totalAppointments: 0,
    pendingRequests: 0,
    paidAppointments: 0,
    confirmedAppointments: 0,
    upcomingAppointments: 0
  });

  // Profile editing states
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Payment modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Appointment details modal states
  const [appointmentDetailsModalOpen, setAppointmentDetailsModalOpen] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

  const handleLogout = () => {
    logout();
  };

  // Helper functions for status text
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmé': return t('clientDashboard.statusConfirmed');
      case 'en_attente': return t('clientDashboard.statusWaiting');
      case 'refusé': return t('clientDashboard.statusUnavailable');
      default: return status;
    }
  };

  // Load appointments and statistics
  useEffect(() => {
    if (user) {
      setLoading(true);
      const today = new Date();
      
      console.log('Loading appointments for client:', user);
      console.log('Client ID:', user.id || user._id);
      
      rendezVousAPI.getClientRendezVous(user.id || user._id)
        .then(response => {
          const appointmentData = response.data || response || [];
          const sorted = sortAppointmentsByCreated(appointmentData);
          console.log('Received client appointments (sorted):', sorted);
          setAppointments(sorted);

          const upcomingCount = sorted.filter(a => {
            const appointmentDate = new Date(a.date);
            return appointmentDate >= today && a.statut === 'confirmé';
          }).length;

          setStatistics({
            totalAppointments: sorted.length,
            pendingRequests: sorted.filter(a => a.statut === 'en_attente').length,
            paidAppointments: sorted.filter(a => a.statut === 'payé').length,
            confirmedAppointments: sorted.filter(a => a.statut === 'confirmé').length,
            upcomingAppointments: upcomingCount
          });
        })
        .catch(err => {
          console.error('Error loading client appointments:', err);
          console.error('Error response:', err.response?.data);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Initialize profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // Profile form handlers
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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
      console.log('Sending client profile update:', profileData);

      const response = await authAPI.updateProfile(profileData);

      if (response && response.data) {
        updateUser(response.data.user);
        setIsEditingProfile(false);
        alert(t('clientDashboard.profileUpdated'));
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const errorMessage = error.response?.data?.error || error.message || t('clientDashboard.errorUpdatingProfile');
      alert(`${t('common.errorPrefix')} ${errorMessage}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t('clientDashboard.passwordMismatch'));
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
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
        alert(t('clientDashboard.passwordChanged'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || t('clientDashboard.errorChangingPassword');
      alert(`${t('common.errorPrefix')} ${msg}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Payment handling functions
  const handlePayNow = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (appointmentId) => {
    try {
      console.log('Payment confirmed for appointment:', appointmentId);
      
      setAppointments(prev => {
        const updated = prev.map(apt => apt._id === appointmentId ? { ...apt, statut: 'payé' } : apt);
        return sortAppointmentsByCreated(updated);
      });
      
      setStatistics(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1,
        paidAppointments: prev.paidAppointments + 1
      }));
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(t('clientDashboard.paymentError'));
    }
  };

  // Recompute statistics from current appointments array
  const computeStatisticsFrom = (arr) => {
    const appointmentData = arr || [];
    const today = new Date();
    const upcomingCount = appointmentData.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate >= today && a.statut === 'confirmé';
    }).length;
    return {
      totalAppointments: appointmentData.length,
      pendingRequests: appointmentData.filter(a => a.statut === 'en_attente').length,
      paidAppointments: appointmentData.filter(a => a.statut === 'payé').length,
      confirmedAppointments: appointmentData.filter(a => a.statut === 'confirmé').length,
      upcomingAppointments: upcomingCount
    };
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm(t('clientDashboard.confirmCancel'))) return;

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
      alert(t('clientDashboard.cancelError'));
      if (previous) {
        setAppointments(sortAppointmentsByCreated(previous));
        setStatistics(computeStatisticsFrom(previous));
      }
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    const apt = appointments.find(a => a._id === appointmentId);
    if (!apt) return alert(t('clientDashboard.appointmentNotFound'));
    setAppointmentToReschedule(apt);
    setBookingModalOpen(true);
  };

  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointmentDetails(appointment);
    setAppointmentDetailsModalOpen(true);
  };

  const renderAppointmentCard = (appointment) => {
    console.log('Rendering client appointment card for:', appointment);
    console.log('Avocat ID data:', appointment.avocatId);
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmé': return 'linear-gradient(135deg, #10b981, #059669)';
        case 'en_attente': return 'linear-gradient(135deg, #f59e0b, #d97706)';
        case 'refusé': return 'linear-gradient(135deg, #ef4444, #dc2626)';
        default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'confirmé': return 'Confirmé';
        case 'en_attente': return 'En attente';
        case 'refusé': return 'Refusé';
        default: return status;
      }
    };

    const appointmentDate = new Date(appointment.date);
    const isUpcoming = appointmentDate >= new Date() && appointment.statut === 'confirmé';

    return (
      <div key={appointment._id} className={`appointment-card ${appointment.statut} ${isUpcoming ? 'upcoming' : ''}`}>
        <div className="appointment-card-header">
          <div className="lawyer-section">
            <div className="lawyer-avatar">
              {appointment.avocatId?.avatarUrl ? (
                <img src={appointment.avocatId.avatarUrl} alt="Lawyer" />
              ) : (
                <span className="avatar-placeholder">
                  {(appointment.avocatId?.fullName || 
                    appointment.avocatId?.nom || 
                    appointment.lawyerInfo?.nom || 
                    appointment.lawyerNom || 
                    'L').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="lawyer-info">
              <h3 className="lawyer-name">
                {appointment.avocatId?.fullName || 
                 appointment.avocatId?.nom || 
                 appointment.lawyerInfo?.nom || 
                 appointment.lawyerNom || 
                 'Legal Advisor'}
              </h3>
              <span className="lawyer-specialty">
                {appointment.avocatId?.specialization || 'Legal Consultant'}
              </span>
            </div>
          </div>
          
          <div 
            className="status-badge"
            style={{ background: getStatusColor(appointment.statut) }}
          >
            {getStatusText(appointment.statut)}
          </div>
        </div>

        <div className="appointment-card-body">
          <div className="appointment-date-time">
            <div className="date-block">
              <div className="date-number">{appointmentDate.getDate()}</div>
              <div className="date-month">{appointmentDate.toLocaleDateString('fr-FR', { month: 'short' })}</div>
              <div className="date-year">{appointmentDate.getFullYear()}</div>
            </div>
            <div className="time-block">
              <div className="time-icon">🕐</div>
              <div className="time-text">{appointment.heure}</div>
              <div className="day-name">{appointmentDate.toLocaleDateString('fr-FR', { weekday: 'long' })}</div>
            </div>
          </div>

          {appointment.message && (
            <div className="appointment-message">
              <div className="message-label">Votre message :</div>
              <div className="message-text">{appointment.message}</div>
            </div>
          )}
        </div>

        <div className="appointment-card-footer">
          <button 
            className="btn-action btn-primary"
            onClick={() => handleViewAppointmentDetails(appointment)}
          >
            <span className="btn-icon">👁️</span>
            {t('clientDashboard.viewDetails')}
          </button>

          <div className="btn-group">
            {appointment.statut === 'en_attente' && (
              <button 
                className="btn-action btn-pay"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePayNow(appointment);
                }}
              >
                <span className="btn-icon">💳</span>
                {t('clientDashboard.pay')}
              </button>
            )}

            {(appointment.statut === 'confirmé' || appointment.statut === 'en_attente') && (
              <>
                <button 
                  className="btn-action btn-secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRescheduleAppointment(appointment._id);
                  }}
                >
                  <span className="btn-icon">📅</span>
                  {t('clientDashboard.reschedule')}
                </button>
                <button 
                  className="btn-action btn-danger" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelAppointment(appointment._id);
                  }}
                >
                  <span className="btn-icon">✖</span>
                  {t('clientDashboard.cancel')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentsView = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">{t('clientDashboard.loadingAppointments')}</p>
        </div>
      );
    }

    const canceledStatuses = ['refusé', 'annulé', 'rejeté'];
    const pendingAppointments = appointments.filter(a => a.statut === 'en_attente');
    const confirmedAppointments = appointments.filter(a => a.statut === 'confirmé');
    const rejectedAppointments = appointments.filter(a => canceledStatuses.includes(a.statut));

    return (
      <div className="view-container appointments-view">
        <div className="view-header-section">
          <div className="view-title-group">
            <h1 className="view-title">{t('clientDashboard.myConsultations')}</h1>
            <p className="view-subtitle">{t('clientDashboard.trackAppointments')}</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-container">
          <div 
            className={`stat-card ${filterStatus === 'all' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('all')}
          >
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalAppointments}</div>
              <div className="stat-label">{t('clientDashboard.totalAppointments')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card pending ${filterStatus === 'en_attente' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('en_attente')}
          >
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.pendingRequests}</div>
              <div className="stat-label">{t('clientDashboard.awaitingResponse')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card confirmed ${filterStatus === 'confirmé' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('confirmé')}
          >
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.confirmedAppointments}</div>
              <div className="stat-label">{t('clientDashboard.confirmedMeetings')}</div>
            </div>
          </div>
          
          <div 
            className={`stat-card upcoming ${filterStatus === 'today' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('today')}
          >
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.upcomingAppointments}</div>
              <div className="stat-label">{t('clientDashboard.upcomingMeetings')}</div>
            </div>
          </div>
        </div>

        {/* Appointments listing */}
        {filterStatus === 'all' ? (
          <div className="appointments-sections">
            {/* Pending */}
            {pendingAppointments.length > 0 && (
              <div className="appointments-section">
                <h2 className="section-title">
                  <span className="section-icon">⏳</span>
                  {t('clientDashboard.waitingResponse')} ({pendingAppointments.length})
                </h2>
                <div className="section-description">
                  <p>{t('clientDashboard.waitingResponseDesc')}</p>
                </div>
                <div className="appointments-grid">
                  {pendingAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {/* Confirmed */}
            {confirmedAppointments.length > 0 && (
              <div className="appointments-section">
                <h2 className="section-title">
                  <span className="section-icon">✓</span>
                  {t('clientDashboard.confirmedConsultations')} ({confirmedAppointments.length})
                </h2>
                <div className="section-description">
                  <p>{t('clientDashboard.confirmedConsultationsDesc')}</p>
                </div>
                <div className="appointments-grid">
                  {confirmedAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {/* Canceled/Rejected */}
            {rejectedAppointments.length > 0 && (
              <div className="appointments-section">
                <h2 className="section-title">
                  <span className="section-icon">✖</span>
                  {t('clientDashboard.canceledUnavailable')} ({rejectedAppointments.length})
                </h2>
                <div className="section-description">
                  <p>{t('clientDashboard.canceledUnavailableDesc')}</p>
                </div>
                <div className="appointments-grid">
                  {rejectedAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">{t('clientDashboard.welcomeLegalHub')}</h3>
                <p className="empty-text">{t('clientDashboard.noConsultationsYet')}</p>
                <button 
                  className="btn-primary btn-large"
                  onClick={() => window.location.href = '/lawyers'}
                >
                  <span className="btn-icon">🔍</span>
                  {t('clientDashboard.browseLawyers')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="appointments-section">
            <h2 className="section-title">
              <span className="section-icon">
                {filterStatus === 'today' ? '📅' : 
                 filterStatus === 'confirmé' ? '✓' :
                 filterStatus === 'en_attente' ? '⏳' : '✖'}
              </span>
              {filterStatus === 'today' ? t('clientDashboard.upcomingMeetings') : 
               filterStatus === 'confirmé' ? t('clientDashboard.confirmedMeetings') :
               filterStatus === 'en_attente' ? t('clientDashboard.awaitingResponse') :
               t('clientDashboard.allAppointments')} ({(() => {
                const filteredAppointments = filterStatus === 'today'
                  ? appointments.filter(a => {
                      const appointmentDate = new Date(a.date);
                      const today = new Date();
                      return appointmentDate.toDateString() === today.toDateString() && a.statut === 'confirmé';
                    })
                  : appointments.filter(a => a.statut === filterStatus);
                return filteredAppointments.length;
              })()})
            </h2>
            <div className="appointments-grid">
              {(() => {
                const filteredAppointments = filterStatus === 'today'
                  ? appointments.filter(a => {
                      const appointmentDate = new Date(a.date);
                      const today = new Date();
                      return appointmentDate.toDateString() === today.toDateString() && a.statut === 'confirmé';
                    })
                  : appointments.filter(a => a.statut === filterStatus);
                
                return filteredAppointments.length > 0 
                  ? filteredAppointments.map(renderAppointmentCard)
                  : (
                    <div className="no-appointments">
                      <p>{t('clientDashboard.noFilteredAppointments')}</p>
                    </div>
                  );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfileView = () => {
    return (
      <div className="view-container profile-view">
        <div className="view-header-section">
          <div className="view-title-group">
            <h1 className="view-title">{t('clientDashboard.personalInformation')}</h1>
            <p className="view-subtitle">{t('clientDashboard.keepContactUpdated')}</p>
          </div>
        </div>

        <div className="profile-sections">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">👤</span>
                <h2 className="section-title">{t('clientDashboard.contactInformation')}</h2>
              </div>
              {!isEditingProfile && (
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <span className="btn-icon">✏️</span>
                  {t('clientDashboard.updateInfo')}
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-intro">
                  <p>{t('clientDashboard.keepInfoCurrent')}</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">{t('clientDashboard.fullName')} *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileInputChange}
                      className="form-input"
                      placeholder={t('clientDashboard.enterFullName')}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">{t('clientDashboard.emailAddress')} *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileInputChange}
                      className="form-input"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">{t('clientDashboard.phoneNumber')}</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileInputChange}
                      className="form-input"
                      placeholder="(555) 123-4567"
                    />
                    <small className="field-help">{t('clientDashboard.phoneHelp')}</small>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="address">{t('clientDashboard.address')}</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileInputChange}
                      className="form-input"
                      placeholder={t('clientDashboard.addressPlaceholder')}
                    />
                    <small className="field-help">{t('clientDashboard.addressHelp')}</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    {t('clientDashboard.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={profileLoading}
                  >
                    {profileLoading ? t('clientDashboard.saving') : t('clientDashboard.saveChanges')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <div className="profile-info-grid">
                  <div className="info-item">
                    <label>{t('clientDashboard.fullName')}</label>
                    <p>{user.fullName || t('clientDashboard.addName')}</p>
                  </div>
                  
                  <div className="info-item">
                    <label>{t('clientDashboard.emailAddress')}</label>
                    <p>{user.email || t('clientDashboard.addEmail')}</p>
                  </div>
                  
                  <div className="info-item">
                    <label>{t('clientDashboard.phoneNumber')}</label>
                    <p>{user.phone || t('clientDashboard.addPhone')}</p>
                  </div>
                  
                  <div className="info-item full-width">
                    <label>{t('clientDashboard.address')}</label>
                    <p>{user.address || t('clientDashboard.addAddress')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="profile-section">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">🔒</span>
                <h2 className="section-title">{t('clientDashboard.accountSecurity')}</h2>
              </div>
              {!isChangingPassword && (
                <button 
                  className="btn-edit"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <span className="btn-icon">🔑</span>
                  {t('clientDashboard.changePassword')}
                </button>
              )}
            </div>

            <div className="security-info">
              <p>{t('clientDashboard.securityInfo')}</p>
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">{t('clientDashboard.currentPassword')}</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    required
                    className="form-input"
                    placeholder={t('clientDashboard.enterCurrentPassword')}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">{t('clientDashboard.newPassword')}</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength="8"
                    className="form-input"
                    placeholder={t('clientDashboard.enterNewPassword')}
                  />
                  <small className="field-help">{t('clientDashboard.passwordRequirements')}</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">{t('clientDashboard.confirmNewPassword')}</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength="8"
                    className="form-input"
                    placeholder={t('clientDashboard.reenterNewPassword')}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    {t('clientDashboard.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? t('clientDashboard.updating') : t('clientDashboard.updatePassword')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewView = () => {
    return (
      <div className="view-container overview-view">
        <div className="view-header-section welcome-header">
          <div className="welcome-content">
            <h1 className="welcome-title">
              {t('clientDashboard.welcomeToLegalHub')}
            </h1>
            <p className="welcome-subtitle">{t('clientDashboard.trackAppointments')}</p>
          </div>
          <div className="welcome-illustration">
            <div className="illustration-circle"></div>
            <div className="illustration-icon">⚖️</div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-container overview-stats">
          <div className="stat-card overview-stat">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalAppointments}</div>
              <div className="stat-label">{t('clientDashboard.totalAppointments')}</div>
            </div>
          </div>
          
          <div className="stat-card overview-stat confirmed">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.confirmedAppointments}</div>
              <div className="stat-label">{t('clientDashboard.confirmedMeetings')}</div>
            </div>
          </div>
          
          <div className="stat-card overview-stat pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.pendingRequests}</div>
              <div className="stat-label">{t('clientDashboard.awaitingResponse')}</div>
            </div>
          </div>
          
          <div className="stat-card overview-stat upcoming">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.upcomingAppointments}</div>
              <div className="stat-label">{t('clientDashboard.upcomingMeetings')}</div>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card recent-appointments-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="title-icon">📋</span>
              {t('clientDashboard.recentAppointments')}
            </h2>
            <button 
              className="btn-view-all"
              onClick={() => setCurrentView('appointments')}
            >
              {t('clientDashboard.viewAll')} →
            </button>
          </div>
          <div className="card-content">
            {appointments.length === 0 ? (
              <div className="empty-state small">
                <div className="empty-icon">📭</div>
                <p className="empty-text">{t('clientDashboard.noAppointmentsYet')}</p>
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/lawyers'}
                >
                  <span className="btn-icon">🔍</span>
                  {t('clientDashboard.browseLawyers')}
                </button>
              </div>
            ) : (
              <div className="appointments-list-compact">
                {appointments.slice(0, 3).map(appointment => (
                  <div 
                    key={appointment._id} 
                    className="appointment-compact"
                    onClick={() => handleViewAppointmentDetails(appointment)}
                  >
                    <div className="compact-lawyer">
                      <div className="compact-avatar">
                        {appointment.avocatId?.avatarUrl ? (
                          <img src={appointment.avocatId.avatarUrl} alt="Lawyer" />
                        ) : (
                          <span>
                            {(appointment.avocatId?.fullName || 'L').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="compact-info">
                        <div className="compact-name">
                          {appointment.avocatId?.fullName || appointment.lawyerNom || 'Legal Advisor'}
                        </div>
                        <div className="compact-date">
                          {new Date(appointment.date).toLocaleDateString('fr-FR', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} • {appointment.heure}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="compact-status"
                      style={{ 
                        background: appointment.statut === 'confirmé' 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : appointment.statut === 'en_attente'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)'
                      }}
                    >
                      {getStatusText(appointment.statut)}
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

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return renderOverviewView();
      case 'appointments':
        return renderAppointmentsView();
      case 'cases':
        return <CasesManager appointments={appointments} user={user} />;
      case 'profile':
        return renderProfileView();
      default:
        return renderOverviewView();
    }
  };

  if (!user) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-text">{t('clientDashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className="dashboard-layout">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-content">

            <nav className="sidebar-nav">
              <button 
                className={`nav-item ${currentView === 'overview' ? 'active' : ''}`} 
                onClick={() => { setCurrentView('overview'); setIsMobileMenuOpen(false); }}
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-text">{t('clientDashboard.overview')}</span>
              </button>
              
              <button 
                className={`nav-item ${currentView === 'appointments' ? 'active' : ''}`} 
                onClick={() => { setCurrentView('appointments'); setIsMobileMenuOpen(false); }}
              >
                <span className="nav-icon">📅</span>
                <span className="nav-text">{t('clientDashboard.myAppointments')}</span>
                {statistics.pendingRequests > 0 && (
                  <span className="nav-badge">{statistics.pendingRequests}</span>
                )}
              </button>
              
              <button 
                className={`nav-item ${currentView === 'cases' ? 'active' : ''}`} 
                onClick={() => { setCurrentView('cases'); setIsMobileMenuOpen(false); }}
              >
                <span className="nav-icon">📁</span>
                <span className="nav-text">{t('clientDashboard.myCases')}</span>
              </button>
              
              <button 
                className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} 
                onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false); }}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-text">{t('clientDashboard.myInformation')}</span>
              </button>
            </nav>

            <div className="sidebar-footer">
              <button className="logout-btn" onClick={handleLogout}>
                <span className="btn-icon">🚪</span>
                <span className="btn-text">{t('clientDashboard.signOut')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>

      {/* Chatbot Component */}
      <Chatbot />

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentConfirm={handlePaymentConfirm}
        appointment={selectedAppointment}
      />

      {/* Booking Modal */}
      <BookingModal
        avocat={appointmentToReschedule?.avocatId || appointmentToReschedule?.lawyerInfo || { _id: appointmentToReschedule?.avocatId }}
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

      {/* Appointment Details Modal */}
      {appointmentDetailsModalOpen && selectedAppointmentDetails && (
        <div className="modal-overlay" onClick={() => setAppointmentDetailsModalOpen(false)}>
          <div className="modal-content appointment-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="title-icon">📋</span>
                {t('clientDashboard.appointmentDetails')}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setAppointmentDetailsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4 className="detail-section-title">
                  <span className="section-icon">👨‍⚖️</span>
                  {t('clientDashboard.lawyerInformation')}
                </h4>
                <div className="lawyer-detail-card">
                  <div className="lawyer-avatar-large">
                    {selectedAppointmentDetails.avocatId?.avatarUrl ? (
                      <img src={selectedAppointmentDetails.avocatId.avatarUrl} alt="Lawyer" />
                    ) : (
                      <span className="avatar-placeholder">
                        {(selectedAppointmentDetails.avocatId?.fullName || 'L').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="lawyer-detail-info">
                    <h5>{selectedAppointmentDetails.avocatId?.fullName || selectedAppointmentDetails.lawyerNom || 'Legal Advisor'}</h5>
                    <p className="specialty">{selectedAppointmentDetails.avocatId?.specialization || 'Legal Consultant'}</p>
                    <p className="contact">{selectedAppointmentDetails.avocatId?.email || 'Contact via platform'}</p>
                    {selectedAppointmentDetails.avocatId?.phone && (
                      <p className="contact">{selectedAppointmentDetails.avocatId.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="detail-section-title">
                  <span className="section-icon">📅</span>
                  {t('clientDashboard.appointmentInformation')}
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">{t('clientDashboard.date')}:</span>
                    <span className="info-value">
                      {new Date(selectedAppointmentDetails.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('clientDashboard.time')}:</span>
                    <span className="info-value">{selectedAppointmentDetails.heure}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('clientDashboard.status')}:</span>
                    <span 
                      className="info-value status-badge-small"
                      style={{ 
                        background: selectedAppointmentDetails.statut === 'confirmé' 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : selectedAppointmentDetails.statut === 'en_attente'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)'
                      }}
                    >
                      {getStatusText(selectedAppointmentDetails.statut)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedAppointmentDetails.message && (
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="section-icon">💬</span>
                    {t('clientDashboard.yourMessage')}
                  </h4>
                  <div className="message-box">
                    <p>{selectedAppointmentDetails.message}</p>
                  </div>
                </div>
              )}

              {selectedAppointmentDetails.note && (
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="section-icon">📝</span>
                    {t('clientDashboard.lawyerNotes')}
                  </h4>
                  <div className="message-box note-box">
                    <p>{selectedAppointmentDetails.note}</p>
                  </div>
                </div>
              )}

              {selectedAppointmentDetails.caseFiles && selectedAppointmentDetails.caseFiles.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="section-icon">📎</span>
                    {t('clientDashboard.clientFiles')}
                  </h4>
                  <div className="documents-list">
                    {selectedAppointmentDetails.caseFiles.map((doc, index) => (
                      <FileViewer 
                        key={index}
                        file={doc.url || doc}
                        fileName={doc.filename || `Document ${index + 1}`}
                        showPreview={true}
                        className="document-item"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedAppointmentDetails.statut === 'en_attente' && (
                <button 
                  className="btn-modal btn-pay"
                  onClick={() => {
                    setAppointmentDetailsModalOpen(false);
                    handlePayNow(selectedAppointmentDetails);
                  }}
                >
                  <span className="btn-icon">💳</span>
                  {t('clientDashboard.payNow')}
                </button>
              )}

              {(selectedAppointmentDetails.statut === 'confirmé' || selectedAppointmentDetails.statut === 'en_attente') && (
                <>
                  <button 
                    className="btn-modal btn-secondary" 
                    onClick={() => {
                      setAppointmentDetailsModalOpen(false);
                      handleRescheduleAppointment(selectedAppointmentDetails._id);
                    }}
                  >
                    <span className="btn-icon">📅</span>
                    {t('clientDashboard.reschedule')}
                  </button>
                  <button 
                    className="btn-modal btn-danger" 
                    onClick={() => {
                      setAppointmentDetailsModalOpen(false);
                      handleCancelAppointment(selectedAppointmentDetails._id);
                    }}
                  >
                    <span className="btn-icon">✖</span>
                    {t('clientDashboard.cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          /* Colors - Sophisticated Legal Palette */
          --primary: #1e3a8a;
          --primary-light: #3b82f6;
          --primary-dark: #1e40af;
          --secondary: #0f766e;
          --accent: #d97706;
          --success: #059669;
          --warning: #d97706;
          --danger: #dc2626;
          
          --navy: #0f172a;
          --slate: #1e293b;
          --slate-light: #334155;
          --gray: #64748b;
          --gray-light: #94a3b8;
          --white: #ffffff;
          --background: #f8fafc;
          --surface: #ffffff;
          --border: #e2e8f0;
          
          /* Typography */
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', -apple-system, sans-serif;
          --font-mono: 'Space Mono', monospace;
          
          /* Spacing */
          --space-xs: 0.5rem;
          --space-sm: 0.75rem;
          --space-md: 1rem;
          --space-lg: 1.5rem;
          --space-xl: 2rem;
          --space-2xl: 3rem;
          
          /* Shadows */
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          
          /* Border Radius */
          --radius-sm: 0.5rem;
          --radius: 0.75rem;
          --radius-lg: 1rem;
          --radius-xl: 1.5rem;
          --radius-2xl: 2rem;
          
          /* Transitions */
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-container {
          font-family: var(--font-body);
          background: var(--background);
          min-height: 100vh;
          color: var(--slate);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .dashboard-layout {
          display: flex;
          min-height: calc(100vh - 80px);
          margin-top: 80px;
          position: relative;
        }

        /* ============================================
           SIDEBAR STYLES
           ============================================ */
        
        .dashboard-sidebar {
          position: fixed;
          top: 80px;
          left: 0;
          width: 300px;
          height: calc(100vh - 80px);
          background: linear-gradient(180deg, var(--navy) 0%, var(--slate) 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          z-index: 100;
          transition: var(--transition);
        }

        .dashboard-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .dashboard-sidebar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: var(--space-lg) 0;
        }

        .sidebar-header {
          padding: 0 var(--space-lg) var(--space-lg);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--white);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin: 0;
        }

        .title-icon {
          font-size: 1.75rem;
        }

        .close-sidebar {
          display: none;
          background: none;
          border: none;
          color: var(--white);
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .close-sidebar:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .user-profile-card {
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: rgba(255, 255, 255, 0.05);
          margin: var(--space-lg) var(--space-lg) var(--space-md);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 3px solid var(--accent);
          box-shadow: var(--shadow-md);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initial {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: var(--white);
          font-size: 1.75rem;
          font-weight: 800;
          font-family: var(--font-display);
        }

        .profile-details {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--white);
          margin: 0 0 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-role {
          color: var(--gray-light);
          font-size: 0.875rem;
          margin: 0 0 var(--space-sm) 0;
        }

        .profile-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          color: var(--success);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-md) 0;
        }

        .nav-item {
          width: 100%;
          padding: var(--space-md) var(--space-lg);
          background: none;
          border: none;
          border-left: 3px solid transparent;
          display: flex;
          align-items: center;
          gap: var(--space-md);
          color: var(--gray-light);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--white);
          border-left-color: var(--accent);
        }

        .nav-item.active {
          background: rgba(217, 119, 6, 0.1);
          color: var(--white);
          border-left-color: var(--accent);
        }

        .nav-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .nav-text {
          flex: 1;
        }

        .nav-badge {
          background: var(--danger);
          color: var(--white);
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 1.5rem;
          text-align: center;
        }

        .sidebar-footer {
          padding: var(--space-lg);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-btn {
          width: 100%;
          padding: var(--space-md);
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: var(--radius-lg);
          color: #fca5a5;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .logout-btn:hover {
          background: var(--danger);
          color: var(--white);
          border-color: var(--danger);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* ============================================
           MAIN CONTENT AREA
           ============================================ */
        
        .dashboard-main {
          flex: 1;
          margin-left: 300px;
          padding: var(--space-2xl);
          max-width: 100%;
          overflow-x: hidden;
        }

        .view-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .view-header-section {
          margin-bottom: var(--space-2xl);
        }

        .view-title-group {
          max-width: 800px;
        }

        .view-title {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 900;
          color: var(--navy);
          margin: 0 0 var(--space-md) 0;
          line-height: 1.1;
          background: linear-gradient(135deg, var(--navy), var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .view-subtitle {
          font-size: 1.25rem;
          color: var(--gray);
          line-height: 1.6;
          margin: 0;
        }

        /* ============================================
           STATISTICS CARDS
           ============================================ */
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-2xl);
        }

        .stat-card {
          background: var(--white);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          box-shadow: var(--shadow);
          border: 2px solid transparent;
          transition: var(--transition);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          transform: scaleX(0);
          transition: var(--transition);
        }

        .stat-card:hover,
        .stat-card.active {
          border-color: var(--accent);
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .stat-card:hover::before,
        .stat-card.active::before {
          transform: scaleX(1);
        }

        .stat-card.pending {
          background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
        }

        .stat-card.confirmed {
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
        }

        .stat-card.upcoming {
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          flex-shrink: 0;
          box-shadow: var(--shadow-md);
        }

        .stat-card.pending .stat-icon {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
        }

        .stat-card.confirmed .stat-icon {
          background: linear-gradient(135deg, #34d399, #10b981);
        }

        .stat-card.upcoming .stat-icon {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--navy);
          line-height: 1;
          margin: 0 0 var(--space-xs) 0;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }

        /* ============================================
           APPOINTMENT CARDS
           ============================================ */
        
        .appointments-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
        }

        .appointments-section {
          background: var(--white);
          border-radius: var(--radius-2xl);
          padding: var(--space-2xl);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
        }

        .section-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 var(--space-sm) 0;
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .section-icon {
          font-size: 1.75rem;
        }

        .section-description {
          margin-bottom: var(--space-xl);
        }

        .section-description p {
          color: var(--gray);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .appointments-grid {
          display: grid;
          gap: var(--space-lg);
        }

        .appointment-card {
          background: var(--white);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 2px solid var(--border);
          transition: var(--transition);
          position: relative;
        }

        .appointment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
        }

        .appointment-card.confirmé::before {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .appointment-card.en_attente::before {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }

        .appointment-card.refusé::before {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .appointment-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
          border-color: var(--accent);
        }

        .appointment-card-header {
          padding: var(--space-xl);
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
        }

        .lawyer-section {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
          min-width: 0;
        }

        .lawyer-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 3px solid var(--accent);
          box-shadow: var(--shadow);
        }

        .lawyer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: var(--white);
          font-size: 1.5rem;
          font-weight: 800;
          font-family: var(--font-display);
        }

        .lawyer-info {
          flex: 1;
          min-width: 0;
        }

        .lawyer-name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lawyer-specialty {
          font-size: 0.875rem;
          color: var(--gray);
          font-weight: 500;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          color: var(--white);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: var(--shadow);
          white-space: nowrap;
        }

        .appointment-card-body {
          padding: var(--space-xl);
        }

        .appointment-date-time {
          display: flex;
          gap: var(--space-xl);
          margin-bottom: var(--space-lg);
        }

        .date-block {
          background: linear-gradient(135deg, var(--navy), var(--slate));
          color: var(--white);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          text-align: center;
          min-width: 100px;
          box-shadow: var(--shadow-md);
        }

        .date-number {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .date-month {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .date-year {
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.7;
        }

        .time-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: var(--space-xs);
        }

        .time-icon {
          font-size: 1.5rem;
          margin-bottom: var(--space-xs);
        }

        .time-text {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--navy);
        }

        .day-name {
          font-size: 0.875rem;
          color: var(--gray);
          font-weight: 600;
          text-transform: capitalize;
        }

        .appointment-message {
          background: var(--background);
          padding: var(--space-md);
          border-radius: var(--radius);
          border-left: 4px solid var(--accent);
        }

        .message-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--space-xs);
        }

        .message-text {
          font-size: 0.9375rem;
          color: var(--slate);
          line-height: 1.6;
        }

        .appointment-card-footer {
          padding: var(--space-lg) var(--space-xl);
          background: var(--background);
          border-top: 1px solid var(--border);
          display: flex;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .btn-action {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          box-shadow: var(--shadow);
          white-space: nowrap;
        }

        .btn-action:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn-action:active {
          transform: translateY(0);
        }

        .btn-icon {
          font-size: 1.125rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--accent), #ea580c);
          color: var(--white);
          flex: 1;
        }

        .btn-pay {
          background: linear-gradient(135deg, #10b981, #059669);
          color: var(--white);
        }

        .btn-secondary {
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
          color: var(--white);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: var(--white);
        }

        .btn-group {
          display: flex;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        /* ============================================
           PROFILE VIEW
           ============================================ */
        
        .profile-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .profile-section {
          background: var(--white);
          border-radius: var(--radius-2xl);
          padding: var(--space-2xl);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 2px solid var(--border);
        }

        .section-title-group {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .section-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0;
        }

        .btn-edit {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, var(--accent), #ea580c);
          color: var(--white);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          box-shadow: var(--shadow);
        }

        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .profile-display {
          padding: var(--space-lg) 0;
        }

        .profile-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-xl);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-item label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item p {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--navy);
          margin: 0;
        }

        .profile-form,
        .password-form {
          padding: var(--space-lg) 0;
        }

        .form-intro {
          margin-bottom: var(--space-xl);
        }

        .form-intro p {
          color: var(--gray);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--navy);
        }

        .form-input {
          padding: 0.875rem 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-family: var(--font-body);
          color: var(--navy);
          transition: var(--transition);
          background: var(--white);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.1);
        }

        .field-help {
          font-size: 0.75rem;
          color: var(--gray);
          font-style: italic;
        }

        .security-info {
          background: var(--background);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--accent);
          margin-bottom: var(--space-xl);
        }

        .security-info p {
          color: var(--gray);
          font-size: 0.9375rem;
          line-height: 1.6;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border);
        }

        .btn-cancel {
          padding: 0.875rem 1.75rem;
          background: var(--background);
          color: var(--slate);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-cancel:hover {
          background: var(--border);
        }

        .btn-save {
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
          color: var(--white);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: var(--shadow);
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ============================================
           OVERVIEW VIEW
           ============================================ */
        
        .welcome-header {
          background: linear-gradient(135deg, var(--navy) 0%, var(--slate) 100%);
          color: var(--white);
          padding: var(--space-2xl);
          border-radius: var(--radius-2xl);
          margin-bottom: var(--space-2xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-xl);
          position: relative;
          overflow: hidden;
        }

        .welcome-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(217, 119, 6, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .welcome-content {
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .welcome-title {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 900;
          margin: 0 0 var(--space-md) 0;
          line-height: 1.1;
        }

        .welcome-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin: 0;
          line-height: 1.6;
        }

        .welcome-illustration {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .illustration-circle {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent), #ea580c);
          border-radius: 50%;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .illustration-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .overview-stats {
          margin-bottom: var(--space-2xl);
        }

        .overview-stat {
          cursor: default;
        }

        .card {
          background: var(--white);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .card-header {
          padding: var(--space-xl);
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .btn-view-all {
          padding: 0.5rem 1rem;
          background: var(--background);
          color: var(--navy);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-view-all:hover {
          background: var(--accent);
          color: var(--white);
          border-color: var(--accent);
        }

        .card-content {
          padding: var(--space-xl);
        }

        .appointments-list-compact {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .appointment-compact {
          padding: var(--space-lg);
          background: var(--background);
          border-radius: var(--radius-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
          cursor: pointer;
          transition: var(--transition);
          border: 2px solid transparent;
        }

        .appointment-compact:hover {
          background: var(--white);
          border-color: var(--accent);
          transform: translateX(4px);
          box-shadow: var(--shadow);
        }

        .compact-lawyer {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
          min-width: 0;
        }

        .compact-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--accent);
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-family: var(--font-display);
        }

        .compact-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .compact-info {
          flex: 1;
          min-width: 0;
        }

        .compact-name {
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .compact-date {
          font-size: 0.875rem;
          color: var(--gray);
          font-weight: 500;
        }

        .compact-status {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          color: var(--white);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          box-shadow: var(--shadow);
        }

        /* ============================================
           EMPTY STATES
           ============================================ */
        
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
        }

        .empty-state.small {
          padding: var(--space-xl);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-lg);
        }

        .empty-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 var(--space-md) 0;
        }

        .empty-text {
          font-size: 1.125rem;
          color: var(--gray);
          margin: 0 0 var(--space-xl) 0;
          line-height: 1.6;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }

        .no-appointments {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--gray);
          font-style: italic;
        }

        /* ============================================
           LOADING STATES
           ============================================ */
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: var(--space-lg);
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gray);
          margin: 0;
        }

        /* ============================================
           MODALS
           ============================================ */
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-lg);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--radius-2xl);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: var(--space-xl);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        }

        .modal-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--gray);
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .modal-close:hover {
          background: var(--background);
          color: var(--navy);
        }

        .modal-body {
          padding: var(--space-xl);
        }

        .detail-section {
          margin-bottom: var(--space-xl);
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-section-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 var(--space-lg) 0;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .lawyer-detail-card {
          display: flex;
          gap: var(--space-lg);
          background: var(--background);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .lawyer-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 3px solid var(--accent);
          box-shadow: var(--shadow);
        }

        .lawyer-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lawyer-detail-info {
          flex: 1;
        }

        .lawyer-detail-info h5 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 var(--space-xs) 0;
        }

        .lawyer-detail-info .specialty {
          font-size: 1rem;
          color: var(--gray);
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .lawyer-detail-info .contact {
          font-size: 0.875rem;
          color: var(--gray);
          margin: 0.25rem 0;
        }

        .info-grid {
          display: grid;
          gap: var(--space-md);
        }

        .info-item {
          padding: var(--space-md);
          background: var(--background);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }

        .info-label {
          font-weight: 700;
          color: var(--gray);
          font-size: 0.875rem;
        }

        .info-value {
          font-weight: 600;
          color: var(--navy);
          text-align: right;
        }

        .status-badge-small {
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          color: var(--white);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: var(--shadow);
          white-space: nowrap;
        }

        .message-box {
          background: var(--background);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--accent);
        }

        .message-box p {
          color: var(--slate);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .note-box {
          border-left-color: var(--primary);
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .modal-footer {
          padding: var(--space-xl);
          border-top: 1px solid var(--border);
          background: var(--background);
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .btn-modal {
          padding: 0.875rem 1.75rem;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          box-shadow: var(--shadow);
        }

        .btn-modal:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* ============================================
           MOBILE MENU
           ============================================ */
        
        .mobile-menu-toggle {
          display: none;
          position: fixed;
          top: 90px;
          left: var(--space-lg);
          z-index: 101;
          background: var(--navy);
          border-radius: var(--radius-lg);
          padding: var(--space-sm);
          box-shadow: var(--shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .hamburger {
          width: 24px;
          height: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
        }

        .hamburger span {
          display: block;
          height: 3px;
          width: 100%;
          background: var(--white);
          border-radius: 2px;
          transition: var(--transition);
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

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 99;
        }

        /* ============================================
           RESPONSIVE DESIGN
           ============================================ */
        
        @media (max-width: 1024px) {
          .dashboard-main {
            margin-left: 280px;
            padding: var(--space-xl);
          }

          .dashboard-sidebar {
            width: 280px;
          }

          .view-title {
            font-size: 2.5rem;
          }

          .stats-container {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block;
          }

          .sidebar-overlay {
            display: block;
            opacity: 0;
            pointer-events: none;
            transition: var(--transition);
          }

          .sidebar-overlay.active {
            opacity: 1;
            pointer-events: all;
          }

          .dashboard-sidebar {
            transform: translateX(-100%);
            top: 0;
            height: 100vh;
            z-index: 100;
          }

          .dashboard-sidebar.mobile-open {
            transform: translateX(0);
          }

          .dashboard-sidebar.mobile-open ~ .sidebar-overlay {
            opacity: 1;
            pointer-events: all;
          }

          .close-sidebar {
            display: block;
          }

          .dashboard-main {
            margin-left: 0;
            padding: var(--space-lg);
            padding-top: 80px;
          }

          .view-title {
            font-size: 2rem;
          }

          .view-subtitle {
            font-size: 1rem;
          }

          .stats-container {
            grid-template-columns: 1fr;
            gap: var(--space-md);
          }

          .stat-card {
            padding: var(--space-lg);
          }

          .stat-icon {
            width: 56px;
            height: 56px;
            font-size: 1.75rem;
          }

          .stat-number {
            font-size: 2rem;
          }

          .appointment-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .appointment-date-time {
            flex-direction: column;
          }

          .appointment-card-footer {
            flex-direction: column;
          }

          .btn-action {
            width: 100%;
            justify-content: center;
          }

          .btn-group {
            width: 100%;
          }

          .welcome-header {
            flex-direction: column;
            text-align: center;
          }

          .welcome-title {
            font-size: 2rem;
          }

          .welcome-subtitle {
            font-size: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .profile-info-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-cancel,
          .btn-save {
            width: 100%;
          }

          .modal-content {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .lawyer-detail-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .modal-footer {
            flex-direction: column;
          }

          .btn-modal {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .mobile-menu-toggle {
            top: 85px;
            left: var(--space-md);
          }

          .dashboard-main {
            padding: var(--space-md);
            padding-top: 70px;
          }

          .view-header-section {
            margin-bottom: var(--space-xl);
          }

          .view-title {
            font-size: 1.75rem;
          }

          .stats-container {
            gap: var(--space-sm);
          }

          .stat-card {
            padding: var(--space-md);
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
          }

          .stat-number {
            font-size: 1.75rem;
          }

          .appointments-section {
            padding: var(--space-lg);
          }

          .section-title {
            font-size: 1.5rem;
          }

          .appointment-card-header,
          .appointment-card-body,
          .appointment-card-footer {
            padding: var(--space-md);
          }

          .date-block {
            min-width: 80px;
            padding: var(--space-md);
          }

          .date-number {
            font-size: 2rem;
          }

          .welcome-title {
            font-size: 1.75rem;
          }

          .profile-section {
            padding: var(--space-lg);
          }

          .section-title {
            font-size: 1.5rem;
          }

          .card {
            border-radius: var(--radius-xl);
          }
        }

        /* ============================================
           PRINT STYLES
           ============================================ */
        
        @media print {
          .dashboard-sidebar,
          .mobile-menu-toggle,
          .sidebar-overlay,
          .btn-action,
          .btn-edit,
          .logout-btn,
          .form-actions {
            display: none !important;
          }

          .dashboard-main {
            margin-left: 0;
          }

          .appointment-card,
          .profile-section,
          .card {
            box-shadow: none !important;
            border: 1px solid var(--border) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientDashboard;