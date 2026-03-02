import React, { useEffect, useState } from 'react';
import { IoCalendarSharp, IoPerson, IoDocumentText } from 'react-icons/io5';
import { AiOutlineEdit, AiOutlineClockCircle, AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import { rendezVousAPI } from '../services/api';
import EditAppointmentModal from './EditAppointmentModal';

const ClientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const canceledStatuses = ['refusé', 'annulé', 'rejeté'];

  useEffect(() => {
    if (user?._id) {
      setLoading(true);
      rendezVousAPI.getClientRendezVous(user._id)
        .then(res => {
          console.log('Client appointments response:', res);
          const data = res.data || [];
          const getTimestamp = (item) => {
            if (item.createdAt) return new Date(item.createdAt).getTime();
            if (item._id) return parseInt(item._id.substring(0,8), 16) * 1000;
            return 0;
          };
          data.sort((a,b) => getTimestamp(b) - getTimestamp(a));
          setAppointments(data);
        })
        .catch(err => {
          console.error('Error loading appointments:', err);
          setAppointments([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmé':
        return '#22c55e';
      case 'en_attente':
        return '#f59e0b';
      case 'rejeté':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmé':
        return <AiOutlineCheck />;
      case 'en_attente':
        return <AiOutlineClockCircle />;
      case 'rejeté':
        return <AiOutlineClose />;
      default:
        return <IoDocumentText />;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'canceled') return canceledStatuses.includes(apt.statut);
    return apt.statut === filter;
  });

  const [editing, setEditing] = useState(null);

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '18px', margin: 0 }}>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      fontFamily: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        padding: '30px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              margin: '0 0 8px 0' 
            }}>
              My Appointments
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '1.1rem', 
              margin: 0 
            }}>
              Manage your scheduled consultations
            </p>
          </div>
          <button 
            onClick={() => window.history.back()}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ← Back to Dashboard
          </button>
        </div>
        {/* Summary / Stats Cards - clickable to filter the list */}
        <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
          {(() => {
            const today = new Date();
            const pendingCount = appointments.filter(a => a.statut === 'en_attente').length;
            const paidCount = appointments.filter(a => a.statut === 'payé').length;
            const confirmedCount = appointments.filter(a => a.statut === 'confirmé').length;
            const upcomingCount = appointments.filter(a => new Date(a.date) >= today && a.statut === 'confirmé').length;
            const cards = [
              { key: 'en_attente', label: 'Awaiting Response', count: pendingCount, bg: 'white', color: '#f59e0b' },
              { key: 'payé', label: 'Payment Completed', count: paidCount, bg: 'white', color: '#667eea' },
              { key: 'confirmé', label: 'Confirmed Meetings', count: confirmedCount, bg: 'white', color: '#10b981' },
              { key: 'upcoming', label: 'Upcoming Meetings', count: upcomingCount, bg: 'linear-gradient(135deg, #CFAE70, #1D6A5E)', color: 'white' }
            ];

            return cards.map(card => (
              <div
                key={card.key}
                onClick={() => setFilter(card.key === 'upcoming' ? 'confirmé' : card.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setFilter(card.key === 'upcoming' ? 'confirmé' : card.key); }}
                style={{
                  background: card.bg,
                  color: card.color || (filter === card.key ? '#667eea' : '#111827'),
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: filter === card.key ? '0 12px 40px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.06)',
                  border: filter === card.key ? '2px solid rgba(255,255,255,0.6)' : '1px solid rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{card.count}</div>
                <div style={{ fontSize: '0.95rem', color: card.color === 'white' ? 'white' : 'rgba(0,0,0,0.6)' }}>{card.label}</div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px' }}>
        {/* Action Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button 
            onClick={() => window.location.href = '/lawyers'}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}
          >
            + Book New Appointment
          </button>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'en_attente', 'confirmé', 'canceled'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  background: filter === status 
                    ? 'rgba(255, 255, 255, 0.95)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: filter === status ? '#667eea' : 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  textTransform: 'capitalize'
                }}
        >
        {status === 'all' ? 'All' : (status === 'canceled' ? 'Canceled' : (status === 'confirmé' ? 'Confirmed' : status.replace('_', ' ')))}
                {status !== 'all' && (
                  <span style={{
                    background: filter === status ? '#667eea' : 'rgba(255, 255, 255, 0.2)',
                    color: filter === status ? 'white' : 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '11px',
                    marginLeft: '6px',
                    minWidth: '16px',
                    display: 'inline-block',
                    textAlign: 'center'
                  }}>
          {status === 'canceled' ? appointments.filter(apt => canceledStatuses.includes(apt.statut)).length : appointments.filter(apt => apt.statut === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Grid */}
        {filteredAppointments.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}><IoCalendarSharp /></div>
            <h3 style={{ color: '#6b7280', fontSize: '1.5rem', margin: '0 0 12px 0' }}>
              No appointments found
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '1rem', margin: '0 0 30px 0' }}>
              {filter === 'all' 
                ? "You haven't booked any appointments yet."
                : `No ${filter.replace('_', ' ')} appointments found.`}
            </p>
            <button 
              onClick={() => window.location.href = '/lawyers'}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '30px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(20px)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: `${getStatusColor(appointment.statut)}20`,
                    color: getStatusColor(appointment.statut),
                    borderRadius: '50px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {getStatusIcon(appointment.statut)}
                    {appointment.statut.toUpperCase().replace('_', ' ')}
                  </div>
                  <div style={{
                    background: appointment.type === 'visio' ? '#e6f3ff' : '#f0f9ff',
                    color: appointment.type === 'visio' ? '#1e40af' : '#0369a1',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {appointment.type}
                  </div>
                </div>

                {/* Appointment Details */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    color: '#1f2937',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    margin: '0 0 16px 0'
                  }}>
                    Consultation with {appointment.avocatId?.fullName || 'Lawyer'}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        <IoCalendarSharp color="white" />
                      </div>
                      <div>
                        <div style={{ color: '#374151', fontWeight: '500' }}>
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                          at {appointment.heure}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        <IoPerson color="white" />
                      </div>
                      <div>
                        <div style={{ color: '#374151', fontWeight: '500' }}>
                          {appointment.avocatId?.fullName || 'Lawyer Name'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                          {appointment.avocatId?.email || 'Legal Consultation'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setEditing(appointment)}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <AiOutlineEdit style={{ verticalAlign: 'middle', marginRight: 6 }} /> Edit
                  </button>
                  {appointment.statut === 'en_attente' && (
                    <button style={{
                      background: '#fbbf24',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      flex: 1
                    }}>
                      Waiting for Approval
                    </button>
                  )}
                  {appointment.statut === 'confirmé' && (
                    <button style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      flex: 1
                    }}>
                      Join Meeting
                    </button>
                  )}
                  <button style={{
                    background: '#e5e7eb',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditAppointmentModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setAppointments(apps => apps.map(a => a._id === updated._id ? updated : a));
            setEditing(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClientAppointments;
