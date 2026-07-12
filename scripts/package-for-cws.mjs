#!/usr/bin/env node
/**
 * Packages dist/ into a zip ready for Chrome Web Store upload.
 *
 * The Chrome Web Store rejects any upload whose manifest.json contains a
 * "key" field — it errors with "key field is not allowed in manifest."
 * The Store assigns (and manages) the extension's real ID and keypair
 * itself, starting from your first upload of a given item. A self-generated
 * "key" is only useful for pinning a *local* unpacked-extension ID during
 * development — it must never go in the uploaded package.
 *
 * This script copies dist/ to a temp staging directory, strips "key" from
 * the copy's manifest.json if present, and zips it — dist/ itself is never
 * modified (local unpacked testing keeps whatever manifest.json you
 * currently have there, key field or not).
 *
 * Implementation note (only matters if this breaks again): `zip`'s
 * in-place atomic replace (it always writes to its own internal temp file
 * first, then tries to move that into place — every time, even for a
 * brand-new output file) reliably fails on this project's synced folder
 * with "zip I/O error: Operation not permitted", while a plain shell `mv`
 * between two paths already inside this same folder does not. So instead
 * of trusting zip's own replace step, we capture its output, find the
 * temp file it left behind (it prints exactly where in a warning line),
 * and `mv` that into place ourselves. Renaming/moving into or out of this
 * folder from the OS temp directory also reliably fails (EXDEV — it's a
 * different filesystem), so every intermediate path here stays inside the
 * project folder on purpose.
 *
 * Run: npm run package:cws   (after npm run build:prod)
 * Output: job-application-logger-cws.zip at the project root (gitignored)
 */

import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUTPUT_ZIP = join(ROOT, 'job-application-logger-cws.zip');
const REQUESTED_TEMP_ZIP = join(ROOT, `.cws-build-tmp-${Date.now()}.zip`);

if (!existsSync(DIST)) {
  throw new Error(`dist/ not found at ${DIST}. Run "npm run build:prod" first.`);
}

const stagingContent = mkdtempSync(join(tmpdir(), 'cws-package-'));
try {
  cpSync(DIST, stagingContent, { recursive: true });

  const manifestPath = join(stagingContent, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const hadKey = 'key' in manifest;
  delete manifest.key;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  let zipOutput = '';
  let actualZipPath = REQUESTED_TEMP_ZIP;
  try {
    zipOutput = execFileSync(
      'zip',
      ['-r', '-X', REQUESTED_TEMP_ZIP, '.', '-x', '.*', '-x', '*/.*', '-x', '*.DS_Store'],
      { cwd: stagingContent, encoding: 'utf8' }
    );
  } catch (err) {
    // Expected on this project's synced folder — see file header. zip's
    // own stdout+stderr tell us exactly where the real, complete file
    // ended up even though the command "failed."
    const combined = (err.stdout || '') + (err.stderr || '');
    console.log(combined);
    const match = combined.match(/new zip file left as:\s*(.+\.zip|\S+)/);
    if (match) {
      actualZipPath = match[1].trim();
    } else if (!existsSync(REQUESTED_TEMP_ZIP) || statSync(REQUESTED_TEMP_ZIP).size === 0) {
      throw new Error(
        `zip failed and I couldn't find where it left the real output. Raw output:\n${combined}`
      );
    }
  }

  // Move the old output aside (not delete — delete has been unreliable
  // here) and move the new one into place, both same-directory shell mv.
  if (existsSync(OUTPUT_ZIP)) {
    execFileSync('mv', [OUTPUT_ZIP, `${OUTPUT_ZIP}.old.${Date.now()}`]);
  }
  execFileSync('mv', [actualZipPath, OUTPUT_ZIP]);
  // Clean up the empty placeholder zip left at the originally-requested
  // path, if zip's failure-fallback path differs from it.
  if (actualZipPath !== REQUESTED_TEMP_ZIP && existsSync(REQUESTED_TEMP_ZIP)) {
    try { execFileSync('mv', [REQUESTED_TEMP_ZIP, `${REQUESTED_TEMP_ZIP}.dead`]); } catch { /* non-fatal */ }
  }

  console.log('');
  console.log(`[package:cws] Done: ${OUTPUT_ZIP}`);
  console.log(`[package:cws] Stripped "key" field from the zip's manifest.json: ${hadKey ? 'yes, was present' : 'no, was not present'}`);
  console.log('[package:cws] dist/ itself was not modified — this only affects the zip.');
} finally {
  rmSync(stagingContent, { recursive: true, force: true });
}
