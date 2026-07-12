# Publishing checklist — Chrome Web Store

Every step below is manual — none of this can be done by Claude (account
creation, payment, and Google Cloud/CWS console access are all
policy-blocked or credential-gated on your end). Reference docs:
`docs/PRIVACY_POLICY.md`, `docs/STORE_LISTING.md`.

**Correction (2026-07-11):** an earlier version of this doc claimed the
self-generated key in `keys/extension-key.pem` would produce the same ID
both locally *and* on the Chrome Web Store. That's wrong — confirmed the
hard way when the Dashboard rejected the upload with "key field is not
allowed in manifest." The Store assigns the real, permanent ID itself on
your **first** upload of a new item, and refuses any package whose
manifest already has a `"key"` field. The self-generated key is still
useful — it's what keeps your *local unpacked* extension's ID stable
across reloads during development — but it is **not** the ID that will
end up published. Don't point the OAuth client at
`jbcpdchgjoiibfalfgnmkkicoeaabgna` for production use; that step (now #4
below) has to wait until after the Store assigns the real ID in step 3.

`npm run package:cws` now handles stripping the `key` field automatically
— it builds `job-application-logger-cws.zip` at the project root from
whatever's in `dist/`, with `key` removed, and leaves `dist/` itself
untouched. Use that for every CWS upload, not a manual zip of `dist/`.

**Status check (2026-07-12):** the quick list below had sat with every
box unchecked, but a live look at the Dashboard showed steps 1–3, 7, and
9–11 were already done — the item is published and live on the Chrome
Web Store right now. Confirmed the uploaded `job-application-logger-cws.zip`
is a genuine `build:prod` build (real `sheets.googleapis.com` +
`chrome.identity` calls, `popup.js` has `DEV_MODE = false`), not a
dev-mode/mock-storage build. The one real gap: the OAuth consent screen
is still in **Testing** status (100-user cap, 1 test user added — you).
Anyone who installs the extension and isn't on that test-user list will
hit a Google "access blocked" error on sign-in — the extension itself
works, only the OAuth step is gated. See step 8 for how to move it to
Production.

**Correction (2026-07-12):** step 5 (below) originally assumed you'd
download the item's `.crx` and unzip it to find the `"key"` field. That
turned out to be the wrong path — checked the current Dashboard directly
(as of 2026-07-12) and it exposes the public key without any of that:
the item's **Package** tab has a **Draft** column and a **Published**
column, each with a **Public key → "View public key"** link. Click that
and it shows the base64 public key string directly — paste that straight
into your local `manifest.json`'s `"key"` field. No `.crx` download or
unzip step needed. (There's also a `main.crx` download link in the same
tab if you ever need the actual package, and a "Verified CRX uploads"
opt-in, but neither is needed just to get the key.)

## Quick list

- [x] ~~Push the CWS-prep commit~~ — done
- [x] Run `npm run build` once, confirm the extension reloads locally (local dev only — see correction above)
- [x] Register as a Chrome Web Store developer ($5 one-time)
- [x] Run `npm run build:prod` then `npm run package:cws`, upload the resulting zip as a new draft CWS item — confirmed the uploaded zip is a real prod build (2026-07-12 status check above)
- [x] Point the Google Cloud OAuth client at the Store-assigned ID
- [x] Pull the Store-assigned key into your local `manifest.json` — Package tab → "View public key" — done 2026-07-12
- [ ] Test real Google sign-in + a real Sheets write once, and confirm a row actually lands in the Sheet (not yet explicitly confirmed — OAuth screen shows 1 test user with some usage, but double-check)
- [x] Host `docs/PRIVACY_POLICY.md` at a public URL — moved to a custom domain (`https://jobs-logger.com/PRIVACY_POLICY.html`) on 2026-07-12 after Google's OAuth review rejected the `brondumjacob.github.io` homepage as an unverifiable third-party-platform subdomain; still needs DNS pointed at GitHub Pages + Search Console domain verification before resubmitting
- [ ] **Move the OAuth consent screen from Testing to Production** (needs domain verification + a short demo video) — see step 8, this is the current blocker
- [x] Finish the CWS listing
- [x] Submit the item for CWS review
- [x] Publish — **already live and public on the Chrome Web Store**

Details for each below.

## 1. Do one normal build

```
npm run build
```

