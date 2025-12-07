// popup.js - Handles popup UI and communication with background script

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Job Logger Popup] Initializing...');
  
  // Check authentication status
  checkAuthStatus();
  
  // Request job data from content script
  requestJobData();
  
  // Set up event listeners
  setupEventListeners();
});

// Check if user is authenticated with Google
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    console.log('[Job Logger Popup] Auth status:', response);
    updateAuthUI(response?.authenticated || false);
  } catch (error) {
    console.error('[Job Logger Popup] Auth check error:', error);
    updateAuthUI(false);
  }
}

// Update UI based on authentication status
function updateAuthUI(isAuthenticated) {
  const authSection = document.getElementById('auth-section');
  const connectedBanner = document.getElementById('connected-banner');
  const submitBtn = document.getElementById('submit-btn');
  
  if (isAuthenticated) {
    authSection.style.display = 'none';
    connectedBanner.style.display = 'flex';
    submitBtn.disabled = false;
  } else {
    authSection.style.display = 'block';
    connectedBanner.style.display = 'none';
    submitBtn.disabled = false; // Allow clicking to trigger auth flow
  }
}

// Request job data from content script
async function requestJobData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      console.log('[Job Logger Popup] No active tab');
      return;
    }
    
    console.log('[Job Logger Popup] Requesting data from tab:', tab.url);
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Job Logger Popup] Content script not available:', chrome.runtime.lastError.message);
        return;
      }
      
      if (response?.data) {
        console.log('[Job Logger Popup] Received job data:', response.data);
        populateForm(response.data);
      }
    });
  } catch (error) {
    console.error('[Job Logger Popup] Error requesting job data:', error);
  }
}

// Populate form with scraped data
function populateForm(data) {
  if (data.company) {
    document.getElementById('company').value = data.company;
    document.getElementById('company-badge').style.display = 'inline-block';
  }
  
  if (data.role) {
    document.getElementById('role').value = data.role;
    document.getElementById('role-badge').style.display = 'inline-block';
  }
  
  if (data.location) {
    document.getElementById('location').value = data.location;
    document.getElementById('location-badge').style.display = 'inline-block';
  }
  
  if (data.salary) {
    document.getElementById('salary').value = data.salary;
  }
  
  if (data.workArrangement) {
    const select = document.getElementById('workArrangement');
    for (let option of select.options) {
      if (option.value.toLowerCase() === data.workArrangement.toLowerCase()) {
        option.selected = true;
        break;
      }
    }
  }
  
  if (data.source) {
    const select = document.getElementById('source');
    for (let option of select.options) {
      if (option.value.toLowerCase() === data.source.toLowerCase()) {
        option.selected = true;
        document.getElementById('source-badge').style.display = 'inline-block';
        break;
      }
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Google Sign In button
  document.getElementById('google-signin-btn').addEventListener('click', async () => {
    console.log('[Job Logger Popup] Sign in clicked');
    showStatus('Connecting to Google...', 'info');
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'AUTHENTICATE' });
      console.log('[Job Logger Popup] Auth response:', response);
      
      if (response?.success) {
        updateAuthUI(true);
        hideError();
        showStatus('Connected!', 'success');
      } else {
        showError(response?.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('[Job Logger Popup] Auth error:', error);
      showError('Failed to connect: ' + error.message);
    }
  });
  
  // Disconnect link
  document.getElementById('disconnect-link').addEventListener('click', async () => {
    console.log('[Job Logger Popup] Disconnect clicked');
    try {
      await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
      updateAuthUI(false);
      showStatus('Disconnected', 'info');
    } catch (error) {
      console.error('[Job Logger Popup] Disconnect error:', error);
    }
  });
  
  // Form submission
  document.getElementById('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Job Logger Popup] Form submitted');
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';
    hideError();
    
    // Gather form data
    const formData = {
      company: document.getElementById('company').value.trim(),
      role: document.getElementById('role').value.trim(),
      salary: document.getElementById('salary').value.trim(),
      location: document.getElementById('location').value.trim(),
      workArrangement: document.getElementById('workArrangement').value,
      status: document.getElementById('status').value,
      tier: document.getElementById('tier').value,
      source: document.getElementById('source').value,
      notes: document.getElementById('notes').value.trim(),
      dateApplied: new Date().toLocaleDateString('en-US'),
      url: ''
    };
    
    // Get current URL
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        formData.url = tab.url;
      }
    } catch (err) {
      console.log('[Job Logger Popup] Could not get URL');
    }
    
    console.log('[Job Logger Popup] Sending data:', formData);
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'LOG_APPLICATION', 
        data: formData 
      });
      
      console.log('[Job Logger Popup] Log response:', response);
      
      if (response?.success) {
        document.getElementById('success-banner').style.display = 'block';
        submitBtn.textContent = '✓ Logged!';
        showStatus('Application saved to Google Sheets!', 'success');
        
        // Reset after 2 seconds
        setTimeout(() => {
          document.getElementById('success-banner').style.display = 'none';
          submitBtn.textContent = '📝 Log Application';
          submitBtn.disabled = false;
        }, 2000);
      } else {
        // Check if auth is needed
        if (response?.error?.includes('Not authenticated') || response?.needsAuth) {
          updateAuthUI(false);
          showError('Please sign in with Google first');
        } else {
          showError(response?.error || 'Failed to save application');
        }
        submitBtn.textContent = '📝 Log Application';
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('[Job Logger Popup] Submit error:', error);
      showError('Error: ' + error.message);
      submitBtn.textContent = '📝 Log Application';
      submitBtn.disabled = false;
    }
  });
}

// Show error message
function showError(message) {
  const errorBanner = document.getElementById('error-banner');
  errorBanner.textContent = '⚠️ ' + message;
  errorBanner.style.display = 'block';
}

// Hide error message
function hideError() {
  document.getElementById('error-banner').style.display = 'none';
}

// Show status text
function showStatus(message, type) {
  const statusText = document.getElementById('status-text');
  statusText.textContent = message;
  statusText.style.color = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#6b7280';
}
