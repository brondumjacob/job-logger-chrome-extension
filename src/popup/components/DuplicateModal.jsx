import React from 'react';

const DuplicateModal = ({ info, onUpdate, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          <span>⚠️</span>
          Duplicate Found
        </h3>
        <p>You already logged this application:</p>
        
        <div className="existing-info">
          <div><strong>Company:</strong> {info?.company || 'N/A'}</div>
          <div><strong>Role:</strong> {info?.role || 'N/A'}</div>
          <div><strong>Status:</strong> {info?.status || 'Applied'}</div>
          <div><strong>Date:</strong> {info?.date || 'N/A'}</div>
        </div>

        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="update-btn" onClick={onUpdate}>
            Update Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateModal;
