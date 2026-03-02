import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Footer.css';
import Logo from '../Logo';
import { Button } from '@mui/material';

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    <footer className="app-footer">
      {/* ── Main grid ── */}
      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          <Logo />
          <p className="footer-tagline">
            {t('footer.tagline', 'La référence des services juridiques en Tunisie. Avocats vérifiés, rendez-vous simplifiés.')}
          </p>
        </div>

        {/* Plateforme */}
        <div className="footer-col">
          <h4>{t('footer.platform', 'Plateforme')}</h4>
          <ul>
            <li>
              <button onClick={() => scrollToSection('comment-ca-marche')}>
                {t('footer.howItWorks', 'Comment ça marche')}
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('urgence')}>
                {t('footer.urgency', 'Urgence 24/7')}
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('diaspora')}>
                {t('footer.diaspora', 'Diaspora')}
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection('faq')}>
                {t('footer.faq', 'FAQ')}
              </button>
            </li>
          </ul>
        </div>

        {/* Avocats */}
        <div className="footer-col">
          <h4>{t('footer.lawyers', 'Avocats')}</h4>
          <ul>
            <li>
              <button onClick={() => scrollToSection('pour-les-avocats')}>
                {t('footer.pricing', 'Tarifs')}
              </button>
            </li>
            <li><a href="/signup">{t('footer.register', "S'inscrire")}</a></li>
            <li>
              <button onClick={() => scrollToSection('hero')}>
                {t('footer.proNetwork', 'Réseau Pro')}
              </button>
            </li>
          </ul>
        </div>

        {/* Légal */}
        <div className="footer-col">
          <h4>{t('footer.legal', 'Légal')}</h4>
          <ul>
            <li><a href="/privacy">{t('footer.privacyPolicy', 'Politique de confidentialité')}</a></li>
            <li><a href="/terms">{t('footer.terms', "Conditions d'utilisation")}</a></li>
            <li><a href="/contact">{t('footer.contact', 'Contact')}</a></li>
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Juridika.tn —{' '}
          {t('footer.developedBy', 'Développé par')}{' '}
          <a href="https://purasolutions.tn" target="_blank" rel="noopener noreferrer">
            Pura Solutions
          </a>
          , Sousse, Tunisie.{' '}
          {t('footer.allRightsReserved', 'Tous droits réservés.')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;