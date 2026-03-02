import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const plans = [
    {
      plan: 'essentiel',
      features: [
        t('homepage.pricing.plans.essentiel.feature1'),
        t('homepage.pricing.plans.essentiel.feature2'),
        t('homepage.pricing.plans.essentiel.feature3'),
        t('homepage.pricing.plans.essentiel.feature4'),
      ],
    },
    {
      plan: 'professionnel',
      features: [
        t('homepage.pricing.plans.professionnel.feature1'),
        t('homepage.pricing.plans.professionnel.feature2'),
        t('homepage.pricing.plans.professionnel.feature3'),
        t('homepage.pricing.plans.professionnel.feature4'),
        t('homepage.pricing.plans.professionnel.feature5'),
        t('homepage.pricing.plans.professionnel.feature6'),
      ],
    },
    {
      plan: 'cabinet',
      features: [
        t('homepage.pricing.plans.cabinet.feature1'),
        t('homepage.pricing.plans.cabinet.feature2'),
        t('homepage.pricing.plans.cabinet.feature3'),
        t('homepage.pricing.plans.cabinet.feature4'),
        t('homepage.pricing.plans.cabinet.feature5'),
      ],
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Stagger cards
    const cards = section.querySelectorAll('.pricing-card');
    cards.forEach((card, i) => {
      card.style.setProperty('--card-delay', `${i * 130}ms`);

      // Stagger feature items relative to card appearance
      const features = card.querySelectorAll('.pricing-features li');
      features.forEach((li, j) => {
        li.style.setProperty('--feature-delay', `${i * 130 + 250 + j * 60}ms`);
      });
    });

    const targets = section.querySelectorAll(
      '.pricing-pre-title, .pricing-title, .pricing-subtitle, .pricing-card'
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
      { threshold: 0.1 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pour-les-avocats" className="pricing-section" ref={sectionRef}>
      <div className="container">
        <div className="pricing-header">
          <span className="pricing-pre-title">{t('homepage.pricing.preTitle')}</span>
          <h2 className="pricing-title">{t('homepage.pricing.title')}</h2>
          <p className="pricing-subtitle">{t('homepage.pricing.subtitle')}</p>
        </div>

        <div className="pricing-grid">
          {plans.map((item) => (
            <div
              key={item.plan}
              className={`pricing-card ${item.plan === 'professionnel' ? 'pricing-card--highlighted' : ''}`}
            >
              {item.plan === 'professionnel' && (
                <div className="pricing-badge">{t('homepage.pricing.recommended')}</div>
              )}
              <span className="pricing-plan-name">
                {t(`homepage.pricing.plans.${item.plan}.name`)}
              </span>
              <div className="pricing-price">
                <span className="pricing-amount">
                  {t(`homepage.pricing.plans.${item.plan}.price`)}
                </span>
                <span className="pricing-currency">DT</span>
              </div>
              <span className="pricing-period">
                {t(`homepage.pricing.plans.${item.plan}.period`)}
              </span>
              <ul className="pricing-features">
                {item.features.map((f, j) => (
                  <li key={j}>
                    <span className="pricing-check">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`pricing-cta ${item.plan === 'professionnel' ? 'pricing-cta--highlighted' : ''}`}
                onClick={() => navigate('/signup')}
              >
                {t(`homepage.pricing.plans.${item.plan}.cta`)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;