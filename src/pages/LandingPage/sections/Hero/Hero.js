import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
const scrollToSection = (sectionId) => {
    if (window.location.pathname === '/') {
      // Déjà sur la homepage → scroll direct
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Autre page → naviguer vers / puis scroller
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };
  return (
    <section id="hero" className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">{t('homepage.title')}</h1>
            <p className="hero-subtitle">{t('homepage.subtitle')}</p>

            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/signup')}
              >
                {t('homepage.createProfile')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => scrollToSection('pour-les-avocats')}
              >
                {t('homepage.iAmLawyer')}
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