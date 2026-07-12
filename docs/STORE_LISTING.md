# Chrome Web Store Listing — Job Application Logger

Copy-paste source for the CWS Developer Dashboard listing form. Character counts verified with a script, not eyeballed.

## Title

```
Job Application Logger
```

## Category

**Productivity** (closest fit; "Workflow & Planning" is the subcategory if the dashboard asks for one)

## Short description (132 char max — this is 128)

```
Log job applications to Google Sheets in one click — auto-detects company, role, salary & location from LinkedIn, Indeed & more.
```

## Full (detailed) description

```
Job Application Logger saves you from tab-switching and copy-pasting every time you apply to a job.

When you're on a job posting from LinkedIn, Indeed, Greenhouse, Lever, Workday, or Glassdoor, click the extension icon and it auto-fills the company, role, location, salary, and work arrangement straight from the page. Fill in anything it missed, pick a status, and click Log Application — it's saved to a Google Sheet in your own Google Drive.

FEATURES
• Auto-detects job details from 6 major job boards
• Manual entry works everywhere else
• Duplicate detection — warns you if you've already logged that company/role, with the option to update the existing entry instead of creating a new one
• Status tracking (Applied, Phone Screen, Interview, Offer, Rejected, and more)
• Everything lives in a spreadsheet you own — export it, chart it, share it, whatever you want

PRIVACY
Your data goes straight from your browser to your own Google Sheet, authenticated with your own Google account. There's no backend server, no analytics, no tracking, and nothing is ever sold or shared. Full privacy policy: https://raw.githubusercontent.com/brondumjacob/job-logger-chrome-extension/main/docs/PRIVACY_POLICY.md

Source code is open: github.com/brondumjacob/job-logger-chrome-extension
```

## Permission justifications (for the CWS review form — required per-permission)

**activeTab**
> Used to read job-posting details (title, company, location, salary) from the currently active tab only when the user opens the extension popup. Not used to monitor or access tabs the user hasn't actively engaged with.

**storage**
> Used to store the user's settings (e.g., which Google Sheet is connected) and, in the extension's local developer-testing mode only, to store logged applications locally instead of sending them to Google Sheets.

**identity**
> Used to let the user sign in with their own Google account via OAuth, so the extension can write application data to a spreadsheet the user owns. The extension never receives or stores the user's Google credentials.

**Host permission — linkedin.com, indeed.com, boards.greenhouse.io, job-boards.greenhouse.io, jobs.lever.co, *.myworkdayjobs.com, glassdoor.com**
> These are the job-posting sites the extension can auto-detect job details from. Access is limited to reading the current page's job-listing content; no other site data is accessed and nothing is modified on these pages.

**Host permission — sheets.googleapis.com**
> Required to write logged application data to the user's own Google Sheet via the Google Sheets API, using the user's own OAuth authorization.

**Host permission use (combined — CWS's Privacy Practices form has one field covering all host permissions, not one per domain)**
> Host permissions are used for two purposes: (1) reading job-posting details (title, company, location, salary) from the specific job-board pages the user is on — linkedin.com, indeed.com, boards.greenhouse.io, job-boards.greenhouse.io, jobs.lever.co, *.myworkdayjobs.com, and glassdoor.com — limited to the current page's content, never modified; and (2) writing logged application data to sheets.googleapis.com, using the user's own Google OAuth authorization, to the spreadsheet the user owns. No other domains are accessed.

**Remote code use**
> This extension does not download or execute remote code. All executable JavaScript (background service worker, content scripts, popup script) is bundled inside the extension package at build time — none of it is fetched from a server at runtime. The extension does call `fetch()` against `https://sheets.googleapis.com`, but only to exchange JSON data (read/write spreadsheet rows) via Google's REST API — never to retrieve or execute a script.

**OAuth scope — https://www.googleapis.com/auth/spreadsheets**
> Used exclusively to create and append rows to a spreadsheet the user owns, for the sole purpose of tracking their job applications. Not used to read, modify, or access any other spreadsheet, and not used for any purpose beyond what the user directly initiates by clicking "Log Application."

## Single Purpose statement (CWS requires this to describe the extension's one purpose)

```
Job Application Logger has a single purpose: to let users save job-application details from job-posting pages into a spreadsheet they control, either by auto-detecting the details or via manual entry.
```

## Assets checklist (see docs/PRIVACY_POLICY.md and README for content; these still need to be produced)

- [ ] Store icon: 128×128 PNG — have one at `dist/icons/icon128.png`, confirm it follows the 96×96-glyph-with-16px-transparent-padding convention before submitting
- [ ] At least 1 (ideally up to 5) screenshots, 1280×800 PNG/JPEG — showing the popup with an auto-filled job page in the background is the strongest one
- [ ] Small promotional tile: 440×280 PNG/JPEG (required)
- [ ] Marquee promo tile: 1400×560 PNG/JPEG (optional, only needed if seeking featured placement)
- [x] Hosted, publicly-reachable privacy policy URL — https://jobs-logger.com/PRIVACY_POLICY.html (custom domain, replaces the github.io URL — see below) — raw GitHub fallback still works too: https://raw.githubusercontent.com/brondumjacob/job-logger-chrome-extension/main/docs/PRIVACY_POLICY.md
- [x] Homepage — https://jobs-logger.com/ (`docs/index.html`) — paste into the CWS "Homepage URL" field on the Support tab and the OAuth consent screen's Application home page field
- [x] Terms of Service — https://jobs-logger.com/TERMS_OF_SERVICE.html (`docs/TERMS_OF_SERVICE.md`) — CWS doesn't require a dedicated ToS field, but it's linked from the homepage and privacy policy, and add it to the OAuth consent screen's Terms of Service field too

**Custom domain migration (2026-07-12):** Google's OAuth review rejected the `brondumjacob.github.io` homepage — third-party platform subdomains (github.io, vercel.app, etc.) can't be verified as "owned by you," per Google's own app-homepage guidance. Bought `jobs-logger.com` and pointed it at the same GitHub Pages site via `docs/CNAME`. All internal links in `index.html`/`PRIVACY_POLICY.md`/`TERMS_OF_SERVICE.md` are relative, so no content changes were needed — only DNS + this checklist + the OAuth consent screen fields need updating to the new domain.
