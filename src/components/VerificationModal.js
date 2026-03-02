import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { mapToKey } from '../utils/i18nMapping';
import FileViewer from './FileViewer';

const VerificationModal = ({ 
    isOpen, 
    onClose, 
    lawyer, 
    onApprove, 
    onReject, 
    isLoading 
}) => {
    const { t } = useTranslation();

    if (!isOpen || !lawyer) return null;

    const handleApprove = () => {
        onApprove(lawyer._id);
    };

    const handleReject = () => {
        onReject(lawyer._id);
    };

    return createPortal(
        <div className="verification-modal-overlay" onClick={onClose}>
            <div className="verification-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="verification-modal-header">
                    <h2>{t('adminDashboard.verificationRequest')}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="verification-modal-body">
                    <div className="lawyer-info">
                        <h3>{t('adminDashboard.lawyerInformation')}</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('adminDashboard.fullName')}:</label>
                                <span>{lawyer.fullName}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.email')}:</label>
                                <span>{lawyer.email}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.phone')}:</label>
                                <span>{lawyer.phone || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.city')}:</label>
                                <span>{t(`lawyerListing.cities.${mapToKey(lawyer.ville, 'city')}`, { defaultValue: lawyer.ville })}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.specialties')}:</label>
                                <span>{t(`lawyerListing.specialties.${mapToKey(lawyer.specialites, 'specialty')}`, { defaultValue: lawyer.specialites })}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.diploma')}:</label>
                                <span>{lawyer.diplome}</span>
                            </div>
                            <div className="info-item">
                                <label>{t('adminDashboard.experience')}:</label>
                                <span>{lawyer.anneExperience ? `${lawyer.anneExperience} ${t('adminDashboard.years')}` : 'N/A'}</span>
                            </div>
                            {lawyer.bio && (
                                <div className="info-item full-width">
                                    <label>{t('adminDashboard.bio')}:</label>
                                    <span>{lawyer.bio}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="verification-documents">
                        <h3>{t('adminDashboard.verificationDocuments')}</h3>
                        {lawyer.documentsVerif ? (
                            <div className="document-viewer">
                                <FileViewer
                                    file={lawyer.documentsVerif}
                                    fileName="Verification Document"
                                    showPreview={true}
                                    className="verification-file-viewer"
                                />
                            </div>
                        ) : (
                            <p className="no-documents">{t('adminDashboard.noDocuments')}</p>
                        )}
                    </div>
                </div>

                <div className="verification-modal-footer">
                    <button 
                        className="reject-button" 
                        onClick={handleReject}
                        disabled={isLoading}
                    >
                        {isLoading ? t('adminDashboard.processing') : t('adminDashboard.reject')}
                    </button>
                    <button 
                        className="approve-button" 
                        onClick={handleApprove}
                        disabled={isLoading}
                    >
                        {isLoading ? t('adminDashboard.processing') : t('adminDashboard.approve')}
                    </button>
                </div>
            </div>

            <style>{`
                .verification-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    padding: 20px;
                }

                .verification-modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }

                .verification-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .verification-modal-header h2 {
                    margin: 0;
                    color: #1B263B;
                    font-size: 1.5rem;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                }

                .close-button:hover {
                    color: #374151;
                }

                .verification-modal-body {
                    padding: 24px;
                }

                .lawyer-info h3,
                .verification-documents h3 {
                    margin: 0 0 16px 0;
                    color: #1B263B;
                    font-size: 1.2rem;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .info-item.full-width {
                    grid-column: 1 / -1;
                }

                .info-item label {
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.9rem;
                }

                .info-item span {
                    color: #1f2937;
                    padding: 8px 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }

                .document-viewer {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .document-image {
                    width: 100%;
                    max-height: 400px;
                    object-fit: contain;
                    display: block;
                }

                .document-pdf {
                    width: 100%;
                    height: 400px;
                    border: none;
                }

                .pdf-viewer {
                    text-align: center;
                }

                .view-full-document,
                .download-document {
                    display: inline-block;
                    margin: 12px;
                    padding: 8px 16px;
                    background: #1D6A5E;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }

                .view-full-document:hover,
                .download-document:hover {
                    background: #155448;
                }

                .document-link {
                    padding: 40px;
                    text-align: center;
                }

                .no-documents {
                    padding: 40px;
                    text-align: center;
                    color: #6b7280;
                    font-style: italic;
                }

                .verification-modal-footer {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    padding: 20px 24px;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                    border-radius: 0 0 12px 12px;
                }

                .approve-button,
                .reject-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .approve-button {
                    background: #10b981;
                    color: white;
                }

                .approve-button:hover:not(:disabled) {
                    background: #059669;
                }

                .reject-button {
                    background: #ef4444;
                    color: white;
                }

                .reject-button:hover:not(:disabled) {
                    background: #dc2626;
                }

                .approve-button:disabled,
                .reject-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .verification-modal-content {
                        margin: 0;
                        height: 100vh;
                        border-radius: 0;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }

                    .verification-modal-footer {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default VerificationModal;