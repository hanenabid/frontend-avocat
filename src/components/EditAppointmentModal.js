import React, { useState } from 'react';
import { rendezVousAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import AnimatedErrorBanner from './AnimatedErrorBanner';

const EditAppointmentModal = ({ appointment, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState(() => {
    if (!appointment?.date) return '';
    const d = new Date(appointment.date);
    return d.toISOString().slice(0, 10);
  });
  const [heure, setHeure] = useState(appointment?.heure || '');
  const [type, setType] = useState(appointment?.type || 'présentiel');
  const [statut, setStatut] = useState(appointment?.statut || 'en_attente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {};
      if (date) payload.date = date;
      if (heure) payload.heure = heure;
      if (type) payload.type = type;
      if (statut) payload.statut = statut;

      const res = await rendezVousAPI.updateRendezVous(appointment._id, payload);
      onSaved && onSaved(res.data.rendezvous);
      onClose && onClose();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.response?.data?.message || err.message || t('editAppointmentModal.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: 520, background: 'white', borderRadius: 12, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>{t('editAppointmentModal.title')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              {t('editAppointmentModal.date')}
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              {t('editAppointmentModal.time')}
              <input type="time" value={heure} onChange={e => setHeure(e.target.value)} required style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {t('editAppointmentModal.type')}
              <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <option value="présentiel">présentiel</option>
                <option value="visio">visio</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {t('editAppointmentModal.status')}
              <select value={statut} onChange={e => setStatut(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <option value="en_attente">en_attente</option>
                <option value="confirmé">confirmé</option>
                <option value="annulé">annulé</option>
              </select>
            </label>
          </div>

          <AnimatedErrorBanner message={error ? t(error, { defaultValue: error }) : ''} visible={Boolean(error)} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>{t('editAppointmentModal.cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff' }}>{loading ? t('editAppointmentModal.saving') : t('editAppointmentModal.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;
