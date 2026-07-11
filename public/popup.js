/**
 * popup.js — Vanilla JS popup controller
 *
 * DEV_MODE = true  → skip OAuth, show form immediately
 * DEV_MODE = false → check auth, show sign-in if needed
 *
 * All data persistence is delegated to background.js via chrome.runtime.sendMessage.
 */

const DEV_MODE = true; // Must match background.js DEV_MODE

// State for duplicate resolution
let pendingFormData = null;
let pendingDuplicate = null;

// Mirrors manifest.json's content_scripts.matches. Duplicated here (rather than
// imported) because popup.js is a classic, non-module script — content scripts
// only run on these URLs, so a messaging failure elsewhere is expected/silent,
// while a failure here means the content script should have loaded but didn't
// (e.g. tab was open before the extension was installed/reloaded).
const SUPPORTED_JOB_URL_PATTERNS = [
  /^https:\/\/www\.linkedin\.com\/jobs\//,
  /^https:\/\/www\.indeed\.com\//,
  /^https:\/\/boards\.greenhouse\.io\//,
  /^https:\/\/jobs\.lever\.co\//,
  /^https:\/\/[^/]+\.myworkdayjobs\.com\//,
  /^https:\/\/www\.glassdoor\.com\/job-listing\//,
];

function isSupportedJobPage(url) {
  return !!url && SUPPORTED_JOB_URL_PATTERNS.some((re) => re.test(url));
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Job Logger Popup] Initializing...');

  if (DEV_MODE) {
    document.getElementById('dev-mode-badge').style.display = 'inline-block';
    showForm();
  } else {
    await checkAuthStatus();
  }

  await populateTabUrl();
  await requestJobData();
  setupEventListeners();
  await loadSheetInfo();
});

// ============================================
// AUTH
// ============================================

async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    updateAuthUI(response?.authenticated || false);
  } catch (err) {
    console.error('[Job Logger Popup] Auth check error:', err);
    updateAuthUI(false);
  }
}

function showForm() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('connected-banner').style.display = 'none';
}

function updateAuthUI(isAuthenticated) {
  const authSection = document.getElementById('auth-section');
  const connectedBanner = document.getElementById('connected-banner');
  if (isAuthenticated) {
    authSection.style.display = 'none';
    connectedBanner.style.display = 'flex';
  } else {
    authSection.style.display = 'block';
    connectedBanner.style.display = 'none';
  }
}

// ============================================
// TAB / AUTO-DETECT
// ============================================

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  } catch (e) {
    return null;
  }
}

async function populateTabUrl() {
  const tab = await getActiveTab();
  if (tab?.url) {
    const urlInput = document.getElementById('url');
    if (urlInput) {
      urlInput.value = tab.url;
      document.getElementById('url-badge').style.display = 'inline-block';
    }
  }
}

async function requestJobData() {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Job Logger Popup] Content script not available:', chrome.runtime.lastError.message);
      // On a page we should have been able to scrape, the content script simply
      // wasn't injected — most commonly because the tab was already open before
      // the extension was installed/reloaded. Surface that instead of leaving
      // the user staring at a blank form that looks like a failed scrape.
      if (isSupportedJobPage(tab.url)) {
        showScrapeWarning("Couldn't read this page — try refreshing it, then reopen the logger.");
      } else {
        hideScrapeWarning();
      }
      return;
    }
    hideScrapeWarning();
    if (response?.data) {
      populateForm(response.data);
    }
  });
}

function populateForm(data) {
  // populateForm only ever runs after a real response from the content
  // script (see requestJobData above), so we're on a page it attempted to
  // scrape — an empty field here means detection failed, not "not attempted."
  // Surface that distinction instead of leaving a scrape failure looking
  // identical to an untouched field.
  applyAutoField('company', data.company);
  applyAutoField('role', data.role);
  applyAutoField('location', data.location);
  applyAutoField('salary', data.salary);

  if (data.workArrangement) {
    selectOption('workArrangement', data.workArrangement);
  }
  if (data.source) {
    const matched = selectOption('source', data.source);
    if (matched) show('source-badge');
  }
  // URL already populated from tab URL, only override if scraper gives a better one
  if (data.url && data.url !== document.getElementById('url').value) {
    setValue('url', data.url);
  }
}

