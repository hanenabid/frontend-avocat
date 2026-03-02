import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Clients.css';

function Clients() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const cards = [
    {
      icon: '👤',
      title: t('homepage.clients.cards.particuliers.title'),
      desc: t('homepage.clients.cards.particuliers.desc'),
      cta: t('homepage.clients.cards.particuliers.cta'),
    },
    {
      icon: '🏢',
      title: t('homepage.clients.cards.pme.title'),
      desc: t('homepage.clients.cards.pme.desc'),
      cta: t('homepage.clients.cards.pme.cta'),
    },
    {
      icon: '✈️',
      title: t('homepage.clients.cards.diaspora.title'),
      desc: t('homepage.clients.cards.diaspora.desc'),
      cta: t('homepage.clients.cards.diaspora.cta'),
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cardEls = section.querySelectorAll('.client-card');

    cardEls.forEach((card, index) => {
      card.style.setProperty('--card-delay', index * 130 + 'ms');
    });

    const targets = section.querySelectorAll(
      '.clients-pre-title, .clients-title, .clients-subtitle, .client-card'
    );

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });

    return function () {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="pour-les-clients"
      className="clients-section"
      ref={sectionRef}
    >
      <div className="container">
        <div className="clients-header">
          <span className="clients-pre-title">
            {t('homepage.clients.preTitle')}
          </span>
          <h2 className="clients-title">
            {t('homepage.clients.title')}
          </h2>
          <p className="clients-subtitle">
            {t('homepage.clients.subtitle')}
          </p>
        </div>

        <div className="clients-grid">
          {cards.map(function (card, index) {
            return (
              <div
                key={index}
                className="client-card"
                onClick={function () {
                  navigate('/signup');
                }}
              >
                <div className="client-card-inner">
                  <div className="client-icon">{card.icon}</div>
                  <h3 className="client-card-title">{card.title}</h3>
                  <p className="client-card-desc">{card.desc}</p>
                  <span className="client-card-cta">{card.cta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Clients;