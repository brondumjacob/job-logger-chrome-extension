import React from 'react';

const Settings = ({ sheetInfo, onBack, onDisconnect }) => {
  const handleOpenSheet = () => {
    if (sheetInfo?.id && sheetInfo.id !== 'new' && sheetInfo.id !== 'dev-sheet-id') {
      window.open(`https://docs.google.com/spreadsheets/d/${sheetInfo.id}`, '_blank');
    } else {
      alert('Sheet not yet created. Log your first application to create it!');
    }
  };

  const formatLastSynced = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="settings-panel">
      <button className="settings-back" onClick={onBack}>
        ← Back
      </button>

      <div className="settings-section">
        <h3>Connected Sheet</h3>
        <div className="settings-card">
          {sheetInfo ? (
            <>
              <div className="sheet-info">
                <div className="sheet-icon">📊</div>
                <div>
                  <div className="sheet-name">{sheetInfo.name || 'Job Application Tracker'}</div>
                  <div className="sheet-sync">Last synced: {formatLastSynced(sheetInfo.lastSynced)}</div>
                </div>
              </div>
              <div className="sheet-actions">
                <button className="open-btn" onClick={handleOpenSheet}>
                  Open Sheet
                </button>
                <button className="disconnect-btn" onClick={onDisconnect}>
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No sheet connected</p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Defaults</h3>
        <div className="settings-card">
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', marginBottom: '4px' }}>Default Status</label>
            <select style={{ padding: '8px', fontSize: '13px' }} defaultValue="Applied">
              <option>Not Yet Applied</option>
              <option>Applied</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '13px', marginBottom: '4px' }}>Default Tier</label>
            <select style={{ padding: '8px', fontSize: '13px' }} defaultValue="Tier 2">
              <option>Tier 1</option>
              <option>Tier 2</option>
              <option>Tier 3</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-card">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '13px' }}>Show badge on job pages</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '13px' }}>Auto-detect job details</span>
          </label>
        </div>
      </div>

      <div style={{ 
        borderTop: '1px solid #e5e7eb', 
        paddingTop: '16px', 
        marginTop: '16px',
        fontSize: '12px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        <div>Version 0.1.0</div>
        <div style={{ marginTop: '8px' }}>
          <a href="#" style={{ color: '#2e5a8f', marginRight: '16px' }}>Report a Bug</a>
          <a href="#" style={{ color: '#2e5a8f' }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
