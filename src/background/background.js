/**
 * Background Service Worker
 * Handles Google Sheets API calls, OAuth, and badge updates
 */

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Job Logger Background] Received message:', message.type);

  switch (message.type) {
    case 'CHECK_AUTH':
      checkAuthentication()
        .then(result => sendResponse(result))
        .catch(error => {
          console.error('[Job Logger Background] Check auth error:', error);
          sendResponse({ authenticated: false, error: error.message });
        });
      return true; // Keep channel open for async response

    case 'AUTHENTICATE':
      authenticate()
        .then(result => sendResponse(result))
        .catch(error => {
          console.error('[Job Logger Background] Auth error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'DISCONNECT':
      disconnect()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'LOG_APPLICATION':
      handleLogApplication(message.data)
        .then(result => sendResponse(result))
        .catch(error => {
          console.error('[Job Logger Background] Log error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'SUBMIT_APPLICATION':
      handleLogApplication(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CHECK_DUPLICATE':
      handleCheckDuplicate(message.company, message.role)
        .then(result => sendResponse({ success: true, isDuplicate: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'UPDATE_BADGE':
      updateBadge(message.show);
      sendResponse({ success: true });
      return false;

    case 'GET_AUTH_TOKEN':
      getAuthToken(true)
        .then(token => sendResponse({ success: true, token }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.log('[Job Logger Background] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

/**
 * Check if user is authenticated (non-interactive)
 */
async function checkAuthentication() {
  try {
    const token = await getAuthToken(false); // Non-interactive
    return { authenticated: !!token, token };
  } catch (error) {
    console.log('[Job Logger Background] Not authenticated:', error.message);
    return { authenticated: false };
  }
}

/**
 * Authenticate with Google (interactive)
 */
async function authenticate() {
  try {
    console.log('[Job Logger Background] Starting interactive authentication...');
    const token = await getAuthToken(true); // Interactive
    console.log('[Job Logger Background] Got token:', token ? 'yes' : 'no');
    
    if (token) {
      // Store the token
      await chrome.storage.sync.set({ authToken: token });
      return { success: true, token };
    } else {
      return { success: false, error: 'No token received' };
    }
  } catch (error) {
    console.error('[Job Logger Background] Authentication failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect from Google
 */
async function disconnect() {
  try {
    // Get current token
    const token = await getAuthToken(false);
    
    if (token) {
      // Revoke the token
      await chrome.identity.removeCachedAuthToken({ token });
    }
    
    // Clear stored data
    await chrome.storage.sync.remove(['authToken', 'sheetInfo']);
    
    return { success: true };
  } catch (error) {
    console.error('[Job Logger Background] Disconnect error:', error);
    // Still clear storage even if revoke fails
    await chrome.storage.sync.remove(['authToken', 'sheetInfo']);
    return { success: true };
  }
}

/**
 * Get OAuth token for Google Sheets API
 */
function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    console.log('[Job Logger Background] Getting auth token, interactive:', interactive);
    
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        console.log('[Job Logger Background] getAuthToken error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error('No token received'));
      } else {
        console.log('[Job Logger Background] Token received successfully');
        resolve(token);
      }
    });
  });
}

/**
 * Handle logging an application
 */
async function handleLogApplication(data) {
  try {
    console.log('[Job Logger Background] Logging application:', data);
    
    // Get token
    let token;
    try {
      token = await getAuthToken(false);
    } catch (e) {
      console.log('[Job Logger Background] No auth token, need to authenticate');
      return { success: false, needsAuth: true, error: 'Not authenticated. Please sign in with Google.' };
    }
    
    if (!token) {
      return { success: false, needsAuth: true, error: 'Not authenticated. Please sign in with Google.' };
    }

    // Get stored sheet info
    const settings = await chrome.storage.sync.get(['sheetInfo']);
    let sheetId = settings.sheetInfo?.id;

    // If no sheet exists yet, create one
    if (!sheetId) {
      console.log('[Job Logger Background] Creating new sheet...');
      const newSheet = await createNewSheet(token);
      sheetId = newSheet.spreadsheetId;
      
      await chrome.storage.sync.set({
        sheetInfo: {
          id: sheetId,
          name: newSheet.properties.title,
          url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
          lastSynced: new Date().toISOString()
        }
      });
      console.log('[Job Logger Background] Created new sheet:', sheetId);
    }

    // Append the row
    console.log('[Job Logger Background] Appending row to sheet:', sheetId);
    await appendRow(token, sheetId, data);

    // Update last synced time
    const currentSettings = await chrome.storage.sync.get(['sheetInfo']);
    await chrome.storage.sync.set({
      sheetInfo: {
        ...currentSettings.sheetInfo,
        lastSynced: new Date().toISOString()
      }
    });

    console.log('[Job Logger Background] Application logged successfully');
    return { success: true };
  } catch (error) {
    console.error('[Job Logger Background] Error logging application:', error);
    
    // Check if it's an auth error
    if (error.message.includes('401') || error.message.includes('auth') || error.message.includes('token')) {
      // Clear cached token and ask for re-auth
      try {
        const token = await getAuthToken(false);
        if (token) {
          await chrome.identity.removeCachedAuthToken({ token });
        }
      } catch (e) {}
      
      return { success: false, needsAuth: true, error: 'Session expired. Please sign in again.' };
    }
    
    throw error;
  }
}

/**
 * Create a new Google Sheet with template
 */
async function createNewSheet(token) {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Job Application Tracker'
      },
      sheets: [{
        properties: {
          title: 'Applications',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: 'Company' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Role' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Tier' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Salary' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Location' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Work Arrangement' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Source' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Notes' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Date Applied' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'URL' }, userEnteredFormat: { textFormat: { bold: true } } }
            ]
          }]
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Job Logger Background] Sheet creation error:', error);
    throw new Error(error.error?.message || 'Failed to create sheet');
  }

  return response.json();
}

/**
 * Append a row to the sheet
 */
async function appendRow(token, sheetId, data) {
  const rowData = [
    data.company || '',
    data.role || '',
    data.tier || 'Tier 2',
    data.salary || '',
    data.location || '',
    data.workArrangement || '',
    data.status || 'Applied',
    data.source || '',
    data.notes || '',
    data.dateApplied || new Date().toLocaleDateString('en-US'),
    data.url || ''
  ];

  console.log('[Job Logger Background] Appending row:', rowData);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Applications!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('[Job Logger Background] Append row error:', error);
    throw new Error(error.error?.message || 'Failed to append row');
  }

  return response.json();
}

/**
 * Check for duplicate entry
 */
async function handleCheckDuplicate(company, role) {
  try {
    const token = await getAuthToken(false);
    const settings = await chrome.storage.sync.get(['sheetInfo']);
    
    if (!token || !settings.sheetInfo?.id) {
      return null; // No sheet yet, can't be duplicate
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${settings.sheetInfo.id}/values/Applications!A:B`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row, check for matching company + role
    for (let i = 1; i < rows.length; i++) {
      const [rowCompany, rowRole] = rows[i];
      if (
        rowCompany?.toLowerCase() === company?.toLowerCase() &&
        rowRole?.toLowerCase() === role?.toLowerCase()
      ) {
        return {
          rowIndex: i + 1, // 1-indexed for Sheets API
          company: rowCompany,
          role: rowRole
        };
      }
    }

    return null; // No duplicate found
  } catch (error) {
    console.error('[Job Logger Background] Error checking duplicate:', error);
    return null;
  }
}

/**
 * Update extension badge
 */
function updateBadge(show) {
  if (show) {
    chrome.action.setBadgeText({ text: '+' });
    chrome.action.setBadgeBackgroundColor({ color: '#059669' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Listen for tab updates to detect job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isJobPage = isJobPostingPage(tab.url);
    
    if (isJobPage) {
      chrome.action.setBadgeText({ tabId, text: '+' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#059669' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});

/**
 * Check if URL is a job posting page
 */
function isJobPostingPage(url) {
  const jobPatterns = [
    /linkedin\.com\/jobs\/view/,
    /indeed\.com\/viewjob/,
    /indeed\.com\/jobs/,
    /boards\.greenhouse\.io\/.+\/jobs/,
    /jobs\.lever\.co\/.+/,
    /myworkdayjobs\.com\/.+\/job/,
    /glassdoor\.com\/job-listing/
  ];

  return jobPatterns.some(pattern => pattern.test(url));
}

console.log('[Job Logger Background] Service worker loaded');
