/**
 * Background Service Worker
 * Handles Google Sheets API calls, OAuth, and badge updates
 */

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  switch (message.type) {
    case 'SUBMIT_APPLICATION':
      handleSubmitApplication(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response

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
      getAuthToken()
        .then(token => sendResponse({ success: true, token }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

/**
 * Get OAuth token for Google Sheets API
 */
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Submit application to Google Sheets
 */
async function handleSubmitApplication(data) {
  try {
    // Get stored settings
    const settings = await chrome.storage.sync.get(['authToken', 'sheetInfo', 'columnMapping']);
    
    if (!settings.authToken) {
      throw new Error('Not authenticated. Please connect to Google Sheets.');
    }

    const sheetId = settings.sheetInfo?.id;
    
    // If no sheet exists yet, create one
    if (!sheetId || sheetId === 'new') {
      const newSheet = await createNewSheet(settings.authToken);
      await chrome.storage.sync.set({
        sheetInfo: {
          id: newSheet.spreadsheetId,
          name: newSheet.properties.title,
          lastSynced: new Date().toISOString()
        }
      });
      
      // Add the application to the new sheet
      await appendRow(settings.authToken, newSheet.spreadsheetId, data);
    } else {
      // Append to existing sheet
      await appendRow(settings.authToken, sheetId, data);
    }

    // Update last synced time
    await chrome.storage.sync.set({
      sheetInfo: {
        ...settings.sheetInfo,
        lastSynced: new Date().toISOString()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting application:', error);
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
              { userEnteredValue: { stringValue: 'Market Range' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Location' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Work Arrangement' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Source' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Recruiter' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Notes' }, userEnteredFormat: { textFormat: { bold: true } } },
              { userEnteredValue: { stringValue: 'Date Applied' }, userEnteredFormat: { textFormat: { bold: true } } }
            ]
          }]
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
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
    data.marketRange || '',
    data.location || '',
    data.workArrangement || '',
    data.status || 'Applied',
    data.source || '',
    data.recruiter || '',
    data.notes || '',
    data.dateApplied || new Date().toISOString().split('T')[0]
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Applications!A:L:append?valueInputOption=USER_ENTERED`,
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
    throw new Error(error.error?.message || 'Failed to append row');
  }

  return response.json();
}

/**
 * Check for duplicate entry
 */
async function handleCheckDuplicate(company, role) {
  try {
    const settings = await chrome.storage.sync.get(['authToken', 'sheetInfo']);
    
    if (!settings.authToken || !settings.sheetInfo?.id) {
      return null; // No sheet yet, can't be duplicate
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${settings.sheetInfo.id}/values/Applications!A:B`,
      {
        headers: {
          'Authorization': `Bearer ${settings.authToken}`
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
    console.error('Error checking duplicate:', error);
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

console.log('Job Logger background service worker loaded');
