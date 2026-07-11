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
Your data goes straight from your browser to your own Google Sheet, authenticated with your own Google account. There's no backend server, no analytics, no tracking, and nothing is ever sold or shared. Full privacy policy: [INSERT HOSTED PRIVACY POLICY URL]

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
- [ ] Hosted, publicly-reachable privacy policy URL (GitHub Pages, raw GitHub file, or a gist all work) — paste that URL into both the CWS listing form and the `[INSERT HOSTED PRIVACY POLICY URL]` placeholder above
