import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { caseAPI } from '../services/api';
import FileViewer from './FileViewer';

// Helper: get a created timestamp from common fields (fall back to appointment date)
function getCreatedTime(obj) {
  if (!obj) return 0;
  const possible = obj.createdAt || obj.createDate || obj.created || obj.dateCreated || obj.created_at || obj.createdOn || obj.createdAt || obj.date;
  try {
    const t = possible ? new Date(possible).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  } catch (e) {
    return 0;
  }
}

function sortByCreatedDesc(arr) {
  try {
    return [...(arr || [])].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
  } catch (e) { return arr || []; }
}

export default function CasesManager({ appointments = [], user }){
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation();

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [files, setFiles] = useState([]);

  // Details modal
  const [activeCase, setActiveCase] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [detailState, setDetailState] = useState('');

  useEffect(()=>{
    loadCases();
  }, []);

  // Return a list of appointments unique by client (keep the most recent appointment per client by creation time)
  const uniqueAppointmentsByClient = () => {
    const map = new Map();
    // sort incoming appointments to prefer newest first when iterating
    const sorted = sortByCreatedDesc(appointments || []);
    sorted.forEach(a => {
      const cid = a.clientId?._id || a.clientId || (a.clientInfo?._id) || (a.clientNom) || null;
      const key = cid ? String(cid) : JSON.stringify(a.clientId || a.clientInfo || a);
      const ts = getCreatedTime(a);
      const existing = map.get(key);
      if (!existing || (existing._ts || 0) < ts) {
        map.set(key, { ...a, _ts: ts });
      }
    });
    return sortByCreatedDesc(Array.from(map.values()));
  };

  const isAppointmentSelectable = (a) => {
    if (!a || !a.date) return true; // if no date assume selectable
    try {
      const t = new Date(a.date).getTime();
      return t > Date.now();
    } catch (e) { return true; }
  };

  // Helper to determine if the current user is a lawyer (avocat).
  // Backend sometimes returns user.userType as 'Avocat' (capitalized) or role as 'avocat'.
  const isLawyer = (u) => {
    if (!u) {
      return false;
    }
    
    const candidates = [u.userType, u.role, u.type];
    for (const v of candidates) {
      if (!v) continue;
      const s = String(v).toLowerCase();
      if (s.includes('avocat') || s.includes('lawyer')) {
        return true;
      }
    }
    return false;
  };

  // Helper to get a filename from a URL or File object
  const getFilename = (f) => {
    if (!f) return '';
    if (typeof f === 'string') {
      try {
        const parts = f.split('/');
        const last = parts[parts.length-1] || parts[parts.length-2] || f;
        return decodeURIComponent(last.split('?')[0]);
      } catch (e) {
        return f;
      }
    }
    if (f.name) return f.name;
    return String(f);
  };

  const loadCases = async ()=>{
    setLoading(true);
    try{
      const res = await caseAPI.getCases();
  setCases(sortByCreatedDesc(res.data || []));
    }catch(err){
      console.error('Error loading cases', err);
    }finally{ setLoading(false); }
  };

  const handleCreate = async (e) =>{
    e.preventDefault();
    if(!selectedAppointmentId){ alert(t('casesManager.pleaseSelectAppointment')); return; }
    try{
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('appointment', selectedAppointmentId);
      // find client id from appointment
      const apt = appointments.find(a=> a._id === selectedAppointmentId);
      if(apt){ fd.append('client', apt.clientId?._id || apt.clientId); }
      for(let i=0;i<files.length;i++) fd.append('files', files[i]);

      const res = await caseAPI.createCase(fd);
      setCases(prev => [res.data, ...prev]);
      setShowCreate(false);
      setTitle(''); setDescription(''); setSelectedAppointmentId(''); setFiles([]);
  }catch(err){ console.error(err); alert(t('casesManager.errorCreatingCase')); }
  };

  // Drag & drop handlers for create files
  const onCreateDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onCreateDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles && dtFiles.length) {
      setFiles(Array.from(dtFiles));
    }
  };

  // Drag & drop handlers for detail/update files
  const onDetailDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDetailDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles && dtFiles.length) {
      setDetailFiles(Array.from(dtFiles));
    }
  };

  const openDetails = (c) =>{
    setActiveCase(c);
    setDetailState(c.state);
    setDetailFiles([]);
  };

  const closeDetails = () => setActiveCase(null);

  const handleDetailUpdate = async (e) =>{
    e.preventDefault();
    if(!activeCase) return;
    try{
      const fd = new FormData();
      if(detailState) fd.append('state', detailState);
      for(let i=0;i<detailFiles.length;i++) fd.append('files', detailFiles[i]);
      const res = await caseAPI.updateCase(activeCase._id, fd);
      setCases(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      setActiveCase(res.data);
      alert(t('casesManager.caseUpdated'));
  }catch(err){ console.error(err); alert(t('casesManager.errorUpdatingCase')); }
  };

  const handleDeleteFile = async (caseId, fileUrl) => {
    if (!window.confirm(t('casesManager.deleteFileConfirm'))) return;
    try{
      const res = await caseAPI.deleteFile(caseId, fileUrl);
      setCases(prev => prev.map(p => p._id === res.data._id ? res.data : p));
      if (activeCase && activeCase._id === res.data._id) setActiveCase(res.data);
  }catch(err){ console.error(err); alert(t('casesManager.errorDeletingFile')); }
  };

  return (
    <div className="cases-view">
      <style>{`.appointment-select option:disabled { color: #9ca3af; } .appointment-select { color: #111827; }`}</style>
      <div className="view-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 className="view-title">{t('casesManager.title')}</h2>
          <p className="view-subtitle">{t('casesManager.subtitle')}</p>
        </div>
        <div>
          {/* {isLawyer(user) && ( */}
            <button 
              className="edit-btn" 
              onClick={() => setShowCreate(true)}
              style={{
                background: '#CFAE70 !important',
                color: '#1B263B !important',
                border: 'none !important',
                padding: '12px 24px !important',
                borderRadius: '8px !important',
                fontWeight: '600 !important',
                fontSize: '14px !important',
                cursor: 'pointer !important',
                display: 'inline-block !important',
                minWidth: '120px !important',
                visibility: 'visible !important',
                opacity: '1 !important'
              }}
            >
              {t('casesManager.createCase')}
            </button>
          {/* )} */}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">{t('casesManager.loadingCases')}</div>
      ) : (
        <div>
          {cases.length === 0 && <div className="empty-state"><h3>{t('casesManager.noCases')}</h3><p>{t('casesManager.noCasesDesc')}</p></div>}
          <div style={{display:'grid', gap:12}}>
            {cases.map(cs => (
              <div key={cs._id} className="appointment-card" style={{cursor:'pointer'}} onClick={() => openDetails(cs)}>
                <h3 style={{margin:0}}>{cs.title}</h3>
                <p style={{color:'#6b7280'}}>{cs.description}</p>
                <p><strong>State:</strong> {cs.state}</p>
                <p><strong>Client:</strong> {cs.client?.fullName || cs.client?.nom}</p>
                <p><strong>Appointment:</strong> {cs.appointment?.date ? new Date(cs.appointment.date).toLocaleDateString() : 'N/A'}</p>
                {cs.files && cs.files.length>0 && (
                  <div>
                    <strong>Files:</strong>
                    <div className="case-files-grid">
                      {cs.files.map((f,i)=> (
                        <div key={i} className="case-file-wrapper">
                          <FileViewer
                            file={f}
                            fileName={getFilename(f)}
                            showPreview={true}
                            className="case-file-viewer"
                          />
                          {isLawyer(user) && (
                            <button 
                              className="delete-file-btn" 
                              onClick={(ev)=>{ ev.stopPropagation(); handleDeleteFile(cs._id, f); }}
                              title={t('casesManager.delete')}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#fff', padding:20, width:720, borderRadius:10}}>
            <h3>{t('casesManager.createCase')}</h3>
            <form onSubmit={handleCreate}>
              <div style={{display:'grid', gap:8}}>
                <label>{t('casesManager.appointmentLabel')}</label>
                <select className="appointment-select" value={selectedAppointmentId} onChange={e=>{
                  const id = e.target.value;
                  const ap = appointments.find(a => a._id === id);
                  if (!isAppointmentSelectable(ap)) { alert(t('casesManager.appointmentUnavailable')); return; }
                  setSelectedAppointmentId(id);
                }}>
                  <option value="">{t('casesManager.selectAppointmentPlaceholder')}</option>
                  {uniqueAppointmentsByClient().map(a=> (
                    <option key={a._id} value={a._id} disabled={!isAppointmentSelectable(a)}>
                      {a.clientId?.fullName || a.clientInfo?.nom || a.clientNom || t('casesManager.clientFallback')}{!isAppointmentSelectable(a) ? ` (${t('casesManager.unavailable')})` : ''}
                    </option>
                  ))}
                </select>

                <label>{t('casesManager.titleLabel')}</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} />

                <label>{t('casesManager.descriptionLabel')}</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} />

                <label>{t('casesManager.filesLabel')}</label>
                <div onDragOver={onCreateDragOver} onDrop={onCreateDrop} style={{border:'2px dashed #e5e7eb', padding:12, borderRadius:8, background:'#fafafa'}}>
                  <input type="file" multiple onChange={e=> setFiles(Array.from(e.target.files))} />
                  <p style={{margin:6, color:'#6b7280'}}>{t('casesManager.dragDropOrClick')}</p>
                  {files && files.length>0 && (
                    <ul style={{margin:0}}>
                      {files.map((f,i)=>(<li key={i}>{f.name}</li>))}
                    </ul>
                  )}
                </div>

                <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:8}}>
                  <button type="button" className="cancel-btn" onClick={()=> setShowCreate(false)}>{t('casesManager.cancel')}</button>
                  <button type="submit" className="save-btn">{t('casesManager.create')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeCase && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#fff', padding:20, width:720, borderRadius:10, maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3>{activeCase.title}</h3>
              <button className="cancel-btn" onClick={closeDetails}>Close</button>
            </div>
            <p>{activeCase.description}</p>
            <p><strong>State:</strong> {activeCase.state}</p>
            <p><strong>Client:</strong> {activeCase.client?.fullName || activeCase.client?.nom}</p>

            <div>
              <h4>Files</h4>
              {activeCase.files && activeCase.files.length===0 && <p>No files</p>}
              <div className="case-files-grid">
                {activeCase.files && activeCase.files.map((f,i)=> (
                  <div key={i} className="case-file-wrapper">
                    <FileViewer
                      file={f}
                      fileName={getFilename(f)}
                      showPreview={true}
                      className="case-file-viewer"
                    />
                    {isLawyer(user) && (
                      <button 
                        className="delete-file-btn" 
                        onClick={()=> handleDeleteFile(activeCase._id, f)}
                        title="Delete File"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isLawyer(user) ? (
              <form onSubmit={handleDetailUpdate} style={{marginTop:20}}>
                <label>State</label>
                <select value={detailState} onChange={e=>setDetailState(e.target.value)}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Closed</option>
                </select>
                <div>
                  <label>Add files</label>
                  <div onDragOver={onDetailDragOver} onDrop={onDetailDrop} style={{border:'2px dashed #e5e7eb', padding:12, borderRadius:8, background:'#fafafa'}}>
                    <input type="file" multiple onChange={e=>setDetailFiles(Array.from(e.target.files))} />
                    <p style={{margin:6, color:'#6b7280'}}>Drag & drop files here, or click to select</p>
                    {detailFiles && detailFiles.length>0 && (
                      <ul style={{margin:0}}>
                        {detailFiles.map((f,i)=>(<li key={i}>{f.name}</li>))}
                      </ul>
                    )}
                  </div>
                </div>
                <div style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <button type="button" className="cancel-btn" onClick={closeDetails}>Cancel</button>
                  <button className="save-btn" type="submit">Save</button>
                </div>
              </form>
            ) : (
              // Client: only allow adding files (no state changes)
              <form onSubmit={async (e)=>{
                e.preventDefault();
                if(!activeCase) return;
                try{
                  const fd = new FormData();
                  for(let i=0;i<detailFiles.length;i++) fd.append('files', detailFiles[i]);
                  const res = await caseAPI.addFiles(activeCase._id, fd);
                  setCases(prev => prev.map(p => p._id === res.data._id ? res.data : p));
                  setActiveCase(res.data);
                  setDetailFiles([]);
                  alert(t('casesManager.filesUploaded'));
                }catch(err){ console.error(err); alert('Error uploading files'); }
              }} style={{marginTop:20}}>
                <div>
                  <label>Add files</label>
                  <div onDragOver={onDetailDragOver} onDrop={onDetailDrop} style={{border:'2px dashed #e5e7eb', padding:12, borderRadius:8, background:'#fafafa'}}>
                    <input type="file" multiple onChange={e=>setDetailFiles(Array.from(e.target.files))} />
                    <p style={{margin:6, color:'#6b7280'}}>Drag & drop files here, or click to select</p>
                    {detailFiles && detailFiles.length>0 && (
                      <ul style={{margin:0}}>
                        {detailFiles.map((f,i)=>(<li key={i}>{f.name}</li>))}
                      </ul>
                    )}
                  </div>
                </div>
                <div style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
                  <button type="button" className="cancel-btn" onClick={closeDetails}>Close</button>
                  <button className="save-btn" type="submit">Upload</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .case-files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        
        .case-file-wrapper {
          position: relative;
        }
        
        .case-file-viewer {
          margin: 0;
        }
        
        .delete-file-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        
        .delete-file-btn:hover {
          background: #c82333;
          transform: scale(1.1);
        }
        
        .cases-view .edit-btn {
          background: #CFAE70 !important;
          color: #1B263B !important;
          border: none !important;
          padding: 12px 24px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .cases-view .edit-btn:hover {
          background: #B8965C !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        
        @media (max-width: 768px) {
          .case-files-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
