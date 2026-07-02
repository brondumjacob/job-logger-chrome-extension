# Google Cloud Setup Guide

This guide walks you through setting up Google Cloud credentials for the Job Application Logger extension.

## Dev Mode Quick Start (No OAuth Required)

Want to test the extension immediately without Google Cloud setup?

1. Make sure `DEV_MODE = true` in both:
   - `src/background/background.js`
   - `public/popup.js`
2. Build and load the extension (see below)
3. Click the extension icon — the form appears immediately, no sign-in needed
4. Submitted applications are saved to `chrome.storage.local` (visible in DevTools → Application → Storage → Local)

To switch to production (Google Sheets), set `DEV_MODE = false` in both files and complete the setup below.

---

## Build & Load

```bash
npm install
npm run build
# Then in Chrome: chrome://extensions/ → Developer mode → Load unpacked → select dist/
```

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top left) → **New Project**
3. Name it: `Job Application Logger`
4. Click **Create**
5. Wait for the project to be created, then select it

## Step 2: Enable Google Sheets API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on **Google Sheets API**
4. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace org)
3. Click **Create**
4. Fill in:
   - **App name**: Job Application Logger
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes**
   - Search for `spreadsheets`
   - Check `https://www.googleapis.com/auth/spreadsheets`
   - Click **Update**
7. Click **Save and Continue** through remaining screens
8. Under **Test users**, add your Google account

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Chrome Extension**
4. Name: `Job Logger Extension`
5. **Item ID**: You'll need your extension ID:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load your unpacked `dist/` extension
   - Copy the **ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
6. Paste the extension ID
7. Click **Create**
8. **Copy the Client ID** (looks like: `123456789-abcdef.apps.googleusercontent.com`)

## Step 5: Update manifest.json

Open `manifest.json` and update the `oauth2` section:

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

Then set `DEV_MODE = false` in `src/background/background.js` and `public/popup.js`, rebuild, and reload the extension.

## Step 6: Reload Extension

1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension
3. Click the extension icon — it should now show "Sign in with Google"

---

## Column Layout (A–N)

The auto-created Google Sheet uses this column layout:

| Col | Field |
|-----|-------|
| A | Status |
| B | Date Applied |
| C | Company |
| D | Role |
| E | Tier |
| F | Salary Range |
| G | Location |
| H | Work Arrangement |
| I | Source |
| J | Recruiter |
| K | Key Details |
| L | Next Steps |
| M | Notes |
| N | URL |

---

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure the extension ID in Google Cloud matches your actual extension ID
- Rebuild and reload the extension after updating `manifest.json`

### "This app isn't verified"
- During development, this is expected
- Click **Advanced** → **Go to Job Application Logger (unsafe)**
- This warning goes away after publishing to Chrome Web Store

### "Error: redirect_uri_mismatch"
- The extension ID changed (happens when you reload unpacked extensions)
- Update the Item ID in Google Cloud Console to match the new ID

### Extension ID changes on every reload
- This happens if you don't set a fixed extension key in `manifest.json`
- To pin the ID: add a `"key"` field with your extension's public key (find it in `chrome://extensions/` → Details → Extension ID area, or generate via the Chrome CRX packing tool)
