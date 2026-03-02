import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Logo = ({ variant = 'default', text = '' , size = 180, className = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className={`nav-logo ${className} ${variant === 'green' ? 'logo--green' : ''}`} aria-hidden={false}>
      <button type="button" onClick={() => navigate('/')} className="logo-button" aria-label={t('nav.brandName')}>
        <span className="court-logo" aria-hidden="true">
          <img
            src="/logo.png"
            alt="Juridika Logo"
            width={size}
            height={size}
            className="logo-image"
          />
        </span>
        {/* Hide text since logo.png already contains the brand name */}
      </button>
  <style>{`
        .nav-logo {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          margin-top: 10px;
          margin-right: 16px;
          display: flex;
          align-items: center;
          max-width: 100%;
          height: 70px; /* Fixed height for navbar alignment */
        }

        /* When Arabic is active, use Tajawal and flip spacing for RTL */
        html.lang-ar .nav-logo {
          margin-right: 0;
          margin-left: 16px;
        }
        html.lang-ar .nav-text {
          font-family: var(--font-arabic);
          font-weight: 700;
        }

        .logo-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--neutral-white);
          font-weight: 700;
          font-size: 1rem;
          height: 100%;
        }

        .court-logo { 
          display: flex; 
          align-items: center; 
          justify-content: center;
          flex-shrink: 0;
          height: 100%;
        }
        .logo-image { 
          display: block; 
          vertical-align: middle; 
          object-fit: contain;
          max-width: 100%;
          max-height: 50px; /* Ensure it fits in navbar */
          height: auto;
          border-radius: 4px;
          /* Ensure good contrast on different backgrounds */
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

  .nav-text { color: var(--neutral-white); font-weight:800; }

        /* variant when logo sits on navy background - no color changes needed for image */
        .logo--green .nav-text { color: var(--neutral-white); }
        
        /* Responsive logo sizing */
        @media (max-width: 768px) {
          .nav-logo {
            height: 50px;
          }
          .logo-image {
            max-width: 200px;
            max-height: 40px;
          }
        }

        @media (max-width: 480px) {
          .nav-text { display: none }
        }
  `}</style>
    </div>
    
  );
};

export default Logo;
