/**
 * popup-harness.mjs
 *
 * Automated end-to-end check for the Job Application Logger extension's
 * popup, run headless in a sandboxed Linux Chromium via Playwright.
 *
 * What it does NOT do: authenticate to real LinkedIn. It loads a static
 * fixture (fixtures/linkedin-job-fixture.html) under a mocked
 * https://www.linkedin.com/jobs/view/* URL via route interception, so
 * the extension's manifest host/content-script matching behaves exactly
 * as it would on the real site, without needing network access or a
 * logged-in session.
 *
 * Known Playwright quirk this file works around: opening popup.html as
 * a normal `page.goto()` (there is no way to trigger a *real* toolbar
 * click from Playwright) makes that page a real tab, which can itself
 * become the "active" tab — breaking the popup's own
 * chrome.tabs.query({active:true}) lookup for the job page. We work
 * around it by explicitly re-focusing the job-page tab with
 * bringToFront() immediately before creating the popup tab.
 *
 * Run: npm test   (from tests/)
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT_PATH = join(__dirname, '..', 'dist');
const FIXTURE_PATH = join(__dirname, 'fixtures', 'linkedin-job-fixture.html');
const FAKE_JOB_URL = 'https://www.linkedin.com/jobs/view/4200000001/';

// Manually-staged Chromium runtime deps — see chrome-libs-setup.md for why
// this exists (no root in this sandbox to `apt-get install` normally).
const CHROME_LIBS_DIR = join(process.env.HOME || '', '.local', 'chrome-libs', 'usr', 'lib', 'aarch64-linux-gnu');

const PLAYWRIGHT_CHROMIUM_REV = 'chromium-1228';

function resolveChromeExecutable() {
  const home = process.env.HOME || '';
  if (process.platform === 'darwin') {
    const base = join(home, 'Library', 'Caches', 'ms-playwright', PLAYWRIGHT_CHROMIUM_REV);
    const appName = 'Google Chrome for Testing.app';
    const candidates = [
      join(base, 'chrome-mac-arm64', appName, 'Contents', 'MacOS', 'Google Chrome for Testing'),
      join(base, 'chrome-mac', appName, 'Contents', 'MacOS', 'Google Chrome for Testing'),
    ];
    return candidates.find(existsSync) || candidates[0];
  }
  // Linux (sandbox)
  return join(home, '.cache', 'ms-playwright', PLAYWRIGHT_CHROMIUM_REV, 'chrome-linux', 'chrome');
}

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  if (!existsSync(EXT_PATH)) {
    throw new Error(`Extension dist/ not found at ${EXT_PATH}. Run "npm run build" in the project root first.`);
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'job-logger-ext-test-'));
  const launchEnv = { ...process.env };
  if (existsSync(CHROME_LIBS_DIR)) {
    launchEnv.LD_LIBRARY_PATH = [CHROME_LIBS_DIR, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  }

  // NOTE: plain `headless: true` makes Playwright launch the separate,
  // stripped-down "headless_shell" binary, which does not support
  // extensions at all (fails with "Executable doesn't exist" because we
  // only staged the full chrome-linux/chrome binary, on purpose).
  // Extensions require the FULL Chrome binary; we get a headless-equivalent
  // by passing --headless=new explicitly and pointing executablePath at the
  // full binary we manually unpacked, instead of using the `headless` option.
  //
  // Playwright's cache location AND the full-Chrome binary's path inside it
  // both differ by OS (this harness was originally built in a Linux sandbox;
  // it also needs to run on the Mac this project actually lives on):
  //   Linux:  ~/.cache/ms-playwright/chromium-<rev>/chrome-linux/chrome
  //   macOS:  ~/Library/Caches/ms-playwright/chromium-<rev>/chrome-mac(-arm64)/
  //           Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
  const CHROME_EXECUTABLE = resolveChromeExecutable();

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: CHROME_EXECUTABLE,
    env: launchEnv,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-sandbox', // required: no user-namespace privileges in this container
      '--headless=new',
    ],
  });

  try {
    // ------------------------------------------------------------
    // Resolve extension ID from its MV3 service worker
    // ------------------------------------------------------------
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
    const extensionId = sw.url().split('/')[2];
    record('Extension loads with a running service worker (manifest valid)', true, `id=${extensionId}`);

    // ------------------------------------------------------------
    // Open the mocked LinkedIn job page
    // ------------------------------------------------------------
    const jobPage = await context.newPage();
    await jobPage.route(FAKE_JOB_URL, async (route) => {
      await route.fulfill({ path: FIXTURE_PATH, contentType: 'text/html' });
    });

    const consoleErrors = [];
    jobPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await jobPage.goto(FAKE_JOB_URL);
    // give the content script (run_at: document_idle) a moment to attach
    await jobPage.waitForTimeout(500);

    record('LinkedIn fixture page loads with no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));

    // Re-focus the job tab before opening the popup tab — see file header.
    await jobPage.bringToFront();

    // ------------------------------------------------------------
    // Open the popup as its own page (Playwright can't trigger a real
    // toolbar click), then immediately hand focus back to the job tab
    // is NOT possible after popup.goto() since that itself is a focus
    // event — so the order above (focus job tab, THEN create popup) is
    // what matters, not what happens after.
    // ------------------------------------------------------------
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForTimeout(300);

    // Verified quirk: creating the popup as a page/tab makes IT the active
    // tab (confirmed via chrome.tabs.query from the service worker), which
    // breaks the popup's own chrome.tabs.query({active:true}) lookup for
    // the job page on its automatic first attempt. Real toolbar-triggered
    // popups don't have this problem (they're never a tab at all), so this
    // is purely a Playwright-simulation artifact, not the bug we're testing
    // for. Work around it by re-focusing the job tab, then manually
    // re-invoking the popup's own requestJobData() (a plain global function
    // since popup.js is a classic, non-module script).
    await jobPage.bringToFront();
    await popup.evaluate(() => window.requestJobData());
    await popup.waitForTimeout(500); // let requestJobData() round-trip

    const devBadgeVisible = await popup.locator('#dev-mode-badge').isVisible();
    record('Popup shows DEV badge (no OAuth/sign-in prompt)', devBadgeVisible);

    const authSectionVisible = await popup.locator('#auth-section').isVisible();
    record('Popup does NOT show sign-in form', !authSectionVisible);

    const companyValue = (await popup.locator('#company').inputValue()).trim();
    const roleValue = (await popup.locator('#role').inputValue()).trim();
    const locationValue = (await popup.locator('#location').inputValue()).trim();
    const salaryValue = (await popup.locator('#salary').inputValue()).trim();

    record(
      'Company field auto-populated from scraped page (not placeholder)',
      companyValue === '3 Bridge Networks',
      `got "${companyValue}"`
    );
    record(
      'Role field auto-populated from scraped page (not placeholder)',
      roleValue === 'Senior Fund Accountant',
      `got "${roleValue}"`
    );
    record('Location field auto-populated', locationValue === 'Boston, MA', `got "${locationValue}"`);
    record('Salary field auto-populated', salaryValue.includes('150,000'), `got "${salaryValue}"`);

    // ------------------------------------------------------------
    // Submit flow -> DEV_MODE mock storage (chrome.storage.local),
    // NOT real Google Sheets. Confirms the write path works end to end.
    // ------------------------------------------------------------
    await popup.getByRole('button', { name: 'Log Application' }).click();
    await popup.waitForTimeout(500);

    const successVisible = await popup.locator('#success-banner').isVisible();
    const successText = successVisible ? (await popup.locator('#success-banner').textContent()).trim() : '';
    record('Submit shows success banner (mock storage write)', successVisible, successText);

    const storedRows = await sw.evaluate(async () => {
      const data = await chrome.storage.local.get('mockRows');
      return data.mockRows || [];
    });
    // mockRows stores each row as an array in UNIFIED_COLUMNS order
    // (see src/shared/constants.js), not as a keyed object — index 2 is
    // Company, index 3 is Role.
    const firstRow = storedRows[0] || [];
    record(
      'chrome.storage.local mock row actually written',
      storedRows.length === 1 && firstRow[2] === '3 Bridge Networks' && firstRow[3] === 'Senior Fund Accountant',
      `rows=${JSON.stringify(storedRows)}`
    );

    // ------------------------------------------------------------
    // Missing content script simulation. Chrome doesn't inject
    // content_scripts into tabs that were already open before the
    // extension was loaded/reloaded — popup.js's requestJobData() must
    // surface that instead of silently leaving the form blank. We can't
    // literally unload the content script mid-test, so we stub
    // chrome.tabs.sendMessage to re-target a nonexistent tab id, which
    // makes Chrome fire the callback with a REAL chrome.runtime.lastError
    // — faithfully reproducing the exact branch popup.js hits in the
    // real scenario, without faking the error object itself.
    // ------------------------------------------------------------
    await jobPage.bringToFront();
    await popup.evaluate(() => {
      chrome.tabs.sendMessage = ((orig) => (_tabId, msg, cb) => orig(999999999, msg, cb))(chrome.tabs.sendMessage);
      return window.requestJobData();
    });
    await popup.waitForTimeout(300);

    const warnVisible = await popup.locator('#scrape-warning').isVisible();
    const warnText = warnVisible ? (await popup.locator('#scrape-warning').textContent()).trim() : '';
    record(
      'Missing content script on job page shows inline warning (not silent)',
      warnVisible && /refresh/i.test(warnText),
      `got "${warnText}"`
    );

    // Same stub still installed (still a real lastError) — but now on a
    // non-job page, where staying silent is correct behavior.
    const blankPage = await context.newPage();
    await blankPage.goto('about:blank');
    await blankPage.bringToFront();
    await popup.evaluate(() => window.requestJobData());
    await popup.waitForTimeout(300);

    const warnOnBlank = await popup.locator('#scrape-warning').isVisible();
    record('No warning shown on a non-job page (no false nag)', !warnOnBlank);
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('Failures:');
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[popup-harness] Fatal error:', err);
  process.exitCode = 1;
});