Confirm the extension still loads unpacked (`chrome://extensions` →
remove the old entry, then **Load unpacked** fresh — a plain reload
doesn't always pick up an ID change) and that its ID now shows as
`jbcpdchgjoiibfalfgnmkkicoeaabgna`. This only matters for local dev
consistency right now, not for the published extension.

Two untracked files were deliberately left out of the earlier commit —
worth a look before you do anything else with them:
- `Extensions - Job Application Logger.html`, `Extensions.html` — empty saved copies of the `chrome://extensions` page shell, safe to delete
- `keys/extension-key-public.der`, `keys/extension-public-key.base64.txt` — harmless derived-public-key artifacts, redundant with `manifest.json`'s `"key"` field; fine to delete or commit, your call
- `dist.zip` at the project root — looks like a manual zip made in Finder for the first upload attempt; once `job-application-logger-cws.zip` (see step 3) uploads cleanly, this one's no longer needed

## 2. Register as a Chrome Web Store developer

1. Go to the [Developer Dashboard](https://developer.chrome.com/docs/webstore/register)
2. Pay the one-time $5 registration fee (covers up to 20 extensions, no recurring cost)

## 3. Build, package, and upload a draft item — this is where the real ID gets assigned

```
npm run build:prod    # builds dist/ with DEV_MODE=false
npm run package:cws   # produces job-application-logger-cws.zip, key field stripped
```

Upload `job-application-logger-cws.zip` (not a manual zip of `dist/`) as
a new item in the Developer Dashboard. It can stay unpublished / in
draft — Google's OAuth verification process requires a registered item
to exist, but not that it's live yet.

The Dashboard will show you the item's real, permanent extension ID
once created. That ID — not `jbcpdchgjoiibfalfgnmkkicoeaabgna` — is what
the published extension will actually use.

## 4. Point your OAuth client at the real, Store-assigned ID

You already have an OAuth client ("Job Logger Extension") in Google
Cloud Console from earlier dev-mode setup — it's currently authorized
for whichever ID your unpacked extension had at the time. Update it:

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Open the existing "Job Logger Extension" OAuth client
3. Update the Item ID / authorized extension ID to the real ID from step 3
4. Save

## 5. (Optional) Sync your local key so local dev matches the published ID

In the Developer Dashboard, open the item → **Package** tab. You'll see
a **Draft** column and a **Published** column, each listing a **Public
key** with a **"View public key"** link — click it to get the base64
public key string for that column.

Use the **Draft** column's key once you've uploaded a build (step 3) —
that's the ID your next published version will actually get. Paste that
value into your local `manifest.json`'s `"key"` field to make local
unpacked testing use the same ID going forward (keep
`keys/extension-key.pem` around regardless; it's just no longer the one
that matters for matching the published ID).

## 6. Test the real OAuth + Sheets flow once

Now that the OAuth client points at the right ID: load the `build:prod`
output unpacked, click through Google sign-in, confirm a row actually
lands in a real Google Sheet. Your OAuth consent screen is still in
"Testing" mode (100-user allowlist) at this point, so make sure your own
Google account is in the test-user list in Cloud Console, or sign-in
will fail.

## 7. Host the privacy policy at a public URL

`docs/PRIVACY_POLICY.md` is written and ready, but Google needs a live
URL, not a file. Cheapest options: enable GitHub Pages on the repo, or
just link the raw file:
`https://raw.githubusercontent.com/brondumjacob/job-logger-chrome-extension/main/job-logger-chrome-extension/docs/PRIVACY_POLICY.md`
(a real GitHub Pages URL looks more legitimate to reviewers, but the raw
link works). Fill in the `[FILL IN]` effective date first, and confirm
the contact email listed is the one you want public.

Paste that URL into:
- The CWS listing form's privacy policy field
- The OAuth consent screen's privacy policy field in Cloud Console
- The `[INSERT HOSTED PRIVACY POLICY URL]` placeholder in `docs/STORE_LISTING.md`'s full description

## 8. Move OAuth from Testing to Production — the current blocker

Confirmed against Google's own docs (support.google.com/cloud/answer/13461325
and developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification,
checked 2026-07-12). The `.../auth/spreadsheets` scope this extension
requests is classified **sensitive** (not **restricted**) — that matters
because it means: manual justification + a demo video are required, but
**not** the heavier CASA third-party security assessment restricted
scopes need. Steps:

1. **Verify domain ownership in Google Search Console.** The original
   plan (verify `brondumjacob.github.io` via URL-prefix + HTML file) got
   rejected — Google's OAuth review flagged it as "not registered to
   you," because a `github.io` subdomain is a third-party platform you
   don't control at the DNS level (same category as Google Sites,
   Facebook, etc. per Google's own app-homepage guidance). Fix: bought
   `jobs-logger.com`, pointed it at the same GitHub Pages site via
   `docs/CNAME`. Remaining steps:
   - Add 4 `A` records at the registrar for the apex domain →
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153` (GitHub Pages' standard IPs)
   - In [Search Console](https://search.google.com/search-console), add
     `jobs-logger.com` as a **Domain property** (not URL-prefix — domain
     property gives the stronger DNS-TXT verification Google's OAuth
     review actually wants) and add the TXT record it gives you at the
     registrar too
   - Once DNS propagates, verify in Search Console, then update the
     OAuth consent screen's homepage/privacy policy/ToS fields and
     Authorized Domains list to `jobs-logger.com`
2. **Fill in every field on the consent screen's Branding/Audience
   tabs**, if not already complete: app name, logo, user support email,
   developer contact email, application home page (must be publicly
   reachable — the extension's CWS listing page works), privacy policy
   link, and the authorized domain from step 1.
3. **Confirm the scope is declared** on the "Data Access" tab — the
   `.../auth/spreadsheets` scope should already be listed since it's in
   `manifest.json`'s `oauth2.scopes`; add a plain-language justification
   for why the app needs it and why a narrower scope (e.g.
   `spreadsheets.readonly` or the per-file `drive.file` scope) isn't
   sufficient. ("Writes each logged application as a new row to a
   spreadsheet the user selects" is the honest justification — note
   `drive.file` scope is worth considering later since it's
   *non-sensitive* and would let you skip this whole verification step
   for future changes, but that's a bigger code change, not needed now.)
4. **Record a demo video.** Google's requirement is specific: show the
   full OAuth consent flow (user clicking sign-in, the consent screen
   itself with your app name and requested scope visible, and the
   browser's address bar showing your OAuth client ID), *then* show the
   granted scope actually being used in the app (a job application row
   landing in the Sheet after clicking "Log Application"). QuickTime
   (File → New Screen Recording) is fine. Upload to YouTube as
   **Unlisted** (not Private — the review team needs the link to work
   without a Google account match).
5. In Cloud Console → OAuth consent screen → **Audience** tab, click
   **"Publish App"** (the button visible in the Testing status view) to
   move the app to production status, then **"Prepare for Verification"**
   → paste the video link and scope justification → **Submit for
   Verification**.

Google's stated timeline for this tier of review (sensitive scope, no
CASA audit) is up to ~10 days, not the 2-4 weeks restricted-scope apps
sometimes see — but treat that as a floor, not a guarantee. Your test
users (currently just you) keep working throughout — verification only
gates *new* non-test users, so there's no rush-risk to the extension
already being live.

Sources: [Submitting your app for verification](https://support.google.com/cloud/answer/13461325), [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)

## 9. Finish the Chrome Web Store listing

**Done** — confirmed the item is published, which means this passed. In the Developer Dashboard, on the item you uploaded in step 3:
- Paste in the title, short description, full description, and category from `docs/STORE_LISTING.md`
- Upload: store icon (128×128, already have it — double check it follows the 96×96-glyph + 16px-padding convention), at least 1 screenshot (1280×800), small promo tile (440×280, required)
- Fill in the "Privacy practices" tab using the permission justifications in `docs/STORE_LISTING.md`
- Paste in the hosted privacy policy URL from step 7

I can help capture screenshots via screen capture if you load the
`build:prod` version and let me know — otherwise you'll need to supply
your own.

## 10. Submit for Chrome Web Store review

**Done.** Once the listing is complete, submit the item itself for CWS review
(separate from OAuth verification — this one's usually hours to a few
days, not weeks). You can do this before OAuth verification finishes;
CWS review and OAuth verification run independently, but the extension
won't be usable outside your test allowlist until both are done.

## 11. Publish

**Done — confirmed 2026-07-12, the item's Status tab shows "This draft is
published and available to the public."** OAuth verification (step 8) is
the only thing still gating full public sign-in.
