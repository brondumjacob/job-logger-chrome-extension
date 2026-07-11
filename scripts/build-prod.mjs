#!/usr/bin/env node
/**
 * Production build for Chrome Web Store submission.
 *
 * Temporarily flips DEV_MODE to false in source, runs the normal build,
 * then restores DEV_MODE to true in source — even if the build fails.
 * Source always rests at DEV_MODE=true when this script exits, so local
 * dev and the Playwright test harness (tests/popup-harness.mjs, which
 * assumes DEV_MODE=true) are never left broken by a submission build.
 *
 * Run: npm run build:prod
 * Output: dist/ built with DEV_MODE=false (real Google OAuth + Sheets).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONSTANTS_FILE = join(ROOT, 'src', 'shared', 'constants.js');
const POPUP_FILE = join(ROOT, 'public', 'popup.js');

// Exact-string patches, not regex — if the source has changed and these
// strings no longer match, we want a loud failure, not a silent no-op
// that ships a build nobody actually flipped to production mode.
const PATCHES = [
  {
    file: CONSTANTS_FILE,
    dev: 'export const DEV_MODE = true;',
    prod: 'export const DEV_MODE = false;',
  },
  {
    file: POPUP_FILE,
    dev: 'const DEV_MODE = true; // Must match background.js DEV_MODE',
    prod: 'const DEV_MODE = false; // Must match background.js DEV_MODE',
  },
];

function setMode(toProd) {
  for (const { file, dev, prod } of PATCHES) {
    const content = readFileSync(file, 'utf8');
    const search = toProd ? dev : prod;
    const replace = toProd ? prod : dev;
    if (!content.includes(search)) {
      throw new Error(
        `Expected to find ${JSON.stringify(search)} in ${file} but didn't.\n` +
        `Source has probably changed since this script was written — aborting ` +
        `without building and without touching this file. Update the PATCHES ` +
        `list in scripts/build-prod.mjs to match the current source.`
      );
    }
    writeFileSync(file, content.replace(search, replace));
  }
}

let built = false;
try {
  console.log('[build:prod] Flipping DEV_MODE -> false in source...');
  setMode(true);
  console.log('[build:prod] Running build (vite build && scripts/build.js)...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  built = true;
} finally {
  console.log('[build:prod] Restoring DEV_MODE -> true in source (dev default)...');
  setMode(false);
}

if (built) {
  console.log('');
  console.log('[build:prod] Done. dist/ was built with DEV_MODE=false (real Google OAuth + Sheets).');
  console.log('[build:prod] Source is back to DEV_MODE=true for local dev — this is expected and correct.');
  console.log('[build:prod] Zip the dist/ folder now for Chrome Web Store upload. Do not hand-edit');
  console.log('[build:prod] dist/ afterward, or DEV_MODE could drift from what you tested — rerun');
  console.log('[build:prod] this script instead if you need to rebuild.');
}
