import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './Trust.css';

const Trust = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Staggered delay for each step
    const steps = section.querySelectorAll('.trust-step');
    steps.forEach((step, i) => {
      step.style.setProperty('--step-delay', `${0.3 + i * 0.13}s`);
    });

    const targets = section.querySelectorAll(
      '.trust-card, .trust-content, .trust-step'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="trust-section" ref={sectionRef}>
      <div className="container">
        <div className="trust-grid">

          {/* LEFT CARD */}
          <div className="trust-card">
            <div className="trust-badge">
              <div className="trust-badge-circle">
                <span>{t('homepage.trust.badge1')}</span>
                <span>{t('homepage.trust.badge2')}</span>
              </div>
            </div>
            <h3 className="trust-card-title">{t('homepage.trust.cardTitle')}</h3>
            <p className="trust-card-desc">{t('homepage.trust.cardDesc')}</p>
          </div>

          {/* RIGHT CONTENT */}
          <div className="trust-content">
            <span className="trust-pre-title">{t('homepage.trust.preTitle')}</span>
            <h2 className="trust-title">{t('homepage.trust.title')}</h2>
            <p className="trust-subtitle">{t('homepage.trust.subtitle')}</p>
            <div className="trust-steps">
              {[1, 2, 3].map((num) => (
                <div key={num} className="trust-step">
                  <div className="trust-step-num">{num}</div>
                  <div>
                    <strong className="trust-step-title">
                      {t(`homepage.trust.steps.step${num}.title`)}
                    </strong>
                    <p className="trust-step-desc">
                      {t(`homepage.trust.steps.step${num}.desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Trust;