// ============================================
// FORM DATA
// ============================================

function collectFormData() {
  return {
    company:         document.getElementById('company').value.trim(),
    role:            document.getElementById('role').value.trim(),
    status:          document.getElementById('status').value,
    tier:            document.getElementById('tier').value,
    salary:          document.getElementById('salary').value.trim(),
    location:        document.getElementById('location').value.trim(),
    workArrangement: document.getElementById('workArrangement').value,
    source:          document.getElementById('source').value,
    recruiter:       document.getElementById('recruiter').value.trim(),
    keyDetails:      document.getElementById('keyDetails').value.trim(),
    nextSteps:       document.getElementById('nextSteps').value.trim(),
    notes:           document.getElementById('notes').value.trim(),
    url:             document.getElementById('url').value.trim(),
    dateApplied:     new Date().toLocaleDateString('en-US')
  };
}

// ============================================
// SUBMIT
// ============================================

async function submitApplication(formData) {
  setSubmitState(true, 'Saving...');
  hideError();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'LOG_APPLICATION',
      data: formData
    });

    if (response?.success) {
      showToast('Application logged!');
      document.getElementById('success-banner').textContent = 'Application logged successfully!';
      document.getElementById('success-banner').style.display = 'block';
      setSubmitState(false, 'Log Application');
      setTimeout(() => {
        document.getElementById('success-banner').style.display = 'none';
      }, 3000);
    } else if (response?.needsAuth) {
      updateAuthUI(false);
      showError('Please sign in with Google first.');
      setSubmitState(false, 'Log Application');
    } else {
      showError(response?.error || 'Failed to save application.');
      setSubmitState(false, 'Log Application');
    }
  } catch (err) {
    console.error('[Job Logger Popup] Submit error:', err);
    showError('Error: ' + err.message);
    setSubmitState(false, 'Log Application');
  }
}

// ============================================
// DUPLICATE FLOW
// ============================================

function showDuplicateModal(duplicate, formData) {
  pendingDuplicate = duplicate;
  pendingFormData = formData;

  document.getElementById('dup-company').textContent = duplicate.company;
  document.getElementById('dup-role').textContent = duplicate.role;

  const meta = [];
  if (duplicate.status) meta.push('Status: ' + duplicate.status);
  if (duplicate.date) meta.push('Applied: ' + duplicate.date);
  document.getElementById('dup-meta').textContent = meta.join('  ·  ');

  document.getElementById('duplicate-modal').style.display = 'block';
}

function hideDuplicateModal() {
  document.getElementById('duplicate-modal').style.display = 'none';
  pendingDuplicate = null;
  pendingFormData = null;
}

// ============================================
// SETTINGS
// ============================================

