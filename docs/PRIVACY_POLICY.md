# Privacy Policy — Job Application Logger

**Effective date:** 2026-07-11
**Contact:** jacob.t.brondum@gmail.com *(confirm this is the email you want listed publicly — it will appear in the Chrome Web Store listing and the Google OAuth consent screen)*

This document describes what Job Application Logger ("the extension") does with data, verified directly against the extension's source code as of 2026-07-11 — not boilerplate.

## What the extension does

Job Application Logger lets you save details about a job posting (company, role, location, salary, status, notes, etc.) to a tracker, either from a form you fill in yourself or auto-detected from the page you're on.

## What data it reads, and when

The extension only reads job-posting details (job title, company name, location, salary, work arrangement) from pages on these specific sites, and only when you have the extension's popup open on that page:

- linkedin.com/jobs
- indeed.com
- boards.greenhouse.io / job-boards.greenhouse.io
- jobs.lever.co
- *.myworkdayjobs.com
- glassdoor.com/job-listing

This happens locally, in your browser. Nothing is sent anywhere until you click "Log Application."

## Where your data goes

You choose where saved applications are stored, and the extension never has its own server:

- **Google Sheets (default):** when you connect your Google account, application data is written directly from your browser to a spreadsheet in **your own Google Drive**, using **your own** Google OAuth authorization. We (the developer) do not have access to this spreadsheet, do not receive a copy of your data, and do not operate any backend server that data passes through.
- **Local storage (developer/testing mode only):** in this mode, data is written to `chrome.storage.local` and never leaves your browser at all.

The only network requests this extension makes are to `sheets.googleapis.com` — Google's own API, authenticated as you, writing to your own spreadsheet. There is no analytics, telemetry, advertising, or tracking code of any kind in this extension, and no data is sold or shared with any third party.

## Google API Services User Data Policy

Job Application Logger's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. Specifically:

- We only request the `spreadsheets` scope, used solely to create and write rows to a spreadsheet you control.
- We do not use this data for advertising.
- We do not allow humans to read this data except in direct response to your own actions (e.g., if you contact us for support about a specific issue), or to comply with applicable law.
- We do not transfer this data to any third party.

## Data retention and deletion

Since we never receive or store your data on any server, there is nothing for us to delete on request — deleting rows from your own Google Sheet, or clearing the extension's local storage via Chrome's `chrome://extensions` page, removes it completely. You can revoke the extension's access to your Google account at any time at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Permissions this extension requests, and why

| Permission | Why |
|---|---|
| `activeTab` | Lets the extension read the currently open tab's job-posting details only when you actively use the extension. |
| `storage` | Stores your settings and (in developer/testing mode) mock application data locally. |
| `identity` | Lets you sign in with your own Google account to authorize writing to your own Sheet. |
| Host permissions (LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor) | Lets the extension recognize and read job details on these specific job-posting sites. No other sites are accessed. |
| Host permission (`sheets.googleapis.com`) | Required to write application data to your Google Sheet. |

## Changes to this policy

If this policy changes, the effective date above will be updated and, for material changes, noted in the extension's Chrome Web Store listing changelog.

## Source code

This extension is open source: [github.com/brondumjacob/job-logger-chrome-extension](https://github.com/brondumjacob/job-logger-chrome-extension) — the claims above can be verified directly against the code.
