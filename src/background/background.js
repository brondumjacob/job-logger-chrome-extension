/**
 * Background Service Worker
 * Handles Google Sheets API calls, OAuth, and badge updates.
 *
 * DEV_MODE = true  → uses chrome.storage.local (no OAuth needed)
 * DEV_MODE = false → uses Google Sheets API via OAuth
 */

import { DEV_MODE, UNIFIED_COLUMNS } from '../shared/constants.js';

const MOCK_STORAGE_KEY = 'mockRows';
const MOCK_SHEET_INFO = {
  id: 'dev-mock',
  name: 'Job Application Tracker (Dev)',
  url: '#',
  lastSynced: null
};

// ============================================
// MESSAGE ROUTER
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Job Logger Background] Message:', message.type, DEV_MODE ? '(DEV)' : '(PROD)');

  switch (message.type) {
    case 'CHECK_AUTH':
      if (DEV_MODE) {
        sendResponse({ authenticated: true, devMode: true });
        return false;
      }
      checkAuthentication()
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ authenticated: false, error: err.message }));
      return true;

    case 'AUTHENTICATE':
      if (DEV_MODE) {
        sendResponse({ success: true, devMode: true });
        return false;
      }
      authenticate()
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'DISCONNECT':
      if (DEV_MODE) {
        chrome.storage.local.remove(MOCK_STORAGE_KEY, () => sendResponse({ success: true }));
        return true;
      }
      disconnect()
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'LOG_APPLICATION':
    case 'SUBMIT_APPLICATION':
      handleLogApplication(message.data)
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'CHECK_DUPLICATE':
      handleCheckDuplicate(message.company, message.role)
        .then(r => sendResponse({ success: true, isDuplicate: r }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'UPDATE_EXISTING':
      handleUpdateExisting(message.rowIndex, message.data)
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_SHEET_INFO':
      getSheetInfo()
        .then(r => sendResponse({ success: true, info: r }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'UPDATE_BADGE':
      updateBadge(message.show);
      sendResponse({ success: true });
      return false;

    default:
      console.log('[Job Logger Background] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// ============================================
// SHEET INFO
// ============================================

async function getSheetInfo() {
  if (DEV_MODE) {
    const data = await chrome.storage.local.get(MOCK_STORAGE_KEY);
    const rows = data[MOCK_STORAGE_KEY] || [];
    return { ...MOCK_SHEET_INFO, rowCount: rows.length };
  }
  const settings = await chrome.storage.sync.get(['sheetInfo']);
  return settings.sheetInfo || null;
}

// ============================================
// LOG APPLICATION
// ============================================

async function handleLogApplication(data) {
  if (DEV_MODE) {
    return mockAppendRow(data);
  }

  let token;
  try {
    token = await getAuthToken(false);
  } catch (e) {
    return { success: false, needsAuth: true, error: 'Not authenticated. Please sign in with Google.' };
  }

  const settings = await chrome.storage.sync.get(['sheetInfo']);
  let sheetId = settings.sheetInfo?.id;

  if (!sheetId) {
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
  }

  await appendRow(token, sheetId, data);

  const current = await chrome.storage.sync.get(['sheetInfo']);
  await chrome.storage.sync.set({
    sheetInfo: { ...current.sheetInfo, lastSynced: new Date().toISOString() }
  });

  return { success: true };
}

// ============================================
// CHECK DUPLICATE
// ============================================

async function handleCheckDuplicate(company, role) {
  if (!company || !role) return null;

  if (DEV_MODE) {
    return mockCheckDuplicate(company, role);
  }

  try {
    const token = await getAuthToken(false);
    const settings = await chrome.storage.sync.get(['sheetInfo']);
    if (!token || !settings.sheetInfo?.id) return null;

    // Read columns A:D (status, dateApplied, company, role)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${settings.sheetInfo.id}/values/Applications!A:D`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const rows = data.values || [];

    for (let i = 1; i < rows.length; i++) {
      const [rowStatus, rowDate, rowCompany, rowRole] = rows[i];
      if (
        rowCompany?.toLowerCase() === company.toLowerCase() &&
        rowRole?.toLowerCase() === role.toLowerCase()
      ) {
        return {
          rowIndex: i + 1, // 1-indexed for Sheets API
          company: rowCompany,
          role: rowRole,
          status: rowStatus || '',
          date: rowDate || ''
        };
      }
    }
    return null;
  } catch (err) {
    console.error('[Job Logger Background] Duplicate check error:', err);
    return null;
  }
}

// ============================================
// UPDATE EXISTING
// ============================================

async function handleUpdateExisting(rowIndex, data) {
  if (DEV_MODE) {
    return mockUpdateRow(rowIndex, data);
  }

  try {
    const token = await getAuthToken(false);
    const settings = await chrome.storage.sync.get(['sheetInfo']);
    if (!token || !settings.sheetInfo?.id) {
      return { success: false, error: 'Not connected to Google Sheets' };
    }

    const rowData = buildRowArray(data);
    const range = `Applications!A${rowIndex}:N${rowIndex}`;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${settings.sheetInfo.id}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [rowData] })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update row');
    }

    return { success: true };
  } catch (err) {
    console.error('[Job Logger Background] Update existing error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// GOOGLE SHEETS API (PRODUCTION)
// ============================================

async function createNewSheet(token) {
  const headers = UNIFIED_COLUMNS.map(col => ({
    userEnteredValue: { stringValue: col.header },
    userEnteredFormat: { textFormat: { bold: true } }
  }));

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: 'Job Application Tracker' },
      sheets: [{
        properties: {
          title: 'Applications',
          gridProperties: { frozenRowCount: 1 }
        },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{ values: headers }]
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

async function appendRow(token, sheetId, data) {
  const rowData = buildRowArray(data);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Applications!A:N:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [rowData] })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to append row');
  }

  return response.json();
}

// Build row array matching UNIFIED_COLUMNS order (A-N)
function buildRowArray(data) {
  return [
    data.status || 'Applied',                              // A
    data.dateApplied || new Date().toLocaleDateString('en-US'), // B
    data.company || '',                                    // C
    data.role || '',                                       // D
    data.tier || 'Tier 2',                                 // E
    data.salary || '',                                     // F
    data.location || '',                                   // G
    data.workArrangement || '',                            // H
    data.source || '',                                     // I
    data.recruiter || '',                                  // J
    data.keyDetails || '',                                 // K
    data.nextSteps || '',                                  // L
    data.notes || '',                                      // M
    data.url || ''                                         // N
  ];
}

// ============================================
// MOCK STORAGE (DEV MODE)
// ============================================

async function getMockRows() {
  const data = await chrome.storage.local.get(MOCK_STORAGE_KEY);
  return data[MOCK_STORAGE_KEY] || [];
}

async function saveMockRows(rows) {
  await chrome.storage.local.set({ [MOCK_STORAGE_KEY]: rows });
}

async function mockAppendRow(data) {
  const rows = await getMockRows();
  rows.push(buildRowArray(data));
  await saveMockRows(rows);
  console.log('[Job Logger Background] Mock row appended. Total rows:', rows.length);
  return { success: true };
}

async function mockCheckDuplicate(company, role) {
  const rows = await getMockRows();
  // Indices based on UNIFIED_COLUMNS: C=company(2), D=role(3), A=status(0), B=date(1)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowCompany = row[2] || '';
    const rowRole = row[3] || '';
    if (
      rowCompany.toLowerCase() === company.toLowerCase() &&
      rowRole.toLowerCase() === role.toLowerCase()
    ) {
      return {
        rowIndex: i, // 0-indexed for local storage
        company: rowCompany,
        role: rowRole,
        status: row[0] || '',
        date: row[1] || ''
      };
    }
  }
  return null;
}

async function mockUpdateRow(rowIndex, data) {
  const rows = await getMockRows();
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return { success: false, error: 'Row not found' };
  }
  rows[rowIndex] = buildRowArray(data);
  await saveMockRows(rows);
  console.log('[Job Logger Background] Mock row updated at index:', rowIndex);
  return { success: true };
}

// ============================================
// OAUTH (PRODUCTION ONLY)
// ============================================

async function checkAuthentication() {
  try {
    const token = await getAuthToken(false);
    return { authenticated: !!token, token };
  } catch (e) {
    return { authenticated: false };
  }
}

async function authenticate() {
  try {
    const token = await getAuthToken(true);
    if (token) {
      await chrome.storage.sync.set({ authToken: token });
      return { success: true, token };
    }
    return { success: false, error: 'No token received' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function disconnect() {
  try {
    const token = await getAuthToken(false);
    if (token) await chrome.identity.removeCachedAuthToken({ token });
  } catch (e) {}
  await chrome.storage.sync.remove(['authToken', 'sheetInfo']);
  return { success: true };
}

function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error('No token received'));
      } else {
        resolve(token);
      }
    });
  });
}

// ============================================
// BADGE
// ============================================

function updateBadge(show) {
  if (show) {
    chrome.action.setBadgeText({ text: '+' });
    chrome.action.setBadgeBackgroundColor({ color: '#059669' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isJobPostingPage(tab.url)) {
      chrome.action.setBadgeText({ tabId, text: '+' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#059669' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});

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
  return jobPatterns.some(p => p.test(url));
}

console.log(`[Job Logger Background] Service worker loaded (${DEV_MODE ? 'DEV' : 'PROD'} mode)`);