async function loadSheetInfo() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SHEET_INFO' });
    const info = response?.info;
    const el = document.getElementById('sheet-info');
    const disconnectBtn = document.getElementById('btn-disconnect');
    if (info) {
      const link = info.url && info.url !== '#'
        ? `<a href="${info.url}" target="_blank">${info.name}</a>`
        : `<strong>${info.name}</strong>`;
      const rows = info.rowCount !== undefined ? ` · ${info.rowCount} rows` : '';
      const synced = info.lastSynced
        ? ` · Synced ${new Date(info.lastSynced).toLocaleTimeString()}`
        : '';
      el.innerHTML = `Connected to ${link}${rows}${synced}`;
      disconnectBtn.disabled = false;
    } else {
      el.textContent = 'Not connected to Google Sheets.';
      // Nothing to disconnect — keep the button visible but inert so the
      // panel never asserts a connection that doesn't exist.
      disconnectBtn.disabled = true;
    }
  } catch (e) {
    // ignore
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Settings toggle
  document.getElementById('settings-btn').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') loadSheetInfo();
  });

  // Disconnect (settings panel)
  document.getElementById('btn-disconnect').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
    updateAuthUI(false);
    document.getElementById('settings-panel').style.display = 'none';
    showToast('Disconnected from Google Sheets.');
    loadSheetInfo();
  });

  // Google sign-in
  document.getElementById('google-signin-btn').addEventListener('click', async () => {
    showStatus('Connecting to Google...', 'info');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'AUTHENTICATE' });
      if (response?.success) {
        updateAuthUI(true);
        hideError();
        showToast('Connected to Google Sheets!');
        loadSheetInfo();
      } else {
        showError(response?.error || 'Authentication failed.');
      }
    } catch (err) {
      showError('Failed to connect: ' + err.message);
    }
  });

  // Disconnect link (in connected banner)
  document.getElementById('disconnect-link').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
    updateAuthUI(false);
    showToast('Disconnected.');
    loadSheetInfo();
  });

  // Form submission
  document.getElementById('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = collectFormData();

    if (!formData.company || !formData.role) {
      showError('Company and Role are required.');
      return;
    }

    // Check for duplicates
    setSubmitState(true, 'Checking...');
    hideError();
    try {
      const dupResponse = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        company: formData.company,
        role: formData.role
      });

      setSubmitState(false, 'Log Application');

      if (dupResponse?.success && dupResponse.isDuplicate) {
        showDuplicateModal(dupResponse.isDuplicate, formData);
      } else {
        await submitApplication(formData);
      }
    } catch (err) {
      setSubmitState(false, 'Log Application');
      showError('Error: ' + err.message);
    }
  });

  // Duplicate modal: Update existing
  document.getElementById('btn-update-existing').addEventListener('click', async () => {
    const dup = pendingDuplicate;
    const data = pendingFormData;
    hideDuplicateModal();

    if (!dup || !data) return;
    setSubmitState(true, 'Updating...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_EXISTING',
        rowIndex: dup.rowIndex,
        data
      });

      setSubmitState(false, 'Log Application');
      if (response?.success) {
        showToast('Entry updated!');
        document.getElementById('success-banner').textContent = 'Entry updated successfully!';
        document.getElementById('success-banner').style.display = 'block';
        setTimeout(() => { document.getElementById('success-banner').style.display = 'none'; }, 3000);
      } else {
        showError(response?.error || 'Failed to update entry.');
      }
    } catch (err) {
      setSubmitState(false, 'Log Application');
      showError('Error: ' + err.message);
    }
  });

  // Duplicate modal: Log anyway
  document.getElementById('btn-log-anyway').addEventListener('click', async () => {
    const data = pendingFormData;
    hideDuplicateModal();
    if (data) await submitApplication(data);
  });

  // Duplicate modal: Cancel
  document.getElementById('btn-cancel-dup').addEventListener('click', () => {
    hideDuplicateModal();
    setSubmitState(false, 'Log Application');
  });
}

// ============================================
// UI HELPERS
// ============================================

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function applyAutoField(fieldId, value) {
  const badge = document.getElementById(fieldId + '-badge');
  if (value) {
    setValue(fieldId, value);
    if (badge) {
      badge.textContent = 'Auto';
      badge.classList.remove('auto-badge--missing');
      badge.style.display = 'inline-block';
    }
  } else if (badge) {
    badge.textContent = 'Not found';
    badge.classList.add('auto-badge--missing');
    badge.style.display = 'inline-block';
  }
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'inline-block';
}

function selectOption(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select) return false;
  const lower = value.toLowerCase();
  for (const opt of select.options) {
    if (opt.value.toLowerCase() === lower) {
      opt.selected = true;
      return true;
    }
  }
  return false;
}

function setSubmitState(disabled, text) {
  const btn = document.getElementById('submit-btn');
  btn.disabled = disabled;
  btn.textContent = text;
}

function showError(message) {
  const el = document.getElementById('error-banner');
  el.textContent = message;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('error-banner').style.display = 'none';
}

function showScrapeWarning(message) {
  const el = document.getElementById('scrape-warning');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function hideScrapeWarning() {
  const el = document.getElementById('scrape-warning');
  if (el) el.style.display = 'none';
}

function showStatus(message, type) {
  const el = document.getElementById('status-text');
  el.textContent = message;
  el.style.color = type === 'success' ? '#00582c' : type === 'error' ? '#a50013' : '#766863';
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}
