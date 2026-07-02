# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: Job Logger Chrome Extension

## Purpose
Chrome extension that auto-detects job details from posting pages (LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor) and logs applications directly to a Google Sheet with one click.

## Status
Fully functional in dev mode (no OAuth required). Load `dist/` as unpacked extension → form appears immediately → saves to `chrome.storage.local`. Google Cloud setup needed to switch to Google Sheets integration.

## Tech Stack
- UI: Vanilla HTML/JS popup (no framework — no build step needed for popup)
- Build tool: Vite (bundles background.js only) + `scripts/build.js` (copies static files)
- Language: JavaScript (ES modules for background, plain JS for popup/content)
- Runtime: Chrome Extension Manifest V3
- Integration: Google Sheets API via OAuth 2.0 (production) / chrome.storage.local (dev)
- Package manager: npm

## Key Paths
- Extension manifest: `manifest.json`
- Popup UI: `public/popup.html` + `public/popup.js`
- Background service worker: `src/background/background.js`
- Content scripts (page scraping): `src/content/content.js`
- Shared utilities: `src/shared/constants.js`
- Build output: `dist/` (load this in Chrome)
- Post-build copy script: `scripts/build.js`
- Google Cloud setup guide: `docs/GOOGLE_CLOUD_SETUP.md`

## Commands
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Build extension | `npm run build` |
| Load in Chrome | `chrome://extensions/` → Developer mode → Load unpacked → select `dist/` |

## Architecture

### Message Passing Flow
1. **Popup** (`public/popup.js`) → sends `GET_JOB_DATA` to content script; sends `CHECK_DUPLICATE`, `LOG_APPLICATION`, `UPDATE_EXISTING` to background
2. **Content script** (`src/content/content.js`) → listens for `GET_JOB_DATA`, scrapes DOM, responds with job fields
3. **Background service worker** (`src/background/background.js`) → handles all data persistence (mock storage in dev, Google Sheets API in prod)

### Dev vs Prod Mode
Both `src/background/background.js` and `public/popup.js` have a `DEV_MODE` constant (must match):
- `DEV_MODE = true`: no OAuth, form shown immediately, data saved to `chrome.storage.local` under key `mockRows`
- `DEV_MODE = false`: full Google OAuth + Sheets API flow

### Column Layout (A–N, 14 columns)
`UNIFIED_COLUMNS` in `src/shared/constants.js`: status, dateApplied, company, role, tier, salary, location, workArrangement, source, recruiter, keyDetails, nextSteps, notes, url

### Duplicate Detection
Background reads columns A:D (status, date, company, role) to find duplicates. Popup shows modal with three options: Update Entry, Log Anyway, Cancel.

### Scraper Architecture
`content.js` is self-contained (no ES module imports). All scrapers defined inline. First matching scraper wins; `generic` is fallback. Returns: `{ company, role, location, salary, workArrangement, source, url }`.

## Auto-Detection Support
| Platform | Status |
|----------|--------|
| LinkedIn | Full |
| Indeed | Full |
| Greenhouse, Lever, Workday, Glassdoor | Full |
| Other sites | Best effort / manual entry |

## Known Issues / Deferred Work
- Google OAuth not yet configured (use DEV_MODE for now) — see `docs/GOOGLE_CLOUD_SETUP.md`
- Extension not published to Chrome Web Store (dev mode only)
- Resume when job search becomes active again

## Notes
- The content script intentionally avoids ES module imports (Chrome content scripts don't support them)
- background.js uses ES modules and is bundled by Vite; popup.js and content.js are copied verbatim
- Global skill routing and coding standards are in `~/.claude/CLAUDE.md`
- Arsenal index (skills, agents, MCPs): `~/.claude/skills/INDEX.md`

## Arsenal (Global)
Skills, agents, and MCP servers are available in every session via `~/.claude/CLAUDE.md`.
Full index with trigger conditions: `~/.claude/skills/INDEX.md`

Key skills active in this project:
- **brand-voice** — marketing copy, messaging, tone review
- **frontend-design** — UI implementation, component design, visual polish
- **canvas-design** — posters, design artifacts, visual systems
- **theme-factory** — apply color/font themes to any artifact
- **figma-automation** — Figma files, tokens, exports via MCP
- **shadcn** — shadcn/ui components and design systems
- **emil-design-eng** — UI polish, animation, micro-interaction guidance
- **userinterface-wiki** — CSS, animation, typography, UX pattern review
- **brand-guidelines** — user-facing copy, error messages, empty states
- **escalation** — incidents and decisions needing executive action
- **context7-mcp** — library/framework documentation lookup
- **neon-postgres** — Neon Serverless Postgres tasks

## Personal Memory MCP

**Server:** `https://memory.jacobmemory.dev/mcp`

- **Session start**: call `search_memory` with keywords relevant to this project or the current task
- **During session**: call `save_memory` when the user shares preferences, decisions, project context, or facts worth retaining long-term — not one-off remarks
- Use tags: `work`, `preferences`, `projects/job-logger-chrome`, etc.
- Tools: `save_memory` · `search_memory` · `list_memories` · `delete_memory`
