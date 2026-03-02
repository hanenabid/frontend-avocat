import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const infos = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      label: t('contact.info.address.label'),
      value: t('contact.info.address.value'),
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      label: t('contact.info.hours.label'),
      value: t('contact.info.hours.value'),
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
        </svg>
      ),
      label: t('contact.info.phone.label'),
      value: t('contact.info.phone.value'),
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      label: t('contact.info.email.label'),
      value: t('contact.info.email.value'),
    },
  ];

  const socials = [
    {
      name: 'Facebook', href: '#',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
    },
    {
      name: 'LinkedIn', href: '#',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
    },
    {
      name: 'Instagram', href: '#',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    },
    {
      name: 'Twitter', href: '#',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
    },
  ];

  return (
    <div className="ct-root">
      <Navbar />

      {/* HERO */}
      <div className="ct-hero">
        <div className="ct-hero-content">
          <h1 className="ct-hero-title" dangerouslySetInnerHTML={{ __html: t('contact.hero.title') }} />
          <p className="ct-hero-sub">{t('contact.hero.subtitle')}</p>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="ct-info-row">
        {infos.map((info, i) => (
          <div className="ct-info-card" key={i}>
            <div className="ct-info-icon">{info.icon}</div>
            <div className="ct-info-label">{info.label}</div>
            <div className="ct-info-value">{info.value}</div>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="ct-main">
        {/* LEFT — Socials */}
        <div className="ct-left">
          <div className="ct-left-inner">
            <p className="ct-socials-title">{t('contact.socials.title')}</p>
            <div className="ct-socials">
              {socials.map((s) => (
                <a key={s.name} href={s.href} className="ct-social-btn" title={s.name} target="_blank" rel="noreferrer">
                  {s.icon}
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="ct-right">
          <div className="ct-form-card">
            <div className="ct-form-header">
              <h2>{t('contact.form.title')}</h2>
              <p>{t('contact.form.subtitle')}</p>
            </div>

            {submitted ? (
              <div className="ct-success">
                <div className="ct-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="36" height="36">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3>{t('contact.form.success.title')}</h3>
                <p>{t('contact.form.success.message')}</p>
                <button className="ct-btn-reset" onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', subject: '', message: '' }); }}>
                  {t('contact.form.success.reset')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ct-form">
                <div className="ct-form-row">
                  <div className="ct-field">
                    <label>{t('contact.form.name.label')} <span>*</span></label>
                    <input
                      type="text" name="name" value={form.name}
                      onChange={handleChange}
                      placeholder={t('contact.form.name.placeholder')}
                      required
                    />
                  </div>

                  <div className="ct-field">
                    <label>{t('contact.form.phone.label')}</label>
                    <div className="ct-phone-wrap">
                      <span className="ct-phone-prefix">🇹🇳 +216</span>
                      <input
                        type="tel" name="phone" value={form.phone}
                        onChange={handleChange}
                        placeholder={t('contact.form.phone.placeholder')}
                      />
                    </div>
                  </div>
                </div>

                <div className="ct-field">
                  <label>{t('contact.form.email.label')} <span>*</span></label>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange}
                    placeholder={t('contact.form.email.placeholder')}
                    required
                  />
                </div>

                <div className="ct-field">
                  <label>{t('contact.form.subject.label')}</label>
                  <select name="subject" value={form.subject} onChange={handleChange}>
                    <option value="">{t('contact.form.subject.placeholder')}</option>
                    <option value="general">{t('contact.form.subject.options.general')}</option>
                    <option value="technical">{t('contact.form.subject.options.technical')}</option>
                    <option value="lawyer">{t('contact.form.subject.options.lawyer')}</option>
                    <option value="partnership">{t('contact.form.subject.options.partnership')}</option>
                    <option value="other">{t('contact.form.subject.options.other')}</option>
                  </select>
                </div>

                <div className="ct-field">
                  <label>{t('contact.form.message.label')} <span>*</span></label>
                  <textarea
                    name="message" value={form.message}
                    onChange={handleChange}
                    placeholder={t('contact.form.message.placeholder')}
                    rows={5} required
                  />
                </div>

                <button type="submit" className="ct-submit" disabled={loading}>
                  {loading ? (
                    <><span className="ct-spinner" />{t('contact.form.submit.loading')}</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      {t('contact.form.submit.label')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
          --navy: #1B263B;
          --gold: #CFAE70;
          --white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-400: #94a3b8;
          --gray-600: #475569;
          --gray-800: #1e293b;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ct-root {
          min-height: 100vh;
          background: var(--gray-50);
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--gray-800);
        }

        /* HERO */
        .ct-hero {
          background: var(--navy);
          padding: 72px 24px 90px;
          text-align: center;
        }

        .ct-hero-content { max-width: 560px; margin: 0 auto; padding-top: 50px}

        .ct-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 300;
          color: var(--white);
          line-height: 1.1;
          margin-bottom: 16px;
        }

        .ct-hero-sub {
          font-size: 0.95rem;
          color: #94a3b8;
          line-height: 1.7;
        }

        /* INFO CARDS */
        .ct-info-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          max-width: 1060px;
          margin: -36px auto 0;
          padding: 0 24px;
          position: relative;
          z-index: 10;
        }

        .ct-info-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          padding: 24px 16px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .ct-info-card:first-child { border-radius: 12px 0 0 12px; }
        .ct-info-card:last-child  { border-radius: 0 12px 12px 0; }
        .ct-info-card + .ct-info-card { border-left: none; }
        .ct-info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); z-index: 2; }

        .ct-info-icon {
          width: 46px; height: 46px; border-radius: 50%;
          background: #FEF9EE; border: 1.5px solid #CFAE7040;
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
        }

        .ct-info-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold);
        }

        .ct-info-value { font-size: 12px; color: var(--gray-600); font-weight: 500; line-height: 1.5; white-space: pre-line; }

        /* MAIN */
        .ct-main {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 28px;
          max-width: 1060px;
          margin: 44px auto 60px;
          padding: 0 24px;
        }

        /* LEFT */
        .ct-left { display: flex; flex-direction: column; }

        .ct-left-inner {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 28px 22px;
        }

        .ct-socials-title {
          font-size: 11px; font-weight: 700; color: var(--gray-400);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
        }

        .ct-socials { display: flex; flex-direction: column; gap: 8px; }

        .ct-social-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: var(--gray-50); border: 1px solid var(--gray-200);
          color: var(--gray-600); text-decoration: none;
          font-size: 13px; font-weight: 600;
          transition: all 0.2s;
        }

        .ct-social-btn:hover {
          background: var(--navy); color: var(--gold);
          border-color: var(--navy);
        }

        /* FORM CARD */
        .ct-form-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        .ct-form-header {
          margin-bottom: 24px; padding-bottom: 20px;
          border-bottom: 1px solid var(--gray-100);
        }

        .ct-form-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.7rem; font-weight: 600;
          color: var(--navy); margin-bottom: 6px;
        }

        .ct-form-header p { font-size: 13px; color: var(--gray-400); }

        .ct-form { display: flex; flex-direction: column; gap: 16px; }

        .ct-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .ct-field { display: flex; flex-direction: column; gap: 6px; }

        .ct-field label {
          font-size: 11px; font-weight: 700; color: var(--gray-600);
          text-transform: uppercase; letter-spacing: 0.06em;
        }

        .ct-field label span { color: var(--gold); }

        .ct-field input,
        .ct-field select,
        .ct-field textarea {
          background: var(--gray-50);
          border: 1.5px solid var(--gray-200);
          border-radius: 9px;
          padding: 11px 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 500; color: var(--navy);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
        }

        .ct-field input:focus,
        .ct-field select:focus,
        .ct-field textarea:focus {
          border-color: var(--gold);
          background: white;
          box-shadow: 0 0 0 3px #CFAE7015;
        }

        .ct-field input::placeholder,
        .ct-field textarea::placeholder { color: var(--gray-400); }

        .ct-field select { cursor: pointer; appearance: none; }

        .ct-field textarea { resize: vertical; line-height: 1.6; }

        .ct-phone-wrap {
          display: flex;
          background: var(--gray-50);
          border: 1.5px solid var(--gray-200);
          border-radius: 9px; overflow: hidden;
          transition: border-color 0.2s;
        }

        .ct-phone-wrap:focus-within {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px #CFAE7015;
        }

        .ct-phone-prefix {
          padding: 11px 12px;
          background: var(--gray-100);
          border-right: 1.5px solid var(--gray-200);
          font-size: 12px; font-weight: 600; color: var(--gray-600);
          white-space: nowrap; flex-shrink: 0;
        }

        .ct-phone-wrap input {
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .ct-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px;
          background: var(--navy); color: white;
          border: none; border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; margin-top: 4px;
        }

        .ct-submit:hover:not(:disabled) {
          background: var(--gold); color: var(--navy);
          box-shadow: 0 6px 20px rgba(207,174,112,0.3);
        }

        .ct-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .ct-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ct-success {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 36px 16px; gap: 12px;
        }

        .ct-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: #d1fae5; border: 2px solid #a7f3d0;
          display: flex; align-items: center; justify-content: center;
          animation: popIn 0.4s ease-out;
        }

        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        .ct-success h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 600; color: var(--navy);
        }

        .ct-success p { font-size: 13px; color: var(--gray-400); line-height: 1.7; max-width: 300px; }

        .ct-btn-reset {
          margin-top: 6px; padding: 9px 22px;
          background: var(--navy); color: white;
          border: none; border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }

        .ct-btn-reset:hover { background: var(--gold); color: var(--navy); }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .ct-main { grid-template-columns: 1fr; }
          .ct-left-inner { display: flex; flex-direction: row; align-items: center; gap: 24px; flex-wrap: wrap; }
          .ct-socials { flex-direction: row; flex-wrap: wrap; }
          .ct-socials-title { margin-bottom: 0; white-space: nowrap; }
        }

        @media (max-width: 768px) {
          .ct-info-row { grid-template-columns: 1fr 1fr; margin-top: -28px; }
          .ct-info-card:first-child { border-radius: 12px 0 0 0; }
          .ct-info-card:nth-child(2) { border-radius: 0 12px 0 0; border-left: 1px solid var(--gray-200); }
          .ct-info-card:nth-child(3) { border-radius: 0 0 0 12px; border-top: none; }
          .ct-info-card:last-child { border-radius: 0 0 12px 0; border-left: 1px solid var(--gray-200); border-top: none; }
          .ct-form-row { grid-template-columns: 1fr; }
          .ct-form-card { padding: 24px 18px; }
        }

        @media (max-width: 480px) {
          .ct-info-row { grid-template-columns: 1fr; }
          .ct-info-card { border-radius: 0 !important; border-left: 1px solid var(--gray-200) !important; border-top: none; }
          .ct-info-card:first-child { border-radius: 12px 12px 0 0 !important; border-top: 1px solid var(--gray-200) !important; }
          .ct-info-card:last-child { border-radius: 0 0 12px 12px !important; }
        }
      `}</style>
    </div>
  );
};

export default Contact;