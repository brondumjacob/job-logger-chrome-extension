import React, { useState, useEffect } from 'react';
import JobForm from './components/JobForm';
import Setup from './components/Setup';
import Settings from './components/Settings';
import DuplicateModal from './components/DuplicateModal';
import Toast from './components/Toast';

const App = () => {
  const [view, setView] = useState('loading'); // 'loading', 'setup', 'form', 'settings'
  const [isConnected, setIsConnected] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [sheetInfo, setSheetInfo] = useState(null);

  useEffect(() => {
    // Check if user has completed setup
    checkSetupStatus();
    // Try to get job data from current tab
    fetchJobDataFromTab();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check chrome.storage for setup status
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['setupComplete', 'sheetInfo'], (result) => {
          if (result.setupComplete && result.sheetInfo) {
            setIsConnected(true);
            setSheetInfo(result.sheetInfo);
            setView('form');
          } else {
            setView('setup');
          }
        });
      } else {
        // Development mode - simulate connected state
        console.log('Running in development mode');
        setView('form');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setView('setup');
    }
  };

  const fetchJobDataFromTab = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to get job data
        chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' }, (response) => {
          if (response && response.success) {
            setJobData(response.data);
          }
        });
      } else {
        // Development mode - use sample data
        setJobData({
          company: 'Sample Company',
          role: 'Software Engineer',
          location: 'Chicago, IL',
          salary: '',
          workArrangement: 'Hybrid',
          source: 'LinkedIn',
          autoDetected: true
        });
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.identity) {
        // Real Chrome extension OAuth flow
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            console.error('Auth error:', chrome.runtime.lastError);
            showToast('Failed to connect to Google', 'error');
            return;
          }
          
          // Store token and mark setup as complete
          chrome.storage.sync.set({
            authToken: token,
            setupComplete: true,
            sheetInfo: {
              name: 'Job Application Tracker',
              id: 'new',
              lastSynced: new Date().toISOString()
            }
          }, () => {
            setIsConnected(true);
            setView('form');
            showToast('Connected to Google Sheets!', 'success');
          });
        });
      } else {
        // Development mode - simulate connection
        console.log('Development mode: Simulating Google connection');
        setIsConnected(true);
        setSheetInfo({
          name: 'Job Application Tracker',
          id: 'dev-sheet-id',
          lastSynced: new Date().toISOString()
        });
        setView('form');
        showToast('Connected to Google Sheets!', 'success');
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      showToast('Failed to connect', 'error');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      // Check for duplicates first
      const isDuplicate = await checkForDuplicate(formData.company, formData.role);
      
      if (isDuplicate) {
        setDuplicateInfo(isDuplicate);
        setShowDuplicateModal(true);
        return;
      }

      // Submit to Google Sheets
      await submitToSheets(formData);
      showToast('Application logged!', 'success');
    } catch (error) {
      console.error('Error submitting:', error);
      showToast('Failed to log application', 'error');
    }
  };

  const checkForDuplicate = async (company, role) => {
    // TODO: Implement actual duplicate check against Google Sheets
    // For now, return null (no duplicate)
    return null;
  };

  const submitToSheets = async (formData) => {
    // TODO: Implement actual Google Sheets submission
    console.log('Submitting to sheets:', formData);
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'SUBMIT_APPLICATION',
          data: formData
        }, (response) => {
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Failed to submit'));
          }
        });
      });
    }
    
    // Development mode - simulate success
    return Promise.resolve({ success: true });
  };

  const handleUpdateExisting = async () => {
    // TODO: Implement update existing entry
    setShowDuplicateModal(false);
    showToast('Entry updated!', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDisconnect = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.clear(() => {
        setIsConnected(false);
        setSheetInfo(null);
        setView('setup');
      });
    } else {
      setIsConnected(false);
      setSheetInfo(null);
      setView('setup');
    }
  };

  if (view === 'loading') {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="header">
        <h1>Job Application Logger</h1>
        {view === 'form' && (
          <button onClick={() => setView('settings')} title="Settings">
            ⚙️
          </button>
        )}
      </div>

      {/* Main Content */}
      {view === 'setup' && (
        <Setup onConnect={handleGoogleConnect} />
      )}

      {view === 'form' && (
        <JobForm 
          initialData={jobData} 
          onSubmit={handleSubmit}
          isConnected={isConnected}
          onConnectClick={() => setView('setup')}
        />
      )}

      {view === 'settings' && (
        <Settings 
          sheetInfo={sheetInfo}
          onBack={() => setView('form')}
          onDisconnect={handleDisconnect}
        />
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <DuplicateModal 
          info={duplicateInfo}
          onUpdate={handleUpdateExisting}
          onCancel={() => setShowDuplicateModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} />
      )}
    </>
  );
};

export default App;
