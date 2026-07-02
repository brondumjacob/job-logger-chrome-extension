/**
 * Post-build copy script
 * Copies static assets (manifest, popup, icons, content script) to dist/
 * Run after: vite build
 */

import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function copy(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  console.log(`  copied: ${dest.replace(ROOT, '.')}`);
}

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
  console.log(`  copied: ${dest.replace(ROOT, '.')} (dir)`);
}

console.log('[build.js] Copying static assets to dist/...');

// manifest.json
copy(join(ROOT, 'manifest.json'), join(DIST, 'manifest.json'));

// Popup (vanilla HTML + JS, no bundling needed)
copy(join(ROOT, 'public', 'popup.html'), join(DIST, 'popup.html'));
copy(join(ROOT, 'public', 'popup.js'),   join(DIST, 'popup.js'));

// Icons
copyDir(join(ROOT, 'public', 'icons'), join(DIST, 'icons'));

// Content script (self-contained, no imports — copy directly)
ensureDir(join(DIST, 'src', 'content'));
copy(join(ROOT, 'src', 'content', 'content.js'), join(DIST, 'src', 'content', 'content.js'));

console.log('[build.js] Done. Load the dist/ directory in Chrome as an unpacked extension.');
