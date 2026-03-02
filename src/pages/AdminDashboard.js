import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VerificationModal from '../components/VerificationModal';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../services/adminApi';
import mapToKey from '../utils/i18nMapping';

const AdminDashboard = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || user.role !== 'admin') {
      alert(t('adminDashboard.accessDenied'));
    }
  }, [t]);

  const [stats, setStats] = useState({
    totalLawyers: 0, verifiedLawyers: 0,
    pendingLawyers: 0, totalClients: 0
  });
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success) setStats(response.stats);
      } catch (error) {
        alert(t('adminDashboard.failedToFetchStats', { defaultValue: 'Failed to fetch statistics' }));
      }
    };
    fetchStats();
  }, [t]);

  useEffect(() => {
    const fetchPendingLawyers = async () => {
      try {
        setIsLoading(true);
        const response = await adminApi.getPendingLawyers();
        if (response.success) setPendingLawyers(response.lawyers);
      } catch (error) {
        alert(t('adminDashboard.failedToFetchLawyers', { defaultValue: 'Failed to fetch pending lawyers' }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendingLawyers();
  }, [t]);

  const handleViewDetails = (lawyer) => { setSelectedLawyer(lawyer); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedLawyer(null); };

  const handleApprove = async (lawyerId) => {
    try {
      setIsVerifying(true);
      const response = await adminApi.verifyLawyer(lawyerId, 'approve');
      if (response.success) {
        setPendingLawyers(prev => prev.filter(l => l._id !== lawyerId));
        setStats(prev => ({ ...prev, verifiedLawyers: prev.verifiedLawyers + 1, pendingLawyers: prev.pendingLawyers - 1 }));
        handleCloseModal();
      }
    } catch { alert(t('adminDashboard.failedToApprove', { defaultValue: 'Failed to approve lawyer' })); }
    finally { setIsVerifying(false); }
  };

  // handle clicks on statistic cards
  const handleCardClick = async (type) => {
    setActiveTab(type);
    setPanelError(null);
    setPanelLoading(true);
    setSearchQuery('');

    try {
      if (type === 'pending') {
        // data already loaded earlier
      } else if (type === 'lawyers') {
        const data = await adminApi.getAllLawyers();
        setLawyers(data);
      } else if (type === 'clients') {
        const data = await adminApi.getAllClients();
        setClients(data);
      } else if (type === 'verified') {
        const data = await adminApi.getVerifiedLawyers();
        setLawyers(data);
      }
    } catch (err) {
      setPanelError(err.message || 'Failed to load data');
    } finally {
      setPanelLoading(false);
    }
  };

  // render the content of the panel based on active tab
  const renderTable = () => {
    let rows = [];
    if (activeTab === 'pending') rows = filteredPending;
    else if (activeTab === 'lawyers' || activeTab === 'verified') rows = filteredLawyersList;
    else if (activeTab === 'clients') rows = filteredClients;

    if (rows.length === 0) {
      return (
        <div className="ad-state">
          <h3>{t('adminDashboard.noData', { defaultValue: 'No records found' })}</h3>
        </div>
      );
    }

    return (
      <div className="ad-table">
        <div className="ad-table-head">
          <div>{t('name', { defaultValue: 'Name' })}</div>
          <div>{t('email', { defaultValue: 'Email' })}</div>
          <div>{t('date', { defaultValue: 'Created' })}</div>
          {activeTab === 'pending' && <div>{t('actions', { defaultValue: 'Actions' })}</div>}
        </div>
        {rows.map(row => (
          <div className="ad-table-row" key={row._id}>
            <div className="ad-cell">
              <div className="ad-lawyer-avatar">
                {row.avatarUrl ? <img src={row.avatarUrl} alt="" /> : <span>{row.fullName?.charAt(0)}</span>}
              </div>
              <span className="ad-lawyer-name">{row.fullName}</span>
            </div>
            <div className="ad-cell">
              <span className="ad-email">{row.email}</span>
            </div>
            <div className="ad-cell ad-date">{new Date(row.createdAt).toLocaleDateString()}</div>
            {activeTab === 'pending' && (
              <div className="ad-cell" style={{ gap: 4 }}>
                <button className="ad-btn-view" onClick={() => handleViewDetails(row)}>
                  {t('view', { defaultValue: 'View' })}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleReject = async (lawyerId) => {
    try {
      setIsVerifying(true);
      const response = await adminApi.verifyLawyer(lawyerId, 'reject');
      if (response.success) {
        setPendingLawyers(prev => prev.filter(l => l._id !== lawyerId));
        setStats(prev => ({ ...prev, totalLawyers: prev.totalLawyers - 1, pendingLawyers: prev.pendingLawyers - 1 }));
        handleCloseModal();
      }
    } catch { alert(t('adminDashboard.failedToReject', { defaultValue: 'Failed to reject lawyer' })); }
    finally { setIsVerifying(false); }
  };

  const filteredPending = pendingLawyers.filter(l =>
    l.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLawyersList = lawyers.filter(l =>
    l.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { icon: '⚖️', value: stats.totalLawyers,    label: t('adminDashboard.totalLawyers'),        color: '#CFAE70', bg: '#FEF9EE', type:'lawyers' },
    { icon: '✅', value: stats.verifiedLawyers,  label: t('adminDashboard.verifiedLawyers'),     color: '#10b981', bg: '#D1FAE5', type:'verified' },
    { icon: '⏳', value: stats.pendingLawyers,   label: t('adminDashboard.pendingVerifications'),color: '#f59e0b', bg: '#FEF3C7', type:'pending' },
    { icon: '👥', value: stats.totalClients,     label: t('adminDashboard.totalClients'),        color: '#3b82f6', bg: '#DBEAFE', type:'clients' },
  ];

  return (
    <div className="ad-root">
      <Navbar />

      <div className="ad-container">

        {/* ── HEADER ── */}
        <div className="ad-header">
          <div>
            <h1 className="ad-title">
              {t('adminDashboard.adminConsole', { defaultValue: 'Admin Console' })}
            </h1>
            <p className="ad-subtitle">
              {t('adminDashboard.manageUsers', { defaultValue: 'Gérez les avocats et les utilisateurs' })}
            </p>
          </div>
          <div className="ad-header-badge">
            <span className="ad-badge-dot" />
            Admin
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="ad-stats">
          {statCards.map((s, i) => (
            <div
              className="ad-stat-card"
              key={i}
              style={{ '--accent': s.color, '--bg': s.bg }}
              onClick={() => handleCardClick(s.type)}
            >
              <div className="ad-stat-icon">{s.icon}</div>
              <div className="ad-stat-body">
                <div className="ad-stat-value">{s.value}</div>
                <div className="ad-stat-label">{s.label}</div>
              </div>
              <div className="ad-stat-bar" />
            </div>
          ))}
        </div>

        {/* panel area that appears when a stat card is selected */}
        {activeTab && (
          <div className="ad-panel" style={{ marginTop: 24 }}>
            <div className="ad-panel-header">
              <div className="ad-tabs">
                <div
                  className={`ad-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => handleCardClick('pending')}
                >
                  {t('adminDashboard.pendingVerifications')} ({stats.pendingLawyers})
                </div>
                <div
                  className={`ad-tab ${activeTab === 'lawyers' ? 'active' : ''}`}
                  onClick={() => handleCardClick('lawyers')}
                >
                  {t('adminDashboard.totalLawyers')}
                </div>
                <div
                  className={`ad-tab ${activeTab === 'clients' ? 'active' : ''}`}
                  onClick={() => handleCardClick('clients')}
                >
                  {t('adminDashboard.totalClients')}
                </div>
              </div>

              <div className="ad-search">
                <span className="ad-search-icon">🔍</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search', { defaultValue: 'Search...' })}
                />
                {searchQuery && (
                  <button
                    className="ad-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="ad-panel-body">
              {panelLoading ? (
                <div className="ad-state">
                  <div className="ad-spinner" />
                  <h3>{t('loading', { defaultValue: 'Loading...' })}</h3>
                </div>
              ) : panelError ? (
                <div className="ad-state">
                  <h3>{panelError}</h3>
                </div>
              ) : (
                renderTable()
              )}
            </div>
          </div>
        )}
      </div>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        lawyer={selectedLawyer}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isVerifying}
      />

      <style>{`
        .ad-root {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
        }

        .ad-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }

        /* ── HEADER ── */
        .ad-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .ad-title {
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          color: #1B263B;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
        }

        .ad-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .ad-header-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1B263B;
          color: #CFAE70;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.05em;
        }

        .ad-badge-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── STATS ── */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .ad-stat-card {
          background: white;
          border-radius: 14px;
          padding: 22px 20px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .ad-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
        }

        .ad-stat-icon {
          width: 52px; height: 52px;
          border-radius: 12px;
          background: var(--bg);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }

        .ad-stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #1B263B;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ad-stat-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .ad-stat-bar {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 3px;
          background: var(--accent);
          opacity: 0.5;
          border-radius: 0 0 14px 14px;
        }

        /* ── PANEL ── */
        .ad-panel {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .ad-panel-body {
          padding: 20px 24px;
        }

        .ad-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Tabs */
        .ad-tabs { display: flex; gap: 8px; }

        .ad-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          background: none;
          color: #6b7280;
          transition: all 0.2s;
        }

        .ad-tab.active {
          background: #1B263B;
          color: white;
          border-color: #1B263B;
        }

        .ad-tab-badge {
          background: #ef4444;
          color: white;
          border-radius: 20px;
          padding: 1px 7px;
          font-size: 11px;
          font-weight: 700;
        }

        /* Search */
        .ad-search {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          min-width: 240px;
          transition: border-color 0.2s;
        }

        .ad-search:focus-within { border-color: #1B263B; background: white; }

        .ad-search-icon { font-size: 13px; }

        .ad-search input {
          border: none; outline: none; background: transparent;
          font-size: 13px; font-weight: 500; color: #1B263B;
          width: 100%;
        }

        .ad-search-clear {
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 11px;
          padding: 0; display: flex; align-items: center;
        }

        /* State (empty/loading) */
        .ad-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 300px; gap: 12px; text-align: center;
          padding: 40px;
        }

        .ad-state h3 { font-size: 1.1rem; font-weight: 700; color: #1B263B; margin: 0; }

        .ad-spinner {
          width: 36px; height: 36px;
          border: 3px solid #e5e7eb;
          border-top-color: #1B263B;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── TABLE ── */
        .ad-table { overflow-x: auto; }

        .ad-table-head {
          display: grid;
          grid-template-columns: 2fr 2fr 1.2fr 1.5fr 1fr 1.4fr;
          padding: 10px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
        }

        .ad-table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1.2fr 1.5fr 1fr 1.4fr;
          padding: 14px 24px;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          transition: background 0.15s;
        }

        .ad-table-row:last-child { border-bottom: none; }
        .ad-table-row:hover { background: #f8fafc; }

        .ad-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
          min-width: 0;
        }

        .ad-lawyer-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: #1B263B;
          flex-shrink: 0;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }

        .ad-lawyer-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .ad-lawyer-avatar span {
          color: #CFAE70;
          font-weight: 800;
          font-size: 14px;
        }

        .ad-lawyer-name {
          font-weight: 600;
          color: #1B263B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ad-email {
          color: #6b7280;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ad-date { color: #9ca3af; font-size: 12px; }

        /* Chips */
        .ad-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .ad-chip-city {
          background: #f0f6ff;
          color: #3b82f6;
          border: 1px solid #dbeafe;
        }

        .ad-chip-spec {
          background: #fef9ee;
          color: #92400e;
          border: 1px solid #fde68a;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Action Buttons */
        .ad-btn-view {
          display: flex; align-items: center; gap: 4px;
          padding: 6px 12px;
          background: #1B263B;
          color: white;
          border: none; border-radius: 7px;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .ad-btn-view:hover { background: #2d3f5f; }

        .ad-btn-approve {
          width: 30px; height: 30px;
          background: #d1fae5; color: #065f46;
          border: 1px solid #a7f3d0;
          border-radius: 7px; cursor: pointer;
          font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }

        .ad-btn-approve:hover { background: #10b981; color: white; border-color: #10b981; }

        .ad-btn-reject {
          width: 30px; height: 30px;
          background: #fee2e2; color: #991b1b;
          border: 1px solid #fca5a5;
          border-radius: 7px; cursor: pointer;
          font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }

        .ad-btn-reject:hover { background: #ef4444; color: white; border-color: #ef4444; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ad-table-head,
          .ad-table-row {
            grid-template-columns: 1.5fr 1.5fr 1fr 1.5fr;
          }

          .ad-table-head > div:nth-child(5),
          .ad-table-row > .ad-cell:nth-child(5) { display: none; }
        }

        @media (max-width: 768px) {
          .ad-container { padding: 16px 12px 48px; }
          .ad-header { flex-direction: column; gap: 12px; }
          .ad-stats { grid-template-columns: 1fr 1fr; }
          .ad-panel-header { flex-direction: column; align-items: stretch; }
          .ad-search { min-width: unset; }

          .ad-table-head { display: none; }

          .ad-table-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            margin: 8px 12px;
          }

          .ad-cell { font-size: 13px; }
        }

        @media (max-width: 480px) {
          .ad-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;