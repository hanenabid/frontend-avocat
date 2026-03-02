import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PaymentModal = ({ isOpen, onClose, onPaymentConfirm, appointment }) => {
  const { t } = useTranslation();
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentConfirm(appointment._id);
      onClose();
      alert(t('paymentModal.paymentSuccessful'));
    }, 2000);
  };

  const handleInPersonConfirm = async () => {
    if (!appointment?._id) return;
    setIsProcessing(true);
    // Simulate a quick acknowledgement for in-person payment
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentConfirm(appointment._id);
      onClose();
      alert(t('paymentModal.markedAsPaid'));
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>{t('paymentModal.completePayment')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-modal-body">
          {/* Payment method selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <label style={{ color: '#374151', fontWeight: 700 }}>{t('paymentModal.paymentMethod')}</label>
            <div className="payment-methods">
              <label className={`method ${paymentMethod === 'online' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} /> {t('paymentModal.online')}
              </label>
              <label className={`method ${paymentMethod === 'inperson' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="inperson" checked={paymentMethod === 'inperson'} onChange={() => setPaymentMethod('inperson')} /> {t('paymentModal.inPerson')}
              </label>
            </div>
          </div>

          <div className="appointment-summary">
            <h3>{t('paymentModal.appointmentDetails')}</h3>
            <div className="summary-item">
              <span>{t('paymentModal.lawyer')}</span>
              <span>{appointment.avocatId?.fullName || appointment.avocatId?.nom || 'Legal Advisor'}</span>
            </div>
            <div className="summary-item">
              <span>{t('paymentModal.date')}</span>
              <span>{new Date(appointment.date).toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span>{t('paymentModal.time')}</span>
              <span>{appointment.heure}</span>
            </div>
            <div className="summary-item total">
              <span>{t('paymentModal.totalAmount')}</span>
              <span>$150.00</span>
            </div>
          </div>

          {paymentMethod === 'online' ? (
            <form onSubmit={handlePaymentSubmit} className="payment-form">
            <div className="form-section">
              <h3>{t('paymentModal.paymentInformation')}</h3>

              <div className="form-group">
                <label htmlFor="cardholderName">{t('paymentModal.cardholderName')}</label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardNumber">{t('paymentModal.cardNumber')}</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">{t('paymentModal.expiryDate')}</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">{t('paymentModal.cvv')}</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="billingAddress">{t('paymentModal.billingAddress')}</label>
                <input
                  type="text"
                  id="billingAddress"
                  name="billingAddress"
                  value={paymentData.billingAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, ZIP"
                  required
                />
              </div>
            </div>

              <div className="payment-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  {t('paymentModal.cancel')}
                </button>
                <button type="submit" className="pay-btn" disabled={isProcessing}>
                  {isProcessing ? t('paymentModal.processing') : t('paymentModal.pay')}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <div style={{ background: '#FEF3C7', borderRadius: '8px', padding: '12px', marginBottom: '12px', color: '#92400E' }}>
                {t('paymentModal.inPersonNote')}
              </div>
              <div className="payment-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  {t('paymentModal.cancel')}
                </button>
                <button type="button" className="pay-btn" onClick={handleInPersonConfirm} disabled={isProcessing}>
                  {isProcessing ? t('paymentModal.processing') : t('paymentModal.markAsPaid')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

  <style>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .payment-modal {
          background: #FFFFFF;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(27, 38, 59, 0.15);
        }

        .payment-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #F4F4F4;
        }

        .payment-modal-header h2 {
          margin: 0;
          color: #1B263B;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #374151;
        }

        .payment-modal-body {
          padding: 32px;
        }

        .appointment-summary {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .appointment-summary h3 {
          margin: 0 0 16px 0;
          color: #1B263B;
          font-size: 1.1rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #374151;
        }

        .summary-item.total {
          border-top: 1px solid #E5E7EB;
          padding-top: 8px;
          font-weight: 700;
          color: #1B263B;
          font-size: 1.1rem;
        }

        .payment-form {
          /* Form styles */
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          color: #1B263B;
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #374151;
          font-weight: 600;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #F4F4F4;
          border-radius: 8px;
          font-size: 16px;
          color: #2D2D2D;
          background: #FFFFFF;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #CFAE70;
          box-shadow: 0 0 0 3px rgba(207, 174, 112, 0.1);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

  .payment-methods { display:flex; gap:8px; align-items:center }
  .payment-methods .method { background:#fff; border:1px solid #F4F4F4; padding:8px 12px; border-radius:8px; cursor:pointer; display:flex; gap:8px; align-items:center }
  .payment-methods .method.active { border-color:#CFAE70; box-shadow:0 6px 20px rgba(207,174,112,0.12) }
  .payment-methods input[type="radio"] { margin-right:6px }

        .form-row .form-group {
          flex: 1;
        }

        .payment-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
        }

        .cancel-btn, .pay-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: #1D6A5E;
          color: #FFFFFF;
        }

        .cancel-btn:hover {
          background: #155448;
        }

        .pay-btn {
          background: #CFAE70;
          color: #1B263B;
        }

        .pay-btn:hover:not(:disabled) {
          background: #B8965C;
        }

        .pay-btn:disabled {
          background: #E6D9B5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .payment-modal {
            width: 95%;
            margin: 20px;
          }

          .form-row {
            flex-direction: column;
          }
        }
  `}</style>
    </div>
  );
};

export default PaymentModal;
