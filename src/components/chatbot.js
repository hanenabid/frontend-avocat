import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

const Chatbot = () => {
const { t } = useTranslation();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    const newMessages = [...chatMessages, { type: 'user', text: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      setChatMessages([...newMessages, { 
        type: 'bot', 
        text: 'Merci pour votre message. Un de nos conseillers vous répondra bientôt.' 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* Chatbot Button */}
      <div className={`chatbot-button ${chatbotOpen ? 'hidden' : ''}`} onClick={() => setChatbotOpen(true)}>
        <ChatIcon sx={{ fontSize: 28 }} />
        <div className="chatbot-pulse"></div>
      </div>

      {/* Chatbot Window */}
      {chatbotOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <ChatIcon sx={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="chatbot-title">A{t('homepage.assistantJuridique') || 'OÙ ?'}</h3>
                <p className="chatbot-status">
                  <span className="status-dot"></span>
                  En ligne
                </p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setChatbotOpen(false)}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </button>
          </div>

          <div className="chatbot-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form className="chatbot-input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Tapez votre message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chatbot-input"
            />
            <button type="submit" className="chatbot-send">
              <SendIcon sx={{ fontSize: 20 }} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        /* ========= CHATBOT ========= */
        .chatbot-button {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
          animation: slideInFromBottom 0.5s ease-out;
        }

        .chatbot-button:hover {
          transform: scale(1.1);
          box-shadow: 0 15px 50px rgba(59, 130, 246, 0.6);
        }

        .chatbot-button.hidden {
          display: none;
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chatbot-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #3b82f6;
          opacity: 0.5;
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .chatbot-window {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 380px;
          height: 550px;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideInFromBottom 0.3s ease-out;
          overflow: hidden;
        }

        .chatbot-header {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
        }

        .chatbot-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chatbot-avatar {
          width: 2.5rem;
          height: 2.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbot-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .chatbot-status {
          font-size: 0.75rem;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin: 0.25rem 0 0 0;
        }

        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #10b981;
          border-radius: 50%;
          animation: statusBlink 2s ease-in-out infinite;
        }

        @keyframes statusBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chatbot-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: background 0.2s ease;
        }

        .chatbot-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chatbot-messages {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .chat-message {
          display: flex;
          animation: messageSlideIn 0.3s ease-out;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-message.bot {
          justify-content: flex-start;
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 75%;
          padding: 0.875rem 1.125rem;
          border-radius: 1.125rem;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .chat-message.bot .message-bubble {
          background: white;
          color: #0f172a;
          border-bottom-left-radius: 0.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .chat-message.user .message-bubble {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-bottom-right-radius: 0.25rem;
        }

        .chatbot-input-form {
          padding: 1rem;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 0.75rem;
        }

        .chatbot-input {
          flex: 1;
          padding: 0.875rem 1.125rem;
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          font-size: 0.9375rem;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.2s ease;
        }

        .chatbot-input:focus {
          border-color: #3b82f6;
        }

        .chatbot-send {
          width: 2.75rem;
          height: 2.75rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .chatbot-send:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .chatbot-send:active {
          transform: scale(0.95);
        }

        /* ========= RESPONSIVE ========= */
        @media (max-width: 640px) {
          .chatbot-window {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            bottom: 1rem;
            right: 1rem;
            border-radius: 1rem;
          }

          .chatbot-button {
            bottom: 1.5rem;
            right: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot;