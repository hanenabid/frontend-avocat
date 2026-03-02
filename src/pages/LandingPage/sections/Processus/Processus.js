import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './Processus.css';

const Processus = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Assign staggered delay to each step via CSS custom property
    const steps = section.querySelectorAll('.processus-step');
    steps.forEach((step, i) => {
      step.style.setProperty('--step-delay', `${i * 120}ms`);
    });

    const targets = section.querySelectorAll(
      '.processus-pre-title, .processus-title, .processus-subtitle, .processus-step, .processus-line'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="comment-ca-marche" className="processus-section" ref={sectionRef}>
      <div className="container">
        <div className="processus-header">
          <span className="processus-pre-title">{t('homepage.processus.preTitle')}</span>
          <h2 className="processus-title">{t('homepage.processus.title')}</h2>
          <p className="processus-subtitle">{t('homepage.processus.subtitle')}</p>
        </div>

        <div className="processus-steps">
          {[1, 2, 3, 4, 5].map((num) => (
            <React.Fragment key={num}>
              <div className="processus-step">
                <div className="processus-circle">{num}</div>
                <h3 className="processus-step-title">
                  {t(`homepage.processus.steps.step${num}.title`)}
                </h3>
                <p className="processus-step-desc">
                  {t(`homepage.processus.steps.step${num}.desc`)}
                </p>
              </div>
              {num < 5 && <div className="processus-line" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Processus;