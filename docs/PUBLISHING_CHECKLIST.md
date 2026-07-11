# Publishing checklist — Chrome Web Store

Everything below is a step only you can do (account creation, payment, and
Google Cloud Console access aren't things Claude can do on your behalf).
Reference docs: `docs/PRIVACY_POLICY.md`, `docs/STORE_LISTING.md`.

Your extension's ID is now fixed and will never change again, on any
machine, unpacked or published:

```
jbcpdchgjoiibfalfgnmkkicoeaabgna
```

This comes from the keypair in `keys/extension-key.pem` (gitignored,
back it up somewhere safe — losing it means a future reinstall would get
a random ID again unless you keep `manifest.json`'s `"key"` field, which
is the part that actually matters and is already committed-safe).

## 1. Pull my changes and do one normal build

```
git pull   # or however you're syncing from this session
npm run build
```

Confirm the extension still loads unpacked (`chrome://extensions` →
reload) and that its ID now shows as `jbcpdchgjoiibfalfgnmkkicoeaabgna`
— that confirms the key is wired up correctly before you go further.

## 2. Point your existing OAuth client at the fixed ID

You already have an OAuth client ("Job Logger Extension") in Google
Cloud Console from earlier dev-mode setup — it's currently authorized
for whatever ID your unpacked extension had at the time. Update it:

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Open the existing "Job Logger Extension" OAuth client
3. Update the Item ID / authorized extension ID to `jbcpdchgjoiibfalfgnmkkicoeaabgna`
4. Save

You can do this now — you don't need to wait for a Chrome Web Store
upload to get an ID, since the key file already fixes it.

## 3. Register as a Chrome Web Store developer

1. Go to the [Developer Dashboard](https://developer.chrome.com/docs/webstore/register)
2. Pay the one-time $5 registration fee (covers up to 20 extensions, no recurring cost)

## 4. Build and upload a draft item (unlocks OAuth verification)

```
npm run build:prod   # builds dist/ with DEV_MODE=false
```

Then zip the **contents** of `dist/` (manifest.json should be at the
root of the zip, not nested in a `dist/` folder inside it), and upload
it as a new item in the Developer Dashboard. It can stay unpublished /
in draft — Google's OAuth verification process requires a registered
item to exist, but not that it's live yet.

Before zipping, test the real OAuth + Sheets flow once: load the
`build:prod` output unpacked, click through Google sign-in, confirm a
row actually lands in a real Google Sheet. Your OAuth consent screen is
still in "Testing" mode (100-user allowlist) at this point, so make sure
your own Google account is in the test-user list in Cloud Console, or
sign-in will fail.

## 5. Host the privacy policy at a public URL

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

## 6. Submit the OAuth consent screen for verification — start this early, it's the long pole

In Cloud Console → APIs & Services → OAuth consent screen:
1. Fill in the privacy policy URL, app domain, and scope justification (copy from `docs/STORE_LISTING.md`'s permission-justification section)
2. Record a short screen-recording demo video showing: signing in with Google, and a row landing in the Sheet after clicking "Log Application" — any screen recorder works (QuickTime: File → New Screen Recording)
3. Upload the video (YouTube unlisted works) and submit for verification

This step typically takes 2-4 weeks, sometimes longer, and needs to
complete before the extension can be used by anyone outside your test-user
allowlist. Do this in parallel with step 7, not after it.

## 7. Finish the Chrome Web Store listing

In the Developer Dashboard, on the item you uploaded in step 4:
- Paste in the title, short description, full description, and category from `docs/STORE_LISTING.md`
- Upload: store icon (128×128, already have it — double check it follows the 96×96-glyph + 16px-padding convention), at least 1 screenshot (1280×800), small promo tile (440×280, required)
- Fill in the "Privacy practices" tab using the permission justifications in `docs/STORE_LISTING.md`
- Paste in the hosted privacy policy URL from step 5

I can help capture screenshots via screen capture if you load the
`build:prod` version and let me know — otherwise you'll need to supply
your own.

## 8. Submit for Chrome Web Store review

Once the listing is complete, submit the item itself for CWS review
(separate from OAuth verification — this one's usually hours to a few
days, not weeks). You can do this before OAuth verification finishes;
CWS review and OAuth verification run independently, but the extension
won't be usable outside your test allowlist until both are done.

## 9. Publish

Once both reviews pass, hit publish in the Developer Dashboard.
