import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import { IoLocationSharp } from 'react-icons/io5';
import { GiGraduateCap } from 'react-icons/gi';
import { FaCalendarAlt, FaUser, FaSearch, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import AnimatedErrorBanner from '../components/AnimatedErrorBanner';
import { mapToKey } from '../utils/i18nMapping';

const LawyerListing = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAvocat, setSelectedAvocat] = useState(null);
  const [avocats, setAvocats] = useState([]);
  const [filteredAvocats, setFilteredAvocats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');

const specialties = useMemo(() => [
  { key: 'allSpecialties',      value: '',                  label: t('lawyerListing.specialties.allSpecialties') },
  // Valeurs exactes de la DB
  { key: 'familyLaw',           value: 'familyLaw',         label: t('lawyerListing.specialties.familyLaw') },
  { key: 'criminalLaw',         value: 'criminalLaw',       label: t('lawyerListing.specialties.criminalLaw') },
  { key: 'corporateLaw',        value: 'corporateLaw',      label: t('lawyerListing.specialties.corporateLaw') },
  { key: 'laborLaw',            value: 'laborLaw',          label: t('lawyerListing.specialties.laborLaw') },
  { key: 'taxLaw',              value: 'taxLaw',            label: t('lawyerListing.specialties.taxLaw') },
  { key: 'realEstateLaw',       value: 'realEstateLaw',     label: t('lawyerListing.specialties.realEstateLaw') },
  { key: 'intellectualProperty',value: 'intellectualProperty', label: t('lawyerListing.specialties.intellectualProperty') },
  // Français (si certains avocats ont ces valeurs en DB)
  { key: 'droitCivil',          value: 'droitCivil',        label: t('lawyerListing.specialties.droitCivil') },
  { key: 'droitPenal',          value: 'droitPenal',        label: t('lawyerListing.specialties.droitPenal') },
  { key: 'droitCommercial',     value: 'droitCommercial',   label: t('lawyerListing.specialties.droitCommercial') },
  { key: 'droitTravail',        value: 'droitTravail',      label: t('lawyerListing.specialties.droitTravail') },
  { key: 'droitFiscal',         value: 'droitFiscal',       label: t('lawyerListing.specialties.droitFiscal') },
  { key: 'droitImmobilier',     value: 'droitImmobilier',   label: t('lawyerListing.specialties.droitImmobilier') },
], [t]);

  const cities = useMemo(() => [
    { key: 'allCities', value: '', label: t('lawyerListing.cities.allCities') },
    { key: 'ariana', value: 'ariana', label: t('lawyerListing.cities.ariana') },
    { key: 'beja', value: 'beja', label: t('lawyerListing.cities.beja') },
    { key: 'benArous', value: 'benArous', label: t('lawyerListing.cities.benArous') },
    { key: 'bizerte', value: 'bizerte', label: t('lawyerListing.cities.bizerte') },
    { key: 'gabes', value: 'gabes', label: t('lawyerListing.cities.gabes') },
    { key: 'gafsa', value: 'gafsa', label: t('lawyerListing.cities.gafsa') },
    { key: 'jendouba', value: 'jendouba', label: t('lawyerListing.cities.jendouba') },
    { key: 'kairouan', value: 'kairouan', label: t('lawyerListing.cities.kairouan') },
    { key: 'kasserine', value: 'kasserine', label: t('lawyerListing.cities.kasserine') },
    { key: 'kebili', value: 'kebili', label: t('lawyerListing.cities.kebili') },
    { key: 'kef', value: 'kef', label: t('lawyerListing.cities.kef') },
    { key: 'mahdia', value: 'mahdia', label: t('lawyerListing.cities.mahdia') },
    { key: 'manouba', value: 'manouba', label: t('lawyerListing.cities.manouba') },
    { key: 'medenine', value: 'medenine', label: t('lawyerListing.cities.medenine') },
    { key: 'monastir', value: 'monastir', label: t('lawyerListing.cities.monastir') },
    { key: 'nabeul', value: 'nabeul', label: t('lawyerListing.cities.nabeul') },
    { key: 'sfax', value: 'sfax', label: t('lawyerListing.cities.sfax') },
    { key: 'sidiBouzid', value: 'sidiBouzid', label: t('lawyerListing.cities.sidiBouzid') },
    { key: 'siliana', value: 'siliana', label: t('lawyerListing.cities.siliana') },
    { key: 'sousse', value: 'sousse', label: t('lawyerListing.cities.sousse') },
    { key: 'tataouine', value: 'tataouine', label: t('lawyerListing.cities.tataouine') },
    { key: 'tozeur', value: 'tozeur', label: t('lawyerListing.cities.tozeur') },
    { key: 'tunis', value: 'tunis', label: t('lawyerListing.cities.tunis') },
    { key: 'zaghouan', value: 'zaghouan', label: t('lawyerListing.cities.zaghouan') },
  ], [t]);

  useEffect(() => {
    const fetchAvocats = async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch('http://localhost:4000/api/auth/avocats', {
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const verified = data.filter(a => a.verified === true);
        setAvocats(verified); setFilteredAvocats(verified);
      } catch (err) {
        setError(`${t('lawyerListing.unableToLoadLawyers')}: ${err.message}`);
        setAvocats([]); setFilteredAvocats([]);
      } finally { setLoading(false); }
    };
    fetchAvocats();
  }, [t]);

 useEffect(() => {
  let f = avocats;
  
  // DEBUG TEMPORAIRE
  if (avocats.length > 0) {
    avocats.forEach(a => {
      console.log(`DB specialites: "${a.specialites}" → mapToKey: "${mapToKey(a.specialites, 'specialty')}"`);
    });
    console.log('selectedSpecialty:', selectedSpecialty);
  }

  if (selectedCity) f = f.filter(a => mapToKey(a.ville, 'city') === selectedCity);
  if (selectedSpecialty) f = f.filter(a => mapToKey(a.specialites, 'specialty') === selectedSpecialty);
  setFilteredAvocats(f);
}, [searchQuery, selectedCity, selectedSpecialty, avocats]);

  const clearFilters = () => { setSearchQuery(''); setSelectedCity(''); setSelectedSpecialty(''); navigate('/lawyers'); };
  const hasFilters = searchQuery || selectedCity || selectedSpecialty;

  return (
    <div className="ll-root">
      <Navbar />

      {/* ── HEADER ── */}
      <div className="ll-header">
        <div className="ll-container">
          <div className="ll-header-top">
            <div>
              <h1 className="ll-title">{t('lawyerListing.pageTitle')}</h1>
              <p className="ll-subtitle">{filteredAvocats.length} {t('lawyerListing.lawyersFound')}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="ll-filters">
            <div className="ll-input-wrap">
              <FaSearch />
              <input
                type="text"
                placeholder={t('homepage.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button onClick={() => setSearchQuery('')}><FaTimes /></button>}
            </div>

            <div className="ll-select-wrap">
              <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)}>
                {specialties.map(s => <option key={s.key} value={s.value}>{s.label}</option>)}
              </select>
              <FaChevronDown />
            </div>

            <div className="ll-select-wrap">
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                {cities.map(c => <option key={c.key} value={c.value}>{c.label}</option>)}
              </select>
              <FaChevronDown />
            </div>

            {hasFilters && (
              <button className="ll-clear" onClick={clearFilters}>
                <FaTimes /> {t('lawyerListing.clearAll', { defaultValue: 'Effacer' })}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── GRILLE ── */}
      <div className="ll-body">
        <div className="ll-container">

          {loading && (
            <div className="ll-state">
              <div className="ll-spinner" />
              <p>{t('lawyerListing.loadingLawyers', { defaultValue: 'Chargement…' })}</p>
            </div>
          )}

          {!loading && error && (
            <div className="ll-state">
              <AnimatedErrorBanner message={error} visible={true} />
              <button className="ll-btn-dark" onClick={() => window.location.reload()}>
                {t('lawyerListing.tryAgain', { defaultValue: 'Réessayer' })}
              </button>
            </div>
          )}

          {!loading && !error && filteredAvocats.length === 0 && (
            <div className="ll-state">
              <p style={{ fontSize: 40 }}>⚖️</p>
              <h3>{t('lawyerListing.noLawyersFound', { defaultValue: 'Aucun résultat' })}</h3>
              <p>{t('lawyerListing.tryAdjustingSearch', { defaultValue: 'Modifiez vos critères.' })}</p>
              {hasFilters && <button className="ll-btn-dark" onClick={clearFilters}>{t('lawyerListing.clearAll')}</button>}
            </div>
          )}

          {!loading && !error && filteredAvocats.length > 0 && (
            <div className="ll-grid">
              {filteredAvocats.map((avocat, i) => {
                const specialtyKey = mapToKey(avocat.specialites, 'specialty');
                const cityKey = mapToKey(avocat.ville, 'city');
                const initial = avocat.fullName?.charAt(0) || '?';
                return (
                  <div
                    key={avocat._id}
                    className="ll-card"
                    style={{ animationDelay: `${(i % 12) * 0.04}s` }}
                    onClick={() => navigate(`/lawyer/${avocat._id}`)}
                  >
                    {/* Avatar */}
                    

                    {/* Infos */}
                    <div className="ll-card-info">
                      <h3 className="ll-card-name">{avocat.fullName}</h3>
                      <p className="ll-card-spec">
                        {t(`lawyerListing.specialties.${specialtyKey}`, { defaultValue: avocat.specialites })}
                      </p>
                      <div className="ll-card-meta">
                        <span><IoLocationSharp />{t(`lawyerListing.cities.${cityKey}`, { defaultValue: avocat.ville })}</span>
                        {avocat.anneExperience && (
                          <span><GiGraduateCap />{avocat.anneExperience} {t('lawyerListing.yearsExp', { defaultValue: 'ans' })}</span>
                        )}
                      </div>
                      {avocat.langues?.length > 0 && (
                        <div className="ll-card-langs">
                          {avocat.langues.map((l, idx) => <span key={idx}>{l}</span>)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ll-card-actions">
                      <button
                        className="ll-btn-dark"
                        onClick={e => { e.stopPropagation(); setSelectedAvocat(avocat); setBookingOpen(true); }}
                      >
                        <FaCalendarAlt />
                        {t('lawyerListing.bookAppointment', { defaultValue: 'Réserver' })}
                      </button>
                      <button
                        className="ll-btn-outline"
                        onClick={e => { e.stopPropagation(); navigate(`/lawyer/${avocat._id}`); }}
                      >
                        <FaUser />
                        {t('lawyerListing.viewProfile', { defaultValue: 'Profil' })}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <BookingModal avocat={selectedAvocat} open={bookingOpen} onClose={() => setBookingOpen(false)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

        :root {
          --font: 'Inter', sans-serif;
          --black: #111111;
          --gray-800: #333333;
          --gray-600: #555555;
          --gray-400: #999999;
          --gray-200: #e5e5e5;
          --gray-100: #f5f5f5;
          --white: #ffffff;
          --ease: all 0.2s ease;
        }

        .ll-root {
          min-height: 100vh;
          background: var(--gray-100);
          font-family: var(--font);
          color: var(--black);
        }

        .ll-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

        /* ── HEADER ── */
        .ll-header {
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
          padding: 28px 0 20px;
        }

        .ll-header-top { margin-bottom: 16px; }

        .ll-title {
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          color: var(--black);
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 4px;
        }
        .ll-subtitle { font-size: 13px; color: var(--gray-400); font-weight: 500; }

        /* Filtres */
        .ll-filters {
          display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
        }

        .ll-input-wrap {
          display: flex; align-items: center; gap: 8px;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 9px 12px;
          flex: 1; min-width: 180px;
          transition: var(--ease);
        }
        .ll-input-wrap:focus-within {
          border-color: var(--black);
          background: var(--white);
        }
        .ll-input-wrap svg { color: var(--gray-400); font-size: 13px; flex-shrink: 0; }
        .ll-input-wrap input {
          border: none; outline: none; background: transparent;
          font-family: var(--font); font-size: 14px; color: var(--black);
          width: 100%; font-weight: 500;
        }
        .ll-input-wrap input::placeholder { color: var(--gray-400); }
        .ll-input-wrap button {
          background: none; border: none; cursor: pointer;
          color: var(--gray-400); font-size: 11px;
          padding: 0; display: flex; align-items: center;
        }
        .ll-input-wrap button:hover { color: var(--black); }

        .ll-select-wrap {
          position: relative; display: flex; align-items: center;
        }
        .ll-select-wrap select {
          appearance: none; outline: none;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 9px 36px 9px 12px;
          font-family: var(--font); font-size: 14px; font-weight: 500;
          color: var(--black); cursor: pointer;
          transition: var(--ease);
        }
        .ll-select-wrap select:focus { border-color: var(--black); background: var(--white); }
        .ll-select-wrap svg {
          position: absolute; right: 11px;
          font-size: 10px; color: var(--gray-400);
          pointer-events: none;
        }

        .ll-clear {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid var(--gray-200);
          border-radius: 8px; padding: 9px 12px;
          font-family: var(--font); font-size: 13px; font-weight: 600;
          color: var(--gray-600); cursor: pointer; transition: var(--ease);
        }
        .ll-clear:hover { border-color: var(--black); color: var(--black); }

        /* ── BODY ── */
        .ll-body { padding: 24px 0 64px; }

        /* States */
        .ll-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 360px; gap: 12px; text-align: center;
        }
        .ll-spinner {
          width: 36px; height: 36px;
          border: 2px solid var(--gray-200);
          border-top-color: var(--black);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .ll-state p { color: var(--gray-400); font-size: 14px; }
        .ll-state h3 { font-size: 1.3rem; font-weight: 700; }

        /* ── GRID ── */
        .ll-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }

        /* ── CARD ── */
        .ll-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          display: flex; flex-direction: column;
          cursor: pointer; overflow: hidden;
          animation: fadeUp 0.35s ease both;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .ll-card:hover {
          border-color: var(--black);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        /* Avatar */
        .ll-card-avatar {
          width: 100%; height: 120px;
          background: var(--black);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .ll-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ll-card-avatar span {
          font-size: 44px; font-weight: 800;
          color: var(--white); letter-spacing: -0.02em;
          opacity: 0.9;
        }

        /* Infos */
        .ll-card-info {
          padding: 14px 16px;
          flex: 1; display: flex; flex-direction: column; gap: 6px;
        }

        .ll-card-name {
          font-size: 1rem; font-weight: 700;
          color: var(--black); line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .ll-card-spec {
          font-size: 12px; font-weight: 500;
          color: var(--gray-600);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .ll-card-meta {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px;
        }
        .ll-card-meta span {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 500; color: var(--gray-400);
        }
        .ll-card-meta svg { font-size: 11px; }

        .ll-card-langs {
          display: flex; flex-wrap: wrap; gap: 4px;
        }
        .ll-card-langs span {
          font-size: 11px; font-weight: 500; color: var(--gray-600);
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          padding: 1px 8px; border-radius: 4px;
        }

        /* Actions */
        .ll-card-actions {
          display: flex; gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--gray-200);
        }

        .ll-btn-dark {
        
          display: flex; align-items: center; justify-content: center; gap: 5px;
          border: none; border-radius: 7px;
          padding: 9px 6px;
          font-family: var(--font); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: var(--ease); white-space: nowrap;
        }
        .ll-btn-dark:hover { background: var(--gray-800); }

        .ll-btn-outline {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          background: var(--white); color: var(--black);
          border: 1px solid var(--gray-200); border-radius: 7px;
          padding: 9px 6px;
          font-family: var(--font); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: var(--ease); white-space: nowrap;
        }
        .ll-btn-outline:hover { border-color: var(--black); background: var(--gray-100); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .ll-container { padding: 0 16px; }
          .ll-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        }
        @media (max-width: 600px) {
          .ll-filters { flex-direction: column; }
          .ll-input-wrap, .ll-select-wrap, .ll-clear { width: 100%; }
          .ll-select-wrap select { width: 100%; }
          .ll-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .ll-card-avatar { height: 90px; }
          .ll-card-avatar span { font-size: 32px; }
          .ll-card-info { padding: 10px 12px; }
          .ll-card-actions { padding: 10px 12px; flex-direction: column; }
          .ll-btn-dark, .ll-btn-outline { width: 100%; }
        }
        @media (max-width: 380px) {
          .ll-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LawyerListing;