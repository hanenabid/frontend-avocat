import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import { useTranslation } from 'react-i18next';
import { IoLocationSharp, IoMail, IoCall } from 'react-icons/io5';
import { GiGraduateCap } from 'react-icons/gi';
import { FaWhatsapp, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import { mapToKey } from '../utils/i18nMapping';

const LawyerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const fetchLawyerProfile = async () => {
            try {
                setLoading(true); setError(null);
                const response = await fetch(`http://localhost:4000/api/auth/avocats/${id}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setLawyer(data);
            } catch (error) {
                setError(`${t('lawyerListing.unableToLoadLawyers')}: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchLawyerProfile();
    }, [id, t]);

    const getAvailabilityDays = () => {
        if (!lawyer?.disponibilites) return [];
        const locale = (i18n && i18n.language) || 'en-US';
        return Object.entries(lawyer.disponibilites)
            .filter(([, schedule]) => schedule.available)
            .map(([day, schedule]) => {
                let displayDay = day.charAt(0).toUpperCase() + day.slice(1);
                try {
                    const weekdayMap = {
                        sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,
                        dimanche:0,lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,
                        mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0
                    };
                    const key = String(day||'').trim().toLowerCase();
                    const targetIndex = weekdayMap.hasOwnProperty(key) ? weekdayMap[key] : null;
                    if (typeof targetIndex === 'number') {
                        const now = new Date();
                        const targetDate = new Date(now);
                        targetDate.setDate(now.getDate() + (targetIndex - now.getDay()));
                        displayDay = targetDate.toLocaleDateString(locale, { weekday: 'long' });
                    }
                } catch(e) {}
                return { day: displayDay, startTime: schedule.startTime, endTime: schedule.endTime };
            });
    };

    const mapAddress = lawyer?.adresseCabinet?.trim()
        ? `${lawyer.adresseCabinet}${lawyer.ville ? ', ' + lawyer.ville : ''}, Tunisia`
        : (lawyer?.ville?.trim() ? `${lawyer.ville}, Tunisia` : null);
    const mapsEmbedUrl = mapAddress ? `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&z=15&output=embed` : null;
    const mapsOpenUrl = mapAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}` : null;

    const formatWhatsAppPhone = (raw) => {
        if (!raw) return null;
        let n = String(raw).trim().replace(/[^0-9]/g, '');
        if (!n) return null;
        if (n.startsWith('00')) n = n.slice(2);
        if (n.length === 8) n = '216' + n;
        return n;
    };
    const whatsappPhone = formatWhatsAppPhone(lawyer?.phone);
    const whatsappText = `Bonjour ${lawyer?.fullName || ''}, je souhaite prendre rendez-vous pour une consultation.`;
    const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}` : null;

    if (loading) return (
        <div className="lp-root">
            <Navbar />
            <div className="lp-state">
                <div className="lp-spinner" />
                <p>{t('lawyerProfile.loadingLawyerProfile')}</p>
            </div>
            <Footer />
        </div>
    );

    if (error || !lawyer) return (
        <div className="lp-root">
            <Navbar />
            <div className="lp-state">
                <p style={{ fontSize: 40 }}>⚠️</p>
                <h2>{t('lawyerProfile.lawyerProfileNotAvailable')}</h2>
                <p>{error || t('lawyerProfile.requestedProfileNotFound')}</p>
                <div className="lp-error-actions">
                    <button className="lp-btn-dark" onClick={() => navigate('/lawyers')}>{t('lawyerProfile.backToLawyers')}</button>
                    <button className="lp-btn-outline" onClick={() => window.location.reload()}>{t('lawyerListing.tryAgain')}</button>
                </div>
            </div>
            <Footer />
        </div>
    );

    const availDays = getAvailabilityDays();

    return (
        <div className="lp-root">
            <Navbar />

            {/* ── HEADER ── */}
            <div className="lp-header">
                <div className="lp-container">
                    <button className="lp-back" onClick={() => navigate('/lawyers')}>
                        <FaArrowLeft /> {t('lawyerProfile.backToSearch')}
                    </button>

                    <div className="lp-hero">
                        {/* Identity */}
                        <div className="lp-hero-info">
                            <p className="lp-verified">✓ {t('lawyerProfile.verified', { defaultValue: 'Vérifié' })}</p>
                            <h1 className="lp-name">{lawyer.fullName}</h1>
                            <p className="lp-spec">
                                {t(`lawyerListing.specialties.${mapToKey(lawyer.specialites,'specialty')}`, { defaultValue: lawyer.specialites })}
                            </p>
                            <div className="lp-hero-meta">
                                <span><IoLocationSharp />{t(`lawyerListing.cities.${mapToKey(lawyer.ville,'city')}`, { defaultValue: lawyer.ville })}</span>
                                {lawyer.anneExperience && <span><GiGraduateCap />{lawyer.anneExperience} {t('lawyerProfile.yearsOfExperience')}</span>}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="lp-hero-cta">
                            <button className="lp-btn-dark lp-btn-lg" onClick={() => setBookingOpen(true)}>
                                <FaCalendarAlt /> {t('lawyerProfile.bookAppointment')}
                            </button>
                            {whatsappUrl
                                ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="lp-btn-wa lp-btn-lg">
                                    <FaWhatsapp /> WhatsApp
                                  </a>
                                : <button className="lp-btn-wa lp-btn-lg lp-disabled"><FaWhatsapp /> WhatsApp</button>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN ── */}
            <div className="lp-main">
                <div className="lp-container">
                    <div className="lp-grid">

                        {/* ── LEFT ── */}
                        <div className="lp-left">
                            {/* Bio */}
                            {lawyer.bio && (
                                <section className="lp-section">
                                    <h2 className="lp-section-title">{t('lawyerProfile.about')}</h2>
                                    <p className="lp-bio">{lawyer.bio}</p>
                                </section>
                            )}

                            {/* Contact */}
                            <section className="lp-section">
                                <h2 className="lp-section-title">{t('lawyerProfile.contactInformation')}</h2>
                                <div className="lp-rows">
                                    {[
                                        { icon: <IoMail />, label: t('lawyerProfile.emailLabel'), value: lawyer.email },
                                        { icon: <IoCall />, label: t('lawyerProfile.phoneLabel'), value: lawyer.phone },
                                        { icon: <IoLocationSharp />, label: t('lawyerProfile.addressLabel'), value: lawyer.adresseCabinet ? `${lawyer.adresseCabinet}, ${lawyer.ville}` : (lawyer.ville || t('lawyerProfile.notSpecified')) },
                                    ].map((r, i) => (
                                        <div key={i} className="lp-row">
                                            <span className="lp-row-icon">{r.icon}</span>
                                            <div>
                                                <div className="lp-row-label">{r.label}</div>
                                                <div className="lp-row-value">{r.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Professional */}
                            <section className="lp-section">
                                <h2 className="lp-section-title">{t('lawyerProfile.professionalInformation')}</h2>
                                <div className="lp-details">
                                    {[
                                        { label: t('lawyerProfile.specialization', { defaultValue: 'Spécialisation' }), value: t(`lawyerListing.specialties.${mapToKey(lawyer.specialites||'','specialty')}`, { defaultValue: lawyer.specialites || t('lawyerProfile.notSpecified') }) },
                                        { label: t('lawyerProfile.education'), value: lawyer.diplome },
                                        ...(lawyer.adresseCabinet ? [{ label: t('lawyerProfile.cabinetAddress'), value: lawyer.adresseCabinet }] : []),
                                        ...(lawyer.anneExperience ? [{ label: t('lawyerProfile.yearsOfExperience'), value: `${lawyer.anneExperience} ${t('lawyerProfile.years')}` }] : []),
                                    ].map((d, i) => (
                                        <div key={i} className="lp-detail-row">
                                            <span className="lp-detail-label">{d.label}</span>
                                            <span className="lp-detail-value">{d.value}</span>
                                        </div>
                                    ))}
                                    {lawyer.langues?.length > 0 && (
                                        <div className="lp-detail-row">
                                            <span className="lp-detail-label">{t('lawyerProfile.languages')}</span>
                                            <div className="lp-langs">
                                                {lawyer.langues.map((l, i) => <span key={i}>{l}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Schedule */}
                            {availDays.length > 0 && (
                                <section className="lp-section">
                                    <h2 className="lp-section-title">{t('lawyerProfile.availabilitySchedule')}</h2>
                                    <div className="lp-schedule">
                                        {availDays.map((d, i) => (
                                            <div key={i} className="lp-schedule-row">
                                                <div className="lp-schedule-day">
                                                    <FaCalendarAlt />
                                                    <span>{d.day}</span>
                                                </div>
                                                <span className="lp-schedule-time">{d.startTime} — {d.endTime}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ── SIDEBAR ── */}
                        <aside className="lp-sidebar">
                            {/* Book */}
                            <div className="lp-section lp-book-card">
                                <h3>{t('lawyerProfile.scheduleConsultation')}</h3>
                                <p>{t('lawyerProfile.readyForLegalAdvice', { defaultValue: 'Prenez rendez-vous avec cet avocat.' })}</p>
                                <button className="lp-btn-dark lp-btn-full" onClick={() => setBookingOpen(true)}>
                                    <FaCalendarAlt /> {t('lawyerProfile.bookAppointment')}
                                </button>
                            </div>

                            {/* Map */}
                            <div className="lp-section">
                                <h3 className="lp-section-title">
                                    <FaMapMarkerAlt /> {t('lawyerProfile.officeLocation')}
                                </h3>
                                {mapsEmbedUrl ? (
                                    <>
                                        <div className="lp-map">
                                            <iframe
                                                title={t('lawyerProfile.mapTitle')}
                                                width="100%" height="100%"
                                                frameBorder="0" style={{ border: 0 }}
                                                loading="lazy" src={mapsEmbedUrl}
                                            />
                                        </div>
                                        <a href={mapsOpenUrl} target="_blank" rel="noreferrer" className="lp-map-link">
                                            <FaMapMarkerAlt /> {t('lawyerProfile.openInGoogleMaps')}
                                        </a>
                                    </>
                                ) : (
                                    <p className="lp-muted">{t('lawyerProfile.noAddressAvailable')}</p>
                                )}
                            </div>

                            
                        </aside>
                    </div>
                </div>
            </div>

            <Footer />
            <BookingModal avocat={lawyer} open={bookingOpen} onClose={() => setBookingOpen(false)} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                @keyframes spin { to { transform: rotate(360deg); } }

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --font: 'Inter', sans-serif;
                    --black: #111111;
                    --gray-800: #333333;
                    --gray-600: #555555;
                    --gray-400: #999999;
                    --gray-200: #e5e5e5;
                    --gray-100: #f5f5f5;
                    --white: #ffffff;
                    --green: #22c55e;
                    --ease: all 0.2s ease;
                }

                .lp-root {
                    min-height: 100vh;
                    background: var(--gray-100);
                    font-family: var(--font);
                    color: var(--black);
                    overflow-x: hidden;
                }

                .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

                /* ── STATES ── */
                .lp-state {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    min-height: 60vh; gap: 16px; text-align: center;
                    padding: 40px 24px;
                }
                .lp-spinner {
                    width: 36px; height: 36px;
                    border: 2px solid var(--gray-200);
                    border-top-color: var(--black);
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                .lp-state h2 { font-size: 1.5rem; font-weight: 700; }
                .lp-state p { color: var(--gray-600); font-size: 14px; }
                .lp-error-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

                /* ── HEADER ── */
                .lp-header {
                    background: var(--white);
                    border-bottom: 1px solid var(--gray-200);
                    padding: 24px 0 28px;
                }

                .lp-back {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: none; border: 1px solid var(--gray-200);
                    border-radius: 7px; padding: 7px 14px;
                    font-family: var(--font); font-size: 13px; font-weight: 600;
                    color: var(--gray-600); cursor: pointer;
                    transition: var(--ease); margin-bottom: 20px;
                }
                .lp-back:hover { border-color: var(--black); color: var(--black); }

                .lp-hero {
                    display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
                }

                /* Avatar */
                .lp-avatar {
                    width: 100px; height: 100px;
                    background: var(--black);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; flex-shrink: 0;
                }
                .lp-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .lp-avatar span {
                    font-size: 40px; font-weight: 800;
                    color: var(--white); letter-spacing: -0.02em;
                }

                /* Identity */
                .lp-hero-info { flex: 1; min-width: 0; }

                .lp-verified {
                    font-size: 11px; font-weight: 700;
                    color: var(--green);
                    margin-bottom: 6px;
                    letter-spacing: 0.02em;
                }

                .lp-name {
                    font-size: clamp(1.5rem, 3vw, 2.2rem);
                    font-weight: 800; letter-spacing: -0.03em;
                    color: var(--black); line-height: 1.1;
                    margin-bottom: 4px;
                }

                .lp-spec {
                    font-size: 14px; font-weight: 500;
                    color: var(--gray-600); margin-bottom: 10px;
                }

                .lp-hero-meta {
                    display: flex; gap: 16px; flex-wrap: wrap;
                }
                .lp-hero-meta span {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 13px; font-weight: 500; color: var(--gray-400);
                }
                .lp-hero-meta svg { font-size: 12px; }

                /* CTA */
                .lp-hero-cta {
                    display: flex; flex-direction: column; gap: 8px;
                    flex-shrink: 0; min-width: 160px;
                }

                /* ── BUTTONS ── */
                .lp-btn-dark {
                    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
                    background: var(--black); color: var(--white);
                    border: none; border-radius: 8px;
                    padding: 10px 18px;
                    font-family: var(--font); font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: var(--ease); text-decoration: none;
                    white-space: nowrap;
                }
                .lp-btn-dark:hover { background: var(--gray-800); }

                .lp-btn-outline {
                    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
                    background: var(--white); color: var(--black);
                    border: 1px solid var(--gray-200); border-radius: 8px;
                    padding: 10px 18px;
                    font-family: var(--font); font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: var(--ease); text-decoration: none;
                    white-space: nowrap;
                }
                .lp-btn-outline:hover { border-color: var(--black); background: var(--gray-100); }

                .lp-btn-wa {
                    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
                    background: var(--white); color: var(--black);
                    border: 1px solid var(--gray-200); border-radius: 8px;
                    padding: 10px 18px;
                    font-family: var(--font); font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: var(--ease); text-decoration: none;
                    white-space: nowrap;
                }
                .lp-btn-wa:hover { border-color: #22c55e; color: #16a34a; background: #f0fdf4; }
                .lp-btn-wa svg { color: #22c55e; }

                .lp-btn-lg { padding: 12px 20px; font-size: 14px; }
                .lp-btn-full { width: 100%; }
                .lp-disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

                /* ── MAIN ── */
                .lp-main { padding: 28px 0 64px; }

                .lp-grid {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 20px;
                    align-items: start;
                }

                .lp-left { display: flex; flex-direction: column; gap: 16px; }

                /* ── SECTION ── */
                .lp-section {
                    background: var(--white);
                    border: 1px solid var(--gray-200);
                    border-radius: 12px;
                    padding: 24px;
                }

                .lp-section-title {
                    font-size: 15px; font-weight: 700;
                    color: var(--black);
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--gray-200);
                    display: flex; align-items: center; gap: 8px;
                }
                .lp-section-title svg { color: var(--gray-400); font-size: 13px; }

                /* Contact rows */
                .lp-rows { display: flex; flex-direction: column; gap: 0; }
                .lp-row {
                    display: flex; align-items: flex-start; gap: 14px;
                    padding: 14px 0;
                    border-bottom: 1px solid var(--gray-200);
                    transition: var(--ease);
                }
                .lp-row:last-child { border-bottom: none; }
                .lp-row:hover { padding-left: 4px; }
                .lp-row-icon {
                    color: var(--gray-400); font-size: 16px;
                    margin-top: 2px; flex-shrink: 0;
                }
                .lp-row-label {
                    font-size: 11px; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    color: var(--gray-400); margin-bottom: 3px;
                }
                .lp-row-value { font-size: 14px; font-weight: 600; color: var(--black); }

                /* Pro details */
                .lp-details { display: flex; flex-direction: column; }
                .lp-detail-row {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    gap: 16px; padding: 12px 0;
                    border-bottom: 1px solid var(--gray-200);
                }
                .lp-detail-row:last-child { border-bottom: none; }
                .lp-detail-label {
                    font-size: 13px; font-weight: 600; color: var(--gray-600);
                    flex-shrink: 0; min-width: 130px;
                }
                .lp-detail-value { font-size: 14px; font-weight: 600; color: var(--black); text-align: right; }

                .lp-langs { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
                .lp-langs span {
                    font-size: 12px; font-weight: 600; color: var(--gray-600);
                    background: var(--gray-100); border: 1px solid var(--gray-200);
                    padding: 2px 10px; border-radius: 4px;
                }

                /* Bio */
                .lp-bio {
                    font-size: 14px; line-height: 1.8;
                    color: var(--gray-600);
                }

                /* Schedule */
                .lp-schedule { display: flex; flex-direction: column; gap: 0; }
                .lp-schedule-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--gray-200);
                    transition: var(--ease);
                }
                .lp-schedule-row:last-child { border-bottom: none; }
                .lp-schedule-row:hover { padding-left: 4px; }
                .lp-schedule-day {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 14px; font-weight: 600; color: var(--black);
                }
                .lp-schedule-day svg { color: var(--gray-400); font-size: 12px; }
                .lp-schedule-time {
                    font-size: 13px; font-weight: 500; color: var(--gray-600);
                    background: var(--gray-100);
                    padding: 4px 10px; border-radius: 4px;
                }

                /* ── SIDEBAR ── */
                .lp-sidebar {
                    display: flex; flex-direction: column; gap: 16px;
                    position: sticky; top: 20px;
                }

                .lp-book-card h3 {
                    font-size: 15px; font-weight: 700;
                    color: var(--black); margin-bottom: 6px;
                }
                .lp-book-card p {
                    font-size: 13px; color: var(--gray-600);
                    margin-bottom: 16px; line-height: 1.6;
                }

                /* Map */
                .lp-map {
                    height: 220px; margin-top: 12px;
                    border: 1px solid var(--gray-200);
                    border-radius: 8px; overflow: hidden;
                    filter: grayscale(0.3);
                }
                .lp-map-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    margin-top: 10px;
                    font-size: 13px; font-weight: 600;
                    color: var(--black); text-decoration: none;
                    border-bottom: 1px solid var(--gray-200);
                    transition: var(--ease);
                }
                .lp-map-link:hover { border-color: var(--black); }

                .lp-muted { font-size: 13px; color: var(--gray-400); font-style: italic; }

                /* ── RESPONSIVE ── */
                @media (max-width: 900px) {
                    .lp-grid { grid-template-columns: 1fr; }
                    .lp-sidebar { position: static; }
                }
                @media (max-width: 640px) {
                    .lp-container { padding: 0 16px; }
                    .lp-hero { flex-direction: column; align-items: flex-start; }
                    .lp-hero-cta { flex-direction: row; flex-wrap: wrap; width: 100%; }
                    .lp-btn-lg { flex: 1; }
                    .lp-avatar { width: 72px; height: 72px; border-radius: 10px; }
                    .lp-avatar span { font-size: 28px; }
                    .lp-detail-row { flex-direction: column; gap: 4px; }
                    .lp-detail-value { text-align: left; }
                    .lp-langs { justify-content: flex-start; }
                    .lp-section { padding: 18px 16px; }
                }
                @media (max-width: 400px) {
                    .lp-hero-cta { flex-direction: column; }
                    .lp-btn-lg { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default LawyerProfile;