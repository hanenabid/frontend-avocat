import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './FAQ.css';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = t('homepage.faq.items', { returnObjects: true, defaultValue: [] });
  const faqList = Array.isArray(faqs) ? faqs : [];

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  const left  = faqList.filter((_, i) => i % 2 === 0);
  const right = faqList.filter((_, i) => i % 2 !== 0);

  return (
    <section id="faq" className="faq-section">
      <div className="container">

        <div className="faq-header">
          <span className="faq-pre-title">{t('homepage.faq.preTitle')}</span>
          <h2 className="faq-title">{t('homepage.faq.title')}</h2>
        </div>

        <div className="faq-grid">
          <div className="faq-col">
            {left.map((item, i) => {
              const idx = i * 2;
              return (
                <div key={idx} className={`faq-item ${openIndex === idx ? 'faq-item--open' : ''}`}>
                  <button className="faq-question" onClick={() => toggle(idx)}>
                    <span>{item.q}</span>
                    <span className="faq-icon">{openIndex === idx ? '∧' : '∨'}</span>
                  </button>
                  {openIndex === idx && <p className="faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>

          <div className="faq-col">
            {right.map((item, i) => {
              const idx = i * 2 + 1;
              return (
                <div key={idx} className={`faq-item ${openIndex === idx ? 'faq-item--open' : ''}`}>
                  <button className="faq-question" onClick={() => toggle(idx)}>
                    <span>{item.q}</span>
                    <span className="faq-icon">{openIndex === idx ? '∧' : '∨'}</span>
                  </button>
                  {openIndex === idx && <p className="faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQ;