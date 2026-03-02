import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rendezVousAPI } from '../services/rendezVousApi';
import EditAppointmentModal from './EditAppointmentModal';
import { IoCalendarSharp, IoPerson, IoBarChart, IoDocumentText, IoCall } from 'react-icons/io5';
import { AiOutlineClockCircle, AiOutlineCheck, AiOutlineClose, AiOutlineEdit } from 'react-icons/ai';

const LawyerAppointments = ({ onBack }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const canceledStatuses = ['refusé', 'annulé', 'rejeté'];

  useEffect(() => {
    if (user?._id) {
      setLoading(true);
      rendezVousAPI.getLawyerRendezVous(user._id)
        .then(res => {
          console.log('Lawyer appointments response:', res);
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

  const handleApprove = async (id) => {
    try {
      await rendezVousAPI.approveRendezVous(id);
      setAppointments(apps => apps.map(a => a._id === id ? { ...a, statut: 'confirmé' } : a));
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await rendezVousAPI.rejectRendezVous(id);
      setAppointments(apps => apps.map(a => a._id === id ? { ...a, statut: 'annulé' } : a));
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmé':
        return '#22c55e';
      case 'en_attente':
        return '#f59e0b';
      case 'annulé':
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
      case 'annulé':
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
              Client Appointments
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '1.1rem', 
              margin: 0 
            }}>
              Manage and approve client consultation requests
            </p>
          </div>
          <button 
            onClick={() => onBack && onBack()}
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
      </div>

      {/* Content */}
      <div style={{ padding: '40px' }}>
        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px',
          maxWidth: '1200px',
          margin: '0 auto 30px auto'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}><IoCalendarSharp /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea', marginBottom: '4px' }}>
              {appointments.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Appointments</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}><AiOutlineClockCircle /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
              {appointments.filter(a => a.statut === 'en_attente').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Pending</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}><AiOutlineCheck /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e', marginBottom: '4px' }}>
              {appointments.filter(a => a.statut === 'confirmé').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Confirmed</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}><IoBarChart /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '4px' }}>
              {Math.round((appointments.filter(a => a.statut === 'confirmé').length / (appointments.length || 1)) * 100)}%
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Approval Rate</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
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
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize'
              }}
            >
              {status === 'all' ? 'All Requests' : (status === 'canceled' ? 'Canceled' : status.replace('_', ' '))}
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
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}><IoDocumentText /></div>
            <h3 style={{ color: '#6b7280', fontSize: '1.5rem', margin: '0 0 12px 0' }}>
              No appointment requests
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '1rem', margin: '0 0 30px 0' }}>
              {filter === 'all' 
                ? "You don't have any appointment requests yet."
                : `No ${filter.replace('_', ' ')} appointments found.`}
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
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

                {/* Client Details */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    color: '#1f2937',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    margin: '0 0 16px 0'
                  }}>
                    Consultation Request from {appointment.clientId?.fullName || 'Client'}
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
                          {appointment.clientId?.fullName || 'Client Name'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                          {appointment.clientId?.email || 'Client Email'}
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
                  {appointment.statut === 'en_attente' ? (
                    <>
                      <button 
                        onClick={() => handleApprove(appointment._id)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          flex: 1,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={e => e.target.style.background = '#059669'}
                        onMouseOut={e => e.target.style.background = '#10b981'}
                      >
                        <AiOutlineCheck style={{ verticalAlign: 'middle', marginRight: 8 }} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(appointment._id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          flex: 1,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={e => e.target.style.background = '#dc2626'}
                        onMouseOut={e => e.target.style.background = '#ef4444'}
                      >
                        <AiOutlineClose style={{ verticalAlign: 'middle', marginRight: 8 }} /> Reject
                      </button>
                    </>
                  ) : appointment.statut === 'confirmé' ? (
                    <button style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flex: 1
                    }}>
                      <IoCall style={{ verticalAlign: 'middle', marginRight: 8 }} /> Start Meeting
                    </button>
                  ) : null}
                  
                  <button style={{
                    background: '#e5e7eb',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
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

export default LawyerAppointments;
