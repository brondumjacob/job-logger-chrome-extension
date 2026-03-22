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
- Shared utilities: `src/shared/`
- Build output: `dist/` (load this in Chrome)

## Commands
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev mode (hot reload) | `npm run dev` |
| Production build | `npm run build` |
| Load in Chrome | `chrome://extensions/` → Developer mode → Load unpacked → select `dist/` |

## Google Cloud Setup (required for Sheets)
1. Create project at console.cloud.google.com
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials (Application type: Chrome Extension)
4. Add extension ID to manifest.json

## Auto-Detection Support
| Platform | Status |
|----------|--------|
| LinkedIn | ✅ Full |
| Indeed | ✅ Full |
| Greenhouse, Lever, Workday, Glassdoor | ✅ Full |
| Other sites | ⚠️ Best effort / manual entry |

## Known Issues / Deferred Work
- Google OAuth not yet configured — Sheets integration is incomplete
- Extension not published to Chrome Web Store (dev mode only)
- Resume when job search becomes active again

## Notes
- Use `npm run dev` during development for hot reload
- Never commit OAuth client secrets — store in environment or Chrome extension storage
- Global skill routing and coding standards are in `~/.claude/CLAUDE.md`
