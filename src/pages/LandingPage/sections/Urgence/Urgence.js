import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Urgence.css';

const Urgence = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const card = section.querySelector('.urgence-card');
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="urgence" className="urgence-wrapper" ref={sectionRef}>
      <div className="container">
        <div className="urgence-card">
          <div className="urgence-left">
            <span className="urgence-pre-title">
              <span className="urgence-dot" />
              {t('homepage.urgence.preTitle')}
            </span>
            <h2 className="urgence-title">{t('homepage.urgence.title')}</h2>
            <p className="urgence-desc">{t('homepage.urgence.desc')}</p>
          </div>
          <div className="urgence-right">
            <button className="urgence-btn" onClick={() => navigate('/lawyers')}>
              {t('homepage.urgence.cta')}
            </button>
            <p className="urgence-note">{t('homepage.urgence.note')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Urgence;