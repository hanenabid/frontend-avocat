import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoLocationSharp, IoFolderSharp } from 'react-icons/io5';
import { AiOutlineCheck, AiOutlineEdit } from 'react-icons/ai';
import { rendezVousAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AnimatedErrorBanner from './AnimatedErrorBanner';
import './BookingModal.css';
import mapToKey from '../utils/i18nMapping';

const BookingModal = ({ avocat, open, onClose, onEdit, mode = 'book', existingAppointment = null, onRescheduled }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Also check localStorage directly in case of sync issues
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = user || storedUser;
  
  // Debug user object
  console.log('User from context:', user);
  console.log('User from localStorage:', storedUser);
  console.log('Current user:', currentUser);
  console.log('User._id:', currentUser?._id);
  console.log('User.id:', currentUser?.id);
  
  const isSignedIn = !!(currentUser?._id || currentUser?.id);
  console.log('🔍 isSignedIn:', isSignedIn);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStatus, setBookingStatus] = useState('');
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [caseFilesToUpload, setCaseFilesToUpload] = useState([]);
  const [uploadedCaseFiles, setUploadedCaseFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [notes, setNotes] = useState('');
  const [lawyerWorkingHours, setLawyerWorkingHours] = useState(null);

  // Debug logging for authentication
  useEffect(() => {
  console.log('BookingModal Auth State:', {
      user,
      isSignedIn,
      userId: user?._id,
      userType: user?.type,
      userRole: user?.role
    });
  }, [user, isSignedIn]);

  useEffect(() => {
    if (open) {
      // Only pre-select date/time in reschedule mode
      if (mode === 'reschedule' && existingAppointment) {
        setSelectedDate(existingAppointment.date ? new Date(existingAppointment.date).toISOString().split('T')[0] : '');
        setSelectedTime(existingAppointment.heure || '');
        // Show existing files in reschedule mode
        setUploadedCaseFiles(existingAppointment.caseFiles || []);
        setNotes(existingAppointment.notes || existingAppointment.message || '');
      } else {
        // In booking mode, start with no date/time selected
        setSelectedDate('');
        setSelectedTime('');
        setUploadedCaseFiles([]);
        setNotes('');
      }
      setError('');
      setBookingStatus('');
      setCurrentMonth(new Date());
      setAvailableSlots([]);
      setLoadingSlots(false);
      setShowAllSlots(false);
      setCaseFilesToUpload([]);
      setUploadedCaseFiles([]);
      setCurrentStep(1);
      setNotes('');
    }
  }, [open, mode, existingAppointment]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (selectedDate && avocat?._id) {
      setLoadingSlots(true);
      setAvailableSlots([]);
      
      // Store the current selected time if in reschedule mode
      const currentSelectedTime = mode === 'reschedule' && existingAppointment ? selectedTime : null;
      
      // Get day of week from selected date
      const date = new Date(selectedDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
  console.log('Fetching slots for:', {
        avocat: avocat,
        avocatId: avocat?._id || avocat?.id,
        dayOfWeek,
        selectedDate,
        rescheduleMode: mode === 'reschedule',
        currentSelectedTime
      });
      
      // Check if avocat has an ID
      const avocatId = avocat?._id || avocat?.id;
      if (!avocatId) {
        console.error('No avocat ID found:', avocat);
        setLoadingSlots(false);
        setError('Lawyer ID not found');
        return;
      }
      
      // Fetch available slots from backend with cache busting
      const timestamp = Date.now(); // Add timestamp to avoid caching
      api.get('/api/rendezvous/slots', { 
        params: { 
          avocatId: avocatId, 
          day: dayOfWeek, 
          date: selectedDate,
          _t: timestamp // Cache busting parameter
        } 
      })
        .then(response => {
          console.log('Slots response:', response.data);
          if (response.data && Array.isArray(response.data)) {
            setAvailableSlots(response.data);
            
            // If in reschedule mode and we have a current selected time, 
            // check if it's available in the new date's slots and keep it selected
            if (mode === 'reschedule' && currentSelectedTime && response.data.length > 0) {
              const existingSlot = response.data.find(slot => slot.startTime === currentSelectedTime);
              if (existingSlot) {
                // Keep the existing time selected if the slot is available
                console.log('Preserving selected time in reschedule mode:', currentSelectedTime);
                // Don't call setSelectedTime here as it's already set
              } else {
                // If the time slot is not available on the new date, clear the selection
                console.log('Time slot not available on new date, clearing selection');
                setSelectedTime('');
              }
            }
          } else {
            setAvailableSlots([]);
          }
        })
        .catch(error => {
        console.error('Error fetching available slots:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
          setAvailableSlots([]);
          setError(t('bookingModal.errorLoadingSlots'));
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    } else {
      setAvailableSlots([]);
      setLoadingSlots(false);
    }
  }, [selectedDate, avocat, t, mode, existingAppointment, selectedTime]);

  // Fetch lawyer's working hours to show closed days
  useEffect(() => {
    const fetchWorkingHours = async () => {
      if (avocat && avocat._id) {
        try {
          const res = await api.get(`/api/auth/working-hours/${avocat._id}`);
          if (res.data && res.data.workingHours) {
            setLawyerWorkingHours(res.data.workingHours);
          }
        } catch (err) {
          console.error('Failed to fetch lawyer working hours:', err);
        }
      }
    };
    fetchWorkingHours();
  }, [avocat]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setCaseFilesToUpload(files);
  };

  // Upload files to backend; expects endpoint /api/uploads that returns { url, filename, contentType }
  const uploadFiles = async () => {
    if (!caseFilesToUpload.length) return [];
    const uploaded = [];
    for (const file of caseFilesToUpload) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await api.post('/api/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data && res.data.url) {
          uploaded.push({ url: res.data.url, filename: file.name, contentType: file.type });
        }
      } catch (err) {
        console.error('File upload failed for', file.name, err);
      }
    }
    setUploadedCaseFiles(uploaded);
    return uploaded;
  };

  // Check if a specific date corresponds to a closed day
  const isDayClosed = (date) => {
    if (!lawyerWorkingHours || typeof lawyerWorkingHours !== 'object') return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingDay = lawyerWorkingHours[dayName];
    return workingDay ? !workingDay.isOpen : false;
  };

  const getDaysInWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateDisplay = (date) => {
    // Use Intl/locales to return localized short weekday and month names.
    // This respects current i18n language (e.g., 'ar' for Arabic).
    const locale = (i18n && i18n.language) ? i18n.language : 'en-US';

    // weekday: 'short' gives short localized weekday (e.g., 'الأحد' or 'Sun')
    const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
    const monthName = date.toLocaleDateString(locale, { month: 'short' });

    return {
      dayName: dayName,
      day: date.getDate(),
      month: monthName
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    const dateToCheck = new Date(date);
    
    // Set time to start of day for comparison
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const dateStart = new Date(dateToCheck);
    dateStart.setHours(0, 0, 0, 0);
    
    // If the date is before today, it's definitely past
    if (dateStart < todayStart) {
      return true;
    }
    
    // If the date is today, check if current time is past 5 PM (17:00)
    if (dateStart.getTime() === todayStart.getTime()) {
      const currentHour = today.getHours();
      return currentHour >= 17; // 5 PM or later
    }
    
    // Future dates are not past
    return false;
  };

  // Check whether a given date string (YYYY-MM-DD) and time string (HH:MM) is in the past
  const isSlotInPast = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    try {
      const [hour, minute] = timeString.split(':').map(Number);
      const d = new Date(dateString); // dateString is YYYY-MM-DD
      d.setHours(hour, minute || 0, 0, 0);
      const now = new Date();
      return d <= now;
    } catch (err) {
      return false;
    }
  };

  const handleDateSelect = (date) => {
    if (isPastDate(date)) return;
    setSelectedDate(formatDate(date));
    setError('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setError('');
  };

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentMonth);
    prevWeek.setDate(currentMonth.getDate() - 7);
    setCurrentMonth(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentMonth);
    nextWeek.setDate(currentMonth.getDate() + 7);
    setCurrentMonth(nextWeek);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBookingStatus('');
    
    if (!selectedDate || !selectedTime) {
          setError(t('bookingModal.selectDateTime'));
      return;
    }

    try {
      // Get client ID - try both _id and id fields from both sources
      const clientId = currentUser?._id || currentUser?.id;
      
  console.log('Attempting booking with clientId:', clientId);
  console.log('Current user object:', currentUser);
      
      // If user is not signed in, they need to provide client info
      if (!clientId) {
        setError(t('bookingModal.signInRequired'));
        return;
      }

      console.log('🚀 Booking appointment with data:', {
        clientId,
        avocatId: avocat._id,
        date: selectedDate,
        heure: selectedTime,
        type: 'visio'
      });

      // For reschedule mode, update the appointment via API
      if (mode === 'reschedule' && existingAppointment && existingAppointment._id) {
        try {
          // Upload any new files first
          const uploadedFiles = await uploadFiles();
          
          // Determine which files to send:
          // If new files were uploaded, use only the new files (replace existing)
          // If no new files, keep existing files or current uploadedCaseFiles
          let finalCaseFiles;
          if (uploadedFiles.length > 0) {
            // Replace existing files with new ones
            finalCaseFiles = uploadedFiles;
          } else {
            // Keep current files (could be existing files or previously uploaded files)
            finalCaseFiles = uploadedCaseFiles;
          }

          // Call the API to update the appointment
          const response = await rendezVousAPI.updateRendezVous(existingAppointment._id, {
            date: selectedDate,
            heure: selectedTime,
            notes: notes || existingAppointment.notes || existingAppointment.message,
            caseFiles: finalCaseFiles
          });

          // Build the updated object with the response data
          const updatedObj = response.data || {
            ...existingAppointment,
            date: selectedDate,
            heure: selectedTime,
            notes: notes || existingAppointment.notes || existingAppointment.message,
            caseFiles: finalCaseFiles
          };

          setBookingStatus(t('bookingModal.appointmentUpdated'));
          setSelectedDate('');
          setSelectedTime('');
          setCurrentStep(1);
          
          // Clear selections and notify parent component
          setTimeout(() => {
            setUploadedCaseFiles([]);
            setNotes('');
            if (onRescheduled) onRescheduled(updatedObj);
            onClose();
          }, 900);

          return;
        } catch (error) {
          console.error('Error rescheduling appointment:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to reschedule appointment';
          setError(errorMessage);
          return;
        }
      }

      // Upload any selected files first for real booking flow
      const uploaded = await uploadFiles();

      let response = await rendezVousAPI.bookRendezVous({
        clientId,
        avocatId: avocat._id,
        date: selectedDate,
        heure: selectedTime,
        type: 'visio', // Default to visio, you can add a selector for this
        caseFiles: uploaded,
        notes
      });
      
  console.log('Booking response:', response.data);
      setBookingStatus(t('bookingModal.bookingSuccess'));
      setSelectedDate('');
      setSelectedTime('');
      setCurrentStep(1);
      // clear selections after slight delay so user sees success message
      setTimeout(() => {
        setUploadedCaseFiles([]);
        setNotes('');
        if (mode === 'reschedule' && onRescheduled) onRescheduled(response.data?.rendezvous || response.data || {});
        onClose();
      }, 900);
    } catch (err) {
  console.error('Booking error:', err);
  console.error('Error response:', err.response?.data);
  console.error('Error status:', err.response?.status);
      setError(`${t('bookingModal.bookingFailed')}: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!open) return null;

  const days = getDaysInWeek(currentMonth);
  const localeForHeader = (i18n && i18n.language) ? i18n.language : 'en-US';
  const weekRange = `${days[0].toLocaleDateString(localeForHeader, { month: 'short', day: 'numeric' })} - ${days[6].toLocaleDateString(localeForHeader, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const modalContent = (
    <div className="booking-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="booking-modal">
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose}
          className="modal-close-btn"
          aria-label={t('bookingModal.close', { defaultValue: 'Close' })}
        >
          ×
        </button>

        {/* Lawyer Info */}
            <div className="lawyer-info-card">

            

              {onEdit && (
                <div className="lawyer-actions">
                  <button
                    type="button"
                    className="lawyer-edit-btn"
                    onClick={() => onEdit(avocat)}
                    aria-label={`Edit ${avocat.fullName}`}
                  >
                    <AiOutlineEdit style={{ verticalAlign: 'middle', marginRight: 6 }} /> Edit
                  </button>
                </div>
              )}
            </div>

        {/* Step Progress Indicator */}
        <div className="step-progress" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: 20, 
          padding: '0 20px' 
        }}>
          {[1, 2, 3].map(step => (
            <div key={step} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flex: 1, 
              position: 'relative' 
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: currentStep >= step ? '#CFAE70' : '#e9ecef',
                color: currentStep >= step ? 'white' : '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 14,
                zIndex: 2,
                position: 'relative'
              }}>
                {step}
              </div>
              {step < 3 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: currentStep > step ? '#CFAE70' : '#e9ecef',
                  marginLeft: 8
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 20,
          color: 'var(--primary-navy)',
          fontWeight: 600
        }}>
          {currentStep === 1 && t('bookingModal.stepTitle1', 'Choose Date & Time')}
          {currentStep === 2 && t('bookingModal.stepTitle2', 'Add Notes & Files')}
          {currentStep === 3 && t('bookingModal.stepTitle3', 'Review Appointment')}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Date & Time Selection */}
          {currentStep === 1 && (
            <>
              {/* Date Selection */}
              <div className="section">
                <h4>{t('bookingModal.chooseDate')}</h4>
                
                <div className="calendar-header">
                  <button type="button" onClick={handlePrevWeek} className="nav-btn">‹</button>
                  <span className="month-year">{weekRange}</span>
                  <button type="button" onClick={handleNextWeek} className="nav-btn">›</button>
                </div>

                <div className="calendar-grid">
                  {days.map((date, index) => {
                    const dateDisplay = getDateDisplay(date);
                    const isSelected = selectedDate === formatDate(date);
                    const isDisabled = isPastDate(date);
                    const isTodayDate = isToday(date);
                    const isClosed = isDayClosed(date);

                    return (
                      <div
                        key={index}
                        className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled || isClosed ? 'disabled' : ''} ${isTodayDate ? 'today' : ''} ${isClosed ? 'closed' : ''}`}
                        onClick={() => !isDisabled && !isClosed && handleDateSelect(date)}
                      >
                        <div className="day-name">{dateDisplay.dayName}.</div>
                        <div className="day-number">{dateDisplay.day}</div>
                        <div className="month-name">{dateDisplay.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="section">
                  <h4>{t('bookingModal.chooseTime')}</h4>
                  {loadingSlots ? (
                    <div className="loading-slots">{t('bookingModal.loadingSlots')}</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="time-slots">
                      {(() => {
                        const visibleCount = 8; // show first 2 rows (4 columns)
                        const displayed = showAllSlots ? availableSlots : availableSlots.slice(0, visibleCount);
                        const originalTime = mode === 'reschedule' && existingAppointment ? existingAppointment.heure : null;
                        
                        return displayed.map((slot, index) => {
                          const slotDisabled = isSlotInPast(selectedDate, slot.startTime);
                          const isOriginalSlot = originalTime === slot.startTime;
                          const isSelected = selectedTime === slot.startTime;
                          
                          return (
                            <button
                              key={`${selectedDate}-${slot.startTime}-${index}`}
                              type="button"
                              className={`time-slot ${isSelected ? 'selected' : ''} ${slotDisabled ? 'disabled' : ''} ${isOriginalSlot ? 'original-slot' : ''}`}
                              onClick={() => { if (!slotDisabled) handleTimeSelect(slot.startTime); }}
                              disabled={slotDisabled}
                              title={slotDisabled ? 'This time slot is in the past' : isOriginalSlot ? `Original appointment time: ${slot.startTime}` : `Choose ${slot.startTime}`}
                            >
                              {slot.startTime} - {slot.endTime}
                              {isOriginalSlot && <span className="original-indicator">●</span>}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="no-slots">{t('bookingModal.noSlots')}</div>
                  )}
                  {availableSlots.length > 8 && (
                    <button
                      type="button"
                      className="see-more"
                      onClick={() => setShowAllSlots(s => !s)}
                    >
                      {showAllSlots ? t('bookingModal.showFewer') : t('bookingModal.showMore')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 2: Notes & Files only */}
          {currentStep === 2 && (
            <div className="section notes-files-step">
              <h4 style={{ marginTop: 0 }}>{t('bookingModal.stepTitle2')}</h4>
              <p className="step-description">{t('bookingModal.stepDescription', 'Provide any additional information or documents for your appointment.')}</p>

              {/* Notes Section */}
              <div className="notes-section" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  {t('bookingModal.notesForLawyer', 'Notes for the lawyer:')}
                </label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder={t('bookingModal.notesPlaceholder', 'Add any notes, questions, or details about your case that would help the lawyer prepare for your appointment...')} 
                  style={{ 
                    width: '100%', 
                    minHeight: 100, 
                    padding: 12, 
                    border: '1px solid #ddd', 
                    borderRadius: 8, 
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }} 
                />
              </div>

              {/* File Upload Section */}
              <div className="file-upload-section">
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  {t('bookingModal.uploadDocuments', 'Upload Documents (Optional):')}
                </label>
                <div className="file-upload-block">
                  <label className="file-upload-label booking">
                    <input type="file" onChange={handleFileChange} multiple className="file-input-hidden" />
                    <div className="file-upload-icon"><IoFolderSharp /></div>
                    <div className="file-upload-text">
                      {caseFilesToUpload.length > 0 ? (
                        <div>
                          {caseFilesToUpload.map((f, i) => (
                            <div key={i} className="file-name">
                              {f.name} <span className="file-meta">({Math.round(f.size/1024)} KB)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="file-empty">
                          <span style={{ fontWeight: 600 }}>Click to upload files</span>
                          <br />
                          <small style={{ color: '#666' }}>PDF, JPG, PNG • {t('bookingModal.uploadFiles', 'Add documents')}</small>
                        </div>
                      )}
                    </div>
                  </label>

                  {caseFilesToUpload.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <button type="button" onClick={uploadFiles} className="confirm-btn" style={{ padding: '8px 16px', fontSize: 14 }}>
                        Upload Selected Files
                      </button>
                    </div>
                  )}

                  {uploadedCaseFiles.length > 0 && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                      <strong style={{ color: '#28a745', fontSize: 14 }}>
                        ✓ {mode === 'reschedule' && existingAppointment && existingAppointment.caseFiles && existingAppointment.caseFiles.length > 0 && caseFilesToUpload.length === 0 
                          ? 'Existing Files:' 
                          : 'Files Uploaded Successfully:'}
                      </strong>
                      <div style={{ marginTop: 8 }}>
                        {uploadedCaseFiles.map((f, i) => (
                          <div key={i} style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontSize: 14 }}>
                              📄 {f.filename}
                            </a>
                            {mode === 'reschedule' && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  // Remove this file from the uploaded files
                                  setUploadedCaseFiles(uploadedCaseFiles.filter((_, index) => index !== i));
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#dc3545', 
                                  cursor: 'pointer', 
                                  fontSize: '12px',
                                  padding: '2px 6px'
                                }}
                                title="Remove file"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {mode === 'reschedule' && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                          💡 Select new files above to replace existing files
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review Only */}
          {currentStep === 3 && (
            <div className="section review-step">
              <h4 style={{ marginTop: 0 }}>{t('bookingModal.reviewTitle', 'Review Your Appointment')}</h4>
              <p className="step-description">{t('bookingModal.reviewDescription', 'Please review your appointment details before confirming.')}</p>

              {/* Review Summary */}
              <div className="review-summary" style={{ marginTop: 20 }}>
                <div className="review-item" style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ color: 'var(--primary-navy)' }}>{t('bookingModal.appointmentDetails', 'Appointment Details')}</strong>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{t('bookingModal.date', 'Date')}:</span> {selectedDate}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{t('bookingModal.time', 'Time')}:</span> {selectedTime}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>{t('bookingModal.type', 'Type')}:</span> {t('bookingModal.videoConsultation', 'Video Consultation')}
                  </div>
                </div>

                {notes && (
                  <div className="review-item" style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: 'var(--primary-navy)' }}>{t('bookingModal.notesTitle', 'Your Notes')}:</strong>
                    </div>
                    <div style={{ padding: 12, background: 'white', borderRadius: 6, fontSize: 14, lineHeight: 1.5, border: '1px solid #dee2e6' }}>
                      {notes}
                    </div>
                  </div>
                )}

                {uploadedCaseFiles.length > 0 && (
                  <div className="review-item" style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: 'var(--primary-navy)' }}>{t('bookingModal.attachedFiles', 'Attached Files')}:</strong>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {uploadedCaseFiles.map((f, i) => (
                        <div key={i} style={{ marginBottom: 8, padding: 8, background: 'white', borderRadius: 4, border: '1px solid #dee2e6' }}>
                          <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#007bff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>📄</span>
                            <span style={{ fontSize: 14 }}>{f.filename}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!notes && uploadedCaseFiles.length === 0 && (
                  <div className="review-item" style={{ marginBottom: 16, padding: 16, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffeaa7' }}>
                    <div style={{ color: '#856404', fontSize: 14, textAlign: 'center' }}>
                      {t('bookingModal.noAdditionalInfo', 'No additional notes or files provided')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <AnimatedErrorBanner message={error ? t(error, { defaultValue: error }) : ''} visible={Boolean(error)} />
          {bookingStatus && <div className="success-message">{bookingStatus}</div>}

          <div className="button-group">
            {currentStep === 1 ? (
              (() => {
                const selectedSlotIsPast = selectedDate ? isSlotInPast(selectedDate, selectedTime) : true;
                return (
                  <>
                    <button
                      type="button"
                      className="confirm-btn"
                      disabled={!selectedDate || !selectedTime || selectedSlotIsPast}
                      onClick={() => {
                        setError('');
                        setCurrentStep(2);
                      }}
                    >
                      {t('bookingModal.nextStep', 'Next: Add Notes & Files')}
                    </button>
                    <button type="button" onClick={onClose} className="cancel-btn">{t('bookingModal.cancel')}</button>
                  </>
                );
              })()
            ) : currentStep === 2 ? (
              <>
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={() => {
                    setError('');
                    setCurrentStep(3);
                  }}
                >
                  {t('bookingModal.nextReview', 'Next: Review & Confirm')}
                </button>
                <button type="button" onClick={() => setCurrentStep(1)} className="cancel-btn">{t('bookingModal.back', 'Back')}</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime}
                >
                  {t('bookingModal.confirmBooking')}
                </button>
                <button type="button" onClick={() => setCurrentStep(2)} className="cancel-btn">{t('bookingModal.back', 'Back')}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  // Render modal content using React Portal to ensure it's on top of everything
  return createPortal(
    <>
      {modalContent}
      <style>{`
        .calendar-grid {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 8px 0;
          margin: 16px 0;
          -webkit-overflow-scrolling: touch;
        }

        .calendar-day {
          flex: 0 0 auto;
          min-width: 80px;
          height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          padding: 8px;
        }

        .calendar-day:hover {
          background: #e9ecef;
          border-color: #1B263B;
        }

        .calendar-day.selected {
          background: #1B263B;
          border-color: #1B263B;
          color: white;
        }

        .calendar-day.disabled {
          background: #f1f1f1;
          border-color: #ddd;
          color: #999;
          cursor: not-allowed;
        }

        .calendar-day.closed {
          background: #e0e0e0;
          border-color: #bbb;
          color: #777;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .calendar-day.closed:hover {
          background: #e0e0e0;
          border-color: #bbb;
          transform: none;
        }

        .calendar-day.today {
          border-color: #CFAE70;
          background: #fef7e4;
        }

        .calendar-day.today.selected {
          background: #1B263B;
          border-color: #1B263B;
          color: white;
        }

        .day-name {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 2px;
          opacity: 0.8;
        }

        .day-number {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .month-name {
          font-size: 10px;
          opacity: 0.7;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .nav-btn {
          background: #1B263B;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          transition: background 0.2s ease;
        }

        .nav-btn:hover {
          background: #2D2D2D;
        }

        .month-year {
          font-weight: 600;
          font-size: 16px;
          color: #1B263B;
        }

        @media (max-width: 768px) {
          .calendar-grid {
            gap: 6px;
            padding: 6px 0;
            margin: 12px 0;
          }

          .calendar-day {
            min-width: 70px;
            height: 80px;
            padding: 6px;
          }

          .day-number {
            font-size: 16px;
          }

          .day-name {
            font-size: 10px;
          }

          .month-name {
            font-size: 9px;
          }
        }

        @media (max-width: 480px) {
          .calendar-grid {
            gap: 4px;
          }

          .calendar-day {
            min-width: 60px;
            height: 70px;
            padding: 4px;
          }

          .day-number {
            font-size: 14px;
          }

          .day-name {
            font-size: 9px;
          }

          .month-name {
            font-size: 8px;
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default BookingModal;
