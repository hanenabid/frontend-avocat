import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <Navbar />

      <main className="not-found-main">
        <div className="not-found-container">
          <div className="not-found-content">
            {/* 404 Animation */}
            <div className="error-code">
              <span className="digit">4</span>
              <span className="digit-accent">0</span>
              <span className="digit">4</span>
            </div>

            <div className="error-content">
              <h1 className="error-title">{t('notFound.title')}</h1>
              <p className="error-description">
                {t('notFound.description', 'The page you\'re looking for doesn\'t exist or has been moved.')}
              </p>

              <div className="action-buttons">
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  {t('notFound.backToHome')}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="btn-secondary"
                >
                  {t('notFound.goBack', 'Go Back')}
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="floating-elements">
            <div className="floating-circle circle-1"></div>
            <div className="floating-circle circle-2"></div>
            <div className="floating-circle circle-3"></div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        :root {
          --primary-navy: #1B263B;
          --primary-charcoal: #2D2D2D;
          --secondary-gold: #CFAE70;
          --secondary-gold-dark: #B8965C;
          --secondary-deep-green: #1D6A5E;
          --secondary-deep-green-dark: #155448;
          --neutral-white: #FFFFFF;
          --neutral-light: #F4F4F4;
          --border: rgba(0,0,0,0.06);
          --font-sans: 'Roboto', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          --font-serif: 'Merriweather', Georgia, 'Times New Roman', serif;
        }

        .not-found-page {
          min-height: 100vh;
          background: var(--neutral-light);
          font-family: var(--font-sans);
          color: var(--primary-charcoal);
        }

        .not-found-main {
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .not-found-container {
          max-width: var(--max-width);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .not-found-content {
          text-align: center;
          max-width: 600px;
          width: 100%;
        }

        .error-code {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
        }

        .digit {
          font-size: 6rem;
          font-weight: 800;
          color: var(--primary-navy);
          text-shadow: 0 4px 20px rgba(27, 38, 59, 0.1);
          animation: bounce 2s infinite;
        }

        .digit-accent {
          font-size: 7rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--secondary-gold), var(--secondary-gold-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 20px rgba(207, 174, 112, 0.2);
          animation: pulse 2s infinite;
          position: relative;
        }

        .error-content {
          background: var(--neutral-white);
          padding: 48px 32px;
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(27, 38, 59, 0.04);
          border: 1px solid var(--neutral-light);
          animation: slideUp 0.8s ease-out;
        }

        .error-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary-navy);
          margin: 0 0 16px 0;
          line-height: 1.2;
          font-family: var(--font-serif);
          background: linear-gradient(135deg, var(--primary-navy), var(--secondary-gold));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .error-description {
          font-size: 1.125rem;
          color: var(--primary-charcoal);
          line-height: 1.6;
          margin: 0 0 32px 0;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--secondary-gold);
          color: var(--primary-navy);
          border: none;
          padding: 16px 32px;
          border-radius: var(--radius-sm);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 18px rgba(207, 174, 112, 0.12);
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn-primary:hover::before {
          left: 100%;
        }

        .btn-primary:hover {
          background: var(--secondary-gold-dark);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(207, 174, 112, 0.3);
        }

        .btn-secondary {
          background: var(--secondary-deep-green);
          color: var(--neutral-white);
          border: none;
          padding: 14px 30px;
          border-radius: var(--radius-sm);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: var(--secondary-deep-green-dark);
          transform: translateY(-2px);
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(207, 174, 112, 0.1), rgba(29, 106, 94, 0.1));
          animation: float 6s ease-in-out infinite;
        }

        .circle-1 {
          width: 120px;
          height: 120px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 80px;
          height: 80px;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }

        .circle-3 {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes slideUp {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(5deg);
          }
          66% {
            transform: translateY(-10px) rotate(-5deg);
          }
        }

        @media (max-width: 768px) {
          .error-code {
            gap: 15px;
            margin-bottom: 30px;
          }

          .digit {
            font-size: 4rem;
          }

          .digit-accent {
            font-size: 5rem;
          }

          .error-content {
            padding: 32px 24px;
          }

          .error-title {
            font-size: 2rem;
          }

          .error-description {
            font-size: 1rem;
          }

          .action-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
            max-width: 280px;
          }

          .floating-elements {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .error-code {
            gap: 10px;
          }

          .digit {
            font-size: 3rem;
          }

          .digit-accent {
            font-size: 4rem;
          }

          .error-title {
            font-size: 1.75rem;
          }

          .error-content {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
