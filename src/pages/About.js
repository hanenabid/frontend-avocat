import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ShieldIcon from '@mui/icons-material/Shield';
import BalanceIcon from '@mui/icons-material/Balance';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const AboutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in-section').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="container">
          <div className="hero-content fade-in-section">
            
            <h1 className="hero-title">
              {t('about.title') || 'Révolutionner l\'accès à la justice'}
            </h1>
            
            <p className="hero-subtitle">
              {t('about.subtitle') || 'Nous connectons les particuliers et les entreprises aux meilleurs avocats de Tunisie grâce à une plateforme innovante, transparente et accessible.'}
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">15K+</div>
                <div className="stat-label">{t('about.lawyers') || 'Avocats'}</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">50K+</div>
                <div className="stat-label">{t('about.cases') || 'Affaires traitées'}</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">98%</div>
                <div className="stat-label">{t('about.satisfaction') || 'Satisfaction'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-content fade-in-section">
            <div className="mission-text">
              <span className="section-badge">{t('about.mission') || 'Notre Mission'}</span>
              <h2 className="section-title">
                {t('about.missionTitle') || 'Démocratiser l\'accès au conseil juridique'}
              </h2>
              <p className="section-description">
                {t('about.missionDesc1') || 'Notre mission est de rendre le conseil juridique accessible à tous. Nous croyons que chaque personne mérite un accès équitable à des services juridiques de qualité, quelle que soit sa situation géographique ou économique.'}
              </p>
              <p className="section-description">
                {t('about.missionDesc2') || 'Grâce à notre plateforme numérique, nous éliminons les barrières traditionnelles et facilitons la mise en relation entre les clients et les professionnels du droit.'}
              </p>
              
              <div className="mission-features">
                <div className="feature-item">
                  <VerifiedUserIcon sx={{ fontSize: 24, color: '#3b82f6' }} />
                  <span>{t('about.verified') || 'Avocats vérifiés'}</span>
                </div>
                <div className="feature-item">
                  <SupportAgentIcon sx={{ fontSize: 24, color: '#3b82f6' }} />
                  <span>{t('about.support') || 'Support 24/7'}</span>
                </div>
              </div>
            </div>

            <div className="mission-image">
              <div className="image-card">
                <img 
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80" 
                  alt="Legal team"
                  className="main-image"
                />
                <div className="image-overlay">
                  <div className="overlay-stat">
                    <div className="overlay-value">2019</div>
                    <div className="overlay-label">{t('about.founded') || 'Fondée en'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header fade-in-section">
            <span className="section-badge">{t('about.values') || 'Nos Valeurs'}</span>
            <h2 className="section-title">
              {t('about.valuesTitle') || 'Les principes qui nous guident'}
            </h2>
          </div>

          <div className="values-grid">
            <div className="value-card fade-in-section">
              <div className="value-icon value-icon-blue">
                <ShieldIcon sx={{ fontSize: 32 }} />
              </div>
              <h3>{t('about.integrity') || 'Intégrité'}</h3>
              <p>{t('about.integrityDesc') || 'Nous opérons avec la plus grande transparence et honnêteté dans toutes nos interactions.'}</p>
            </div>

            <div className="value-card fade-in-section">
              <div className="value-icon value-icon-green">
                <BalanceIcon sx={{ fontSize: 32 }} />
              </div>
              <h3>{t('about.justice') }</h3>
              <p>{t('about.justiceDesc') || 'Nous croyons en un accès équitable à la justice pour tous, sans discrimination.'}</p>
            </div>

            <div className="value-card fade-in-section">
              <div className="value-icon value-icon-purple">
                <GroupsIcon sx={{ fontSize: 32 }} />
              </div>
              <h3>{t('about.community') || 'Communauté'}</h3>
              <p>{t('about.communityDesc') || 'Nous construisons une communauté solidaire de professionnels et de clients engagés.'}</p>
            </div>

            <div className="value-card fade-in-section">
              <div className="value-icon value-icon-orange">
                <TrendingUpIcon sx={{ fontSize: 32 }} />
              </div>
              <h3>{t('about.innovation') || 'Innovation'}</h3>
              <p>{t('about.innovationDesc') || 'Nous utilisons la technologie pour améliorer continuellement l\'expérience juridique.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <div className="section-header fade-in-section">
            <span className="section-badge">{t('about.team') || 'Notre Équipe'}</span>
            <h2 className="section-title">
              {t('about.teamTitle') || 'Des experts passionnés à votre service'}
            </h2>
            <p className="section-description">
              {t('about.teamDesc') || 'Notre équipe multidisciplinaire combine expertise juridique, technologique et humaine pour vous offrir la meilleure expérience possible.'}
            </p>
          </div>

          <div className="team-grid">
            <div className="team-card fade-in-section">
              <div className="team-image">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Team member" />
              </div>
              <div className="team-info">
                <h4>{t('about.ceo') || 'Mehdi Ben Ali'}</h4>
                <p className="team-role">{t('about.ceoRole') || 'CEO & Fondateur'}</p>
                <p className="team-bio">{t('about.ceoBio') || 'Expert en droit et innovation technologique'}</p>
              </div>
            </div>

            <div className="team-card fade-in-section">
              <div className="team-image">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" alt="Team member" />
              </div>
              <div className="team-info">
                <h4>{t('about.cto') || 'Sarah Trabelsi'}</h4>
                <p className="team-role">{t('about.ctoRole') || 'CTO'}</p>
                <p className="team-bio">{t('about.ctoBio') || 'Architecte de notre plateforme technologique'}</p>
              </div>
            </div>

            <div className="team-card fade-in-section">
              <div className="team-image">
                <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" alt="Team member" />
              </div>
              <div className="team-info">
                <h4>{t('about.legal') || 'Karim Mansour'}</h4>
                <p className="team-role">{t('about.legalRole') || 'Directeur Juridique'}</p>
                <p className="team-bio">{t('about.legalBio') || '15 ans d\'expérience en droit des affaires'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content fade-in-section">
            <h2 className="cta-title">
              {t('about.ctaTitle') || 'Prêt à trouver votre avocat ?'}
            </h2>
            <p className="cta-description">
              {t('about.ctaDesc') || 'Rejoignez des milliers de clients satisfaits qui ont trouvé leur expert juridique sur notre plateforme.'}
            </p>
            <div className="cta-buttons">
              <button 
                className="cta-button primary"
                onClick={() => navigate('/avocats')}
              >
                {t('about.findLawyer') || 'Trouver un avocat'}
              </button>
              <button 
                className="cta-button secondary"
                onClick={() => navigate('/contact')}
              >
                {t('about.contactUs') || 'Nous contacter'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .about-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          overflow-x: hidden;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 70vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          color: white;
          display: flex;
          align-items: center;
          padding: 8rem 0 6rem;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          filter: blur(80px);
        }

        .hero-circle-1 {
          width: 600px;
          height: 600px;
          background: #3b82f6;
          top: -200px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }

        .hero-circle-2 {
          width: 400px;
          height: 400px;
          background: #8b5cf6;
          bottom: -100px;
          left: -100px;
          animation: float 15s ease-in-out infinite reverse;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #60a5fa;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(to bottom right, #ffffff, #cbd5e1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.7;
          color: #94a3b8;
          margin-bottom: 3rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          max-width: 700px;
          margin: 0 auto;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(to bottom right, #60a5fa, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .stat-divider {
          width: 1px;
          height: 3rem;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Mission Section */
        .mission-section {
          padding: 8rem 0;
          background: #f8fafc;
        }

        .mission-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .section-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .section-description {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .mission-features {
          display: flex;
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-weight: 600;
          color: #0f172a;
        }

        .mission-image {
          position: relative;
        }

        .image-card {
          position: relative;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .main-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          display: block;
        }

        .image-overlay {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .overlay-value {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          color: #3b82f6;
        }

        .overlay-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        /* Values Section */
        .values-section {
          padding: 8rem 0;
          background: white;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .value-card {
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          text-align: center;
        }

        .value-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }

        .value-icon {
          width: 5rem;
          height: 5rem;
          border-radius: 1.5rem;
          display: grid;
          place-items: center;
          margin: 0 auto 1.5rem;
        }

        .value-icon-blue {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #3b82f6;
        }

        .value-icon-green {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #10b981;
        }

        .value-icon-purple {
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          color: #8b5cf6;
        }

        .value-icon-orange {
          background: linear-gradient(135deg, #fed7aa, #fdba74);
          color: #f59e0b;
        }

        .value-card h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }

        .value-card p {
          color: #64748b;
          line-height: 1.7;
        }

        /* Team Section */
        .team-section {
          padding: 8rem 0;
          background: #f8fafc;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .team-card {
          background: white;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .team-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .team-image {
          width: 100%;
          height: 300px;
          overflow: hidden;
        }

        .team-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .team-card:hover .team-image img {
          transform: scale(1.1);
        }

        .team-info {
          padding: 2rem;
        }

        .team-info h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .team-role {
          color: #3b82f6;
          font-weight: 600;
          font-size: 0.9375rem;
          margin-bottom: 0.75rem;
        }

        .team-bio {
          color: #64748b;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta-section {
          padding: 8rem 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .cta-content {
          position: relative;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          color: white;
          margin-bottom: 1.5rem;
        }

        .cta-description {
          font-size: 1.25rem;
          color: #94a3b8;
          margin-bottom: 3rem;
          line-height: 1.7;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .cta-button {
          padding: 1rem 2rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .cta-button.primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
        }

        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .cta-button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Fade In Animation */
        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .fade-in-section.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .mission-content {
            grid-template-columns: 1fr;
          }

          .values-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .team-grid {
            grid-template-columns: 1fr;
          }

          .hero-stats {
            flex-direction: column;
            gap: 2rem;
          }

          .stat-divider {
            width: 100%;
            height: 1px;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .values-grid {
            grid-template-columns: 1fr;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .cta-button {
            width: 100%;
          }

          .mission-features {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;