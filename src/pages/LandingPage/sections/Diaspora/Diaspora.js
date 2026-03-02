import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './Diaspora.css';

function Diaspora() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const countries = [
    { code: 'FR', label: t('homepage.diaspora.countries.france') },
    { code: 'IT', label: t('homepage.diaspora.countries.italie') },
    { code: 'DE', label: t('homepage.diaspora.countries.allemagne') },
    { code: 'SA', label: t('homepage.diaspora.countries.saoudite') },
    { code: 'AE', label: t('homepage.diaspora.countries.emirats') },
    { code: '🌍', label: t('homepage.diaspora.countries.partout'), isGlobe: true },
  ];

  const features = [
    {
      icon: '🌐',
      title: t('homepage.diaspora.features.langues.title'),
      desc: t('homepage.diaspora.features.langues.desc'),
    },
    {
      icon: '🕐',
      title: t('homepage.diaspora.features.fuseaux.title'),
      desc: t('homepage.diaspora.features.fuseaux.desc'),
    },
    {
      icon: '📋',
      title: t('homepage.diaspora.features.checklists.title'),
      desc: t('homepage.diaspora.features.checklists.desc'),
    },
    {
      icon: '📹',
      title: t('homepage.diaspora.features.video.title'),
      desc: t('homepage.diaspora.features.video.desc'),
    },
  ];

  useEffect(function () {
    const section = sectionRef.current;
    if (!section) return;

    const headerEls = section.querySelectorAll(
      '.diaspora-pre-title, .diaspora-title, .diaspora-subtitle'
    );
    headerEls.forEach(function (el, i) {
      el.style.setProperty('--delay', i * 100 + 'ms');
    });

    const tags = section.querySelectorAll('.diaspora-country-tag');
    tags.forEach(function (el, i) {
      el.style.setProperty('--delay', 300 + i * 70 + 'ms');
    });

    const featureEls = section.querySelectorAll('.diaspora-feature');
    featureEls.forEach(function (el, i) {
      el.style.setProperty('--delay', i * 110 + 'ms');
    });

    const targets = section.querySelectorAll(
      '.diaspora-pre-title, .diaspora-title, .diaspora-subtitle, .diaspora-country-tag, .diaspora-feature'
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
    <section id="diaspora" className="diaspora-section" ref={sectionRef}>
      <div className="container">
        <div className="diaspora-grid">

          {/* LEFT */}
          <div className="diaspora-left">
            <span className="diaspora-pre-title">{t('homepage.diaspora.preTitle')}</span>
            <h2 className="diaspora-title">{t('homepage.diaspora.title')}</h2>
            <p className="diaspora-subtitle">{t('homepage.diaspora.subtitle')}</p>
            <div className="diaspora-countries">
              {countries.map(function (c, i) {
                return (
                  <div key={i} className="diaspora-country-tag">
                    {c.isGlobe
                      ? <span className="diaspora-country-globe">🌍</span>
                      : <span className="diaspora-country-code">{c.code}</span>
                    }
                    <span>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="diaspora-right">
            {features.map(function (f, i) {
              return (
                <div key={i} className="diaspora-feature">
                  <div className="diaspora-feature-icon">{f.icon}</div>
                  <div>
                    <strong className="diaspora-feature-title">{f.title}</strong>
                    <p className="diaspora-feature-desc">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

export default Diaspora;