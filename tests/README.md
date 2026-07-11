# Extension test harness

Automated Playwright checks for the popup: DEV_MODE badge, LinkedIn
scraper -> form auto-populate, and the Log Application -> mock storage
write path. Runs headless, no live LinkedIn session required.

## Run it

```
cd tests
npm install        # first time only
node popup-harness.mjs
```

Exits non-zero and lists failures if any check fails.

## Why this directory has its own package.json / node_modules

The project root's `node_modules` was installed on macOS (it contains
`fsevents`, a macOS-only native module). Running `npm install` from a
Linux machine/sandbox against the root `package.json` would silently
replace it with Linux binaries and break the Mac build. This directory
is deliberately isolated so test tooling never touches the root
install.

## Environment quirks this harness works around

Correction (2026-07-11): an earlier version of this doc mislabeled all
three of these as "Linux sandbox specific." Only #1 actually is. #2 and
#3 are general Playwright + Chrome-extension behavior and will show up
on macOS too — they're already handled in `popup-harness.mjs`, nothing
extra to do, just don't assume they're sandbox artifacts if you're
extending this on a Mac.

1. **Sandbox-only: no root / no `apt-get install`.** In this
   container, Playwright's downloaded Chromium was missing
   `libXdamage.so.1`. Fixed without root:
   ```
   cd /tmp && apt-get download libxdamage1
   dpkg -x libxdamage1_*.deb ~/.local/chrome-libs
   ```
   The harness picks this up automatically via `LD_LIBRARY_PATH` if
   `~/.local/chrome-libs/usr/lib/aarch64-linux-gnu` exists; on macOS
   that directory won't exist and the harness just skips it —
   `npx playwright install chromium` gives you a complete, working
   binary there with no extra steps.

2. **General: `headless: true` doesn't work with extensions**, on any
   OS. Playwright's plain headless mode launches a separate,
   stripped-down `headless_shell` binary that never supports
   extensions. The harness instead points `executablePath` at the full
   `chrome` binary and passes `--headless=new` as a raw arg — same
   requirement on macOS.

3. **General: opening the popup via `page.goto()` makes IT the active
   tab**, on any OS, which breaks the popup's own
   `chrome.tabs.query({active:true})` lookup for the job page
   (confirmed by querying `chrome.tabs` directly from the service
   worker). Real toolbar-triggered popups don't have this problem since
   they're never a real tab. Workaround: after the popup loads, call
   `jobPage.bringToFront()` then manually re-invoke the popup's own
   `window.requestJobData()` (a global function since `popup.js` is a
   classic, non-module script).

## What this does NOT test

- Real LinkedIn/Indeed/Greenhouse/etc. pages — `fixtures/linkedin-job-fixture.html`
  is a hand-built stand-in using the exact selectors from
  `src/content/content.js`. If LinkedIn changes its DOM, this harness
  won't catch it; only manual testing against the live site will.
- Google Sheets / OAuth path (`DEV_MODE = false` in
  `src/shared/constants.js`). Only the dev mock-storage path is covered.
- The "content script not injected into an already-open tab" timing
  gotcha found during manual testing on 2026-07-11 — that's an
  environment/procedure issue (reload the tab after installing the
  extension), not something a fresh-navigation test harness would ever
  reproduce.
