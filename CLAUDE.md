# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: Job Logger Chrome Extension

## Purpose
Chrome extension that auto-detects job details from posting pages (LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor) and logs applications directly to a Google Sheet with one click.

## Status
Built and installable in dev mode. Google Cloud OAuth setup required before Sheets integration works. Not currently in active use (job search on pause).

## Tech Stack
- Framework: React (popup UI)
- Build tool: Vite
- Language: JavaScript (JSX)
- Runtime: Chrome Extension Manifest V3
- Integration: Google Sheets API via OAuth 2.0
- Package manager: npm

## Key Paths
- Extension manifest: `manifest.json`
- React popup UI: `src/popup/App.jsx` + `src/popup/components/`
- Background service worker: `src/background/background.js`
- Content scripts (page scraping): `src/content/content.js`
- Site-specific scrapers: `src/content/scrapers/`
- Shared utilities: `src/shared/constants.js`
- Build output: `dist/` (load this in Chrome)

## Commands
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev mode (hot reload) | `npm run dev` |
| Production build | `npm run build` |
| Load in Chrome | `chrome://extensions/` → Developer mode → Load unpacked → select `dist/` |

## Architecture

### Message Passing Flow
The extension uses Chrome's message passing between three layers:
1. **Popup** (`App.jsx`) → sends `GET_JOB_DATA` to content script, sends `SUBMIT_APPLICATION` / `CHECK_DUPLICATE` to background
2. **Content script** (`content.js`) → listens for `GET_JOB_DATA`, scrapes DOM, responds with job fields
3. **Background service worker** (`background.js`) → handles all Google API calls (OAuth via `chrome.identity`, Sheets read/write)

### Scraper Architecture
`content.js` is self-contained (no ES module imports — Chrome content scripts don't support them well). All scrapers are defined inline as objects in a `scrapers` map. Order matters: the first scraper whose `matches(url)` returns true wins; `generic` is the fallback. Each scraper returns: `{ company, role, location, salary, workArrangement, source }`.

### Google Sheets Integration
The background worker auto-creates a new sheet named "Job Application Tracker" on first log if none exists, storing the sheet ID in `chrome.storage.sync`. Columns are fixed: `Company | Role | Tier | Salary | Location | Work Arrangement | Status | Source | Notes | Date Applied | URL`. Note: `DEFAULT_COLUMN_MAPPING` in `constants.js` defines a different column order (includes `marketRange`, `recruiter`) — these two mappings are out of sync and need reconciling before production use.

### State Persistence
- `chrome.storage.sync`: `setupComplete`, `sheetInfo` (id, name, url, lastSynced), `authToken`
- OAuth token also cached by Chrome via `chrome.identity`

### Popup View State
`App.jsx` manages a single `view` state: `loading → setup → form → settings`. The `setup` view handles first-run Google OAuth. The `form` view is `JobForm.jsx` — auto-detects fields from the active tab and highlights them with "✓ Auto-detected".

## Google Cloud Setup (required for Sheets)
1. Create project at console.cloud.google.com
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials (Application type: Chrome Extension)
4. Add extension ID to `manifest.json` under `oauth2.client_id`

## Auto-Detection Support
| Platform | Status |
|----------|--------|
| LinkedIn | ✅ Full |
| Indeed | ✅ Full |
| Greenhouse, Lever, Workday, Glassdoor | ✅ Full |
| Other sites | ⚠️ Best effort / manual entry |

## Known Issues / Deferred Work
- Google OAuth not yet configured — Sheets integration is incomplete
- `DEFAULT_COLUMN_MAPPING` in `constants.js` is out of sync with the actual column order written by `appendRow()` in `background.js`
- `checkForDuplicate` in `App.jsx` is a stub (returns null) — actual duplicate checking is implemented in `background.js` but not wired up to the popup
- `handleUpdateExisting` in `App.jsx` is also a stub
- Extension not published to Chrome Web Store (dev mode only)
- Resume when job search becomes active again

## Notes
- During `npm run dev`, the popup runs as a browser page (not real extension) — `chrome.*` APIs are mocked with fallbacks in `App.jsx`
- The content script intentionally avoids ES module imports to stay compatible with Chrome's content script environment
- Global skill routing and coding standards are in `~/.claude/CLAUDE.md`
