import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  'Not Yet Applied',
  'Applied',
  'Phone Screen',
  'Interview Scheduled',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Ghosted'
];

const TIER_OPTIONS = [
  'Tier 1',
  'Tier 2',
  'Tier 3'
];

const WORK_ARRANGEMENT_OPTIONS = [
  '',
  'Remote',
  'Hybrid',
  'On-site'
];

const SOURCE_OPTIONS = [
  'LinkedIn',
  'Indeed',
  'Glassdoor',
  'Greenhouse',
  'Lever',
  'Workday',
  'Company Website',
  'Recruiter',
  'Referral',
  'Other'
];

const JobForm = ({ initialData, onSubmit, isConnected, onConnectClick }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    tier: 'Tier 2',
    salary: '',
    marketRange: '',
    location: '',
    workArrangement: '',
    status: 'Applied',
    source: '',
    recruiter: '',
    notes: '',
    dateApplied: new Date().toISOString().split('T')[0]
  });

  const [autoDetected, setAutoDetected] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const newData = { ...formData };
      const detected = {};

      if (initialData.company) {
        newData.company = initialData.company;
        detected.company = true;
      }
      if (initialData.role) {
        newData.role = initialData.role;
        detected.role = true;
      }
      if (initialData.location) {
        newData.location = initialData.location;
        detected.location = true;
      }
      if (initialData.salary) {
        newData.salary = initialData.salary;
        detected.salary = true;
      }
      if (initialData.workArrangement) {
        newData.workArrangement = initialData.workArrangement;
        detected.workArrangement = true;
      }
      if (initialData.source) {
        newData.source = initialData.source;
        detected.source = true;
      }

      setFormData(newData);
      setAutoDetected(detected);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear auto-detected flag when user edits
    if (autoDetected[name]) {
      setAutoDetected(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.role) {
      alert('Company and Role are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLabel = (text, required = false, fieldName = null) => (
    <label>
      {text}
      {required && <span className="required">*</span>}
      {fieldName && autoDetected[fieldName] && (
        <span className="auto-detected">✓ Auto-detected</span>
      )}
    </label>
  );

  if (!isConnected) {
    return (
      <div className="content">
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '8px', 
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#92400e'
        }}>
          ⚠️ Connect to Google Sheets to save applications
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {renderLabel('Company', true, 'company')}
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="form-group">
            {renderLabel('Role', true, 'role')}
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>

          <button 
            type="button" 
            className="submit-btn"
            onClick={onConnectClick}
            style={{ background: '#34a853' }}
          >
            🔗 Connect Google Sheets to Save
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="content">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          {renderLabel('Company', true, 'company')}
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="e.g. Acme Corp"
            required
          />
        </div>

        <div className="form-group">
          {renderLabel('Role', true, 'role')}
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g. Senior Software Engineer"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            {renderLabel('Salary', false, 'salary')}
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. $120,000"
            />
          </div>
          <div className="form-group">
            <label>Market Range</label>
            <div className="market-range">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              {formData.marketRange || 'N/A'}
            </div>
          </div>
        </div>

        <div className="form-group">
          {renderLabel('Location', false, 'location')}
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Chicago, IL"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            {renderLabel('Work Arrangement', false, 'workArrangement')}
            <select
              name="workArrangement"
              value={formData.workArrangement}
              onChange={handleChange}
            >
              {WORK_ARRANGEMENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt || 'Select...'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tier</label>
            <select
              name="tier"
              value={formData.tier}
              onChange={handleChange}
            >
              {TIER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            {renderLabel('Source', false, 'source')}
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Recruiter (optional)</label>
          <input
            type="text"
            name="recruiter"
            value={formData.recruiter}
            onChange={handleChange}
            placeholder="e.g. John Smith - Robert Half"
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes..."
            rows="2"
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              Saving...
            </>
          ) : (
            <>
              📝 Log Application
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default JobForm;
