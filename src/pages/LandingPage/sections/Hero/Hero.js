import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchName, setSearchName] = useState('');
  const [searchSpeciality, setSearchSpeciality] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const specialities = [
    { value: '',                    label: t('homepage.allSpecialties') },
    { value: 'familyLaw',           label: t('homepage.specialties.familyLaw') },
    { value: 'criminalLaw',         label: t('homepage.specialties.criminalLaw') },
    { value: 'businessCorporateLaw',label: t('homepage.specialties.businessCorporateLaw') },
    { value: 'employmentLaw',       label: t('homepage.specialties.employmentLaw') },
    { value: 'immigrationLaw',      label: t('homepage.specialties.immigrationLaw') },
    { value: 'propertyRealEstate',  label: t('homepage.specialties.propertyRealEstate') },
    { value: 'contractLaw',         label: t('homepage.specialties.contractLaw') },
    { value: 'personalInjury',      label: t('homepage.specialties.personalInjury') },
    { value: 'administrativeLaw',   label: t('homepage.specialties.administrativeLaw') },
    { value: 'intellectualProperty',label: t('homepage.specialties.intellectualProperty') },
    { value: 'taxLaw',              label: t('homepage.specialties.taxLaw') },
    { value: 'civilLaw',            label: t('homepage.specialties.civilLaw') },
  ];

  const cities = [
    { value: '',           label: t('homepage.allCities') },
    { value: 'tunis',      label: t('homepage.cities.tunis') },
    { value: 'ariana',     label: t('homepage.cities.ariana') },
    { value: 'benArous',   label: t('homepage.cities.benArous') },
    { value: 'manouba',    label: t('homepage.cities.manouba') },
    { value: 'nabeul',     label: t('homepage.cities.nabeul') },
    { value: 'zaghouan',   label: t('homepage.cities.zaghouan') },
    { value: 'bizerte',    label: t('homepage.cities.bizerte') },
    { value: 'beja',       label: t('homepage.cities.beja') },
    { value: 'jendouba',   label: t('homepage.cities.jendouba') },
    { value: 'kef',        label: t('homepage.cities.kef') },
    { value: 'siliana',    label: t('homepage.cities.siliana') },
    { value: 'sousse',     label: t('homepage.cities.sousse') },
    { value: 'monastir',   label: t('homepage.cities.monastir') },
    { value: 'mahdia',     label: t('homepage.cities.mahdia') },
    { value: 'sfax',       label: t('homepage.cities.sfax') },
    { value: 'kairouan',   label: t('homepage.cities.kairouan') },
    { value: 'kasserine',  label: t('homepage.cities.kasserine') },
    { value: 'sidiBouzid', label: t('homepage.cities.sidiBouzid') },
    { value: 'gabes',      label: t('homepage.cities.gabes') },
    { value: 'medenine',   label: t('homepage.cities.medenine') },
    { value: 'tataouine',  label: t('homepage.cities.tataouine') },
    { value: 'gafsa',      label: t('homepage.cities.gafsa') },
    { value: 'tozeur',     label: t('homepage.cities.tozeur') },
    { value: 'kebili',     label: t('homepage.cities.kebili') },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchName)       params.set('name', searchName);
    if (searchSpeciality) params.set('speciality', searchSpeciality);
    if (searchCity)       params.set('city', searchCity);
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Highlight the keyword wrapped in [[ ]] in each translation file
  // e.g. fr.json: "Trouvez un avocat [[vérifié]] en Tunisie"
  //      ar.json: "ابحث عن محامٍ [[معتمد]] في تونس"
  //      en.json: "Find and book a [[verified]] lawyer in Tunisia"
  const rawTitle = t('homepage.title');
  const titleParts = rawTitle.split(/\[\[|\]\]/);
  const hasHighlight = titleParts.length === 3;

  return (
    <section id="hero" className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              {hasHighlight ? (
                <>
                  {titleParts[0]}
                  <span className="highlight-verifie">{titleParts[1]}</span>
                  {titleParts[2]}
                </>
              ) : (
                rawTitle
              )}
            </h1>

            <p className="hero-subtitle">{t('homepage.subtitle')}</p>

            <div className="hero-search-bar">
              <div className="search-field">
                <label className="search-label">{t('homepage.who')}</label>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t('homepage.searchPlaceholder')}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="search-divider" />

              <div className="search-field">
                <label className="search-label">{t('homepage.specialty')}</label>
                <div className="select-wrapper">
                  <select
                    className="search-select"
                    value={searchSpeciality}
                    onChange={(e) => setSearchSpeciality(e.target.value)}
                  >
                    {specialities.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="select-arrow">&#8964;</span>
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field">
                <label className="search-label">{t('homepage.where')}</label>
                <div className="select-wrapper">
                  <select
                    className="search-select"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                  >
                    {cities.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <span className="select-arrow">&#8964;</span>
                </div>
              </div>

              <button className="search-btn" onClick={handleSearch}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {t('homepage.searchButton')}
              </button>
            </div>
          </div>

          <div className="hero-image">
            <div className="image-wrapper">
              <img src="/law.jpg" alt="Legal professionals" className="main-image" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;