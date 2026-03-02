import React from 'react';
import { useTranslation } from 'react-i18next';
// Lottie removed - using CSS fallback loader

const Loader = ({ size = 200 }) => {
    const { t } = useTranslation();
    // Since we can't directly load from the URL, we'll use a fallback animation
    // or create a simple CSS loader
    return (
        <div className="loader-container">
            <div className="loader-content">
                <div className="judge-loader">
                    <div className="hammer"></div>
                    <div className="base"></div>
                </div>
                <p>{t('loader.loading')}</p>
            </div>
            
            <style>{`
                .loader-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }

                .loader-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .judge-loader {
                    position: relative;
                    width: ${size}px;
                    height: ${size}px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .hammer {
                    width: 60px;
                    height: 20px;
                    background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                    border-radius: 10px;
                    position: relative;
                    animation: hammering 1s ease-in-out infinite;
                    transform-origin: bottom center;
                    margin-bottom: 10px;
                }

                .hammer::before {
                    content: '';
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 40px;
                    background: linear-gradient(135deg, #654321 0%, #8B4513 100%);
                    border-radius: 4px;
                }

                .hammer::after {
                    content: '';
                    position: absolute;
                    top: -25px;
                    left: 35%;
                    width: 30px;
                    height: 15px;
                    background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
                    border-radius: 3px;
                }

                .base {
                    width: 80px;
                    height: 15px;
                    background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
                    border-radius: 50%;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }

                @keyframes hammering {
                    0%, 100% {
                        transform: rotate(-10deg) translateY(0);
                    }
                    50% {
                        transform: rotate(10deg) translateY(-5px);
                    }
                }

                .loader-content p {
                    font-size: 18px;
                    color: #2c3e50;
                    font-weight: 600;
                    margin: 0;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.6;
                    }
                    50% {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Loader;
