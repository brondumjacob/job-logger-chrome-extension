---
target: public/popup.html
total_score: 22
p0_count: 2
p1_count: 2
timestamp: 2026-07-11T16-18-33Z
slug: public-popup-html
---
Method: dual-agent (A: a8fb025d868e31f4a · B: a505c3e9041cc6928)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Save states ("Checking…"/"Saving…") are clear, but the CTA that triggers them sits below the fold (see P0) |
| 2 | Match System / Real World | 3 | Tracker vocabulary (Tier, Status, Source) matches how a job-search spreadsheet actually reads |
| 3 | User Control and Freedom | 2 | "Disconnect Google Sheets" renders enabled even while "Not connected" is shown in the same panel |
| 4 | Consistency and Standards | 2 | Two disconnect affordances exist with different markup: a real `<button>` and a bare `<span>` click handler |
| 5 | Error Prevention | 2 | No confirmation before Disconnect or "Log Anyway" (creates a duplicate row) — both one click away |
| 6 | Recognition Rather Than Recall | 3 | Auto-fill + inline "Auto"/"Not found" badges strongly support this |
| 7 | Flexibility and Efficiency | 2 | No quick-submit shortcut; no way to skip the 12 correct fields and jump to the 2 that need attention |
| 8 | Aesthetic and Minimalist Design | 2 | Per-field styling is clean, but 14 fields at equal visual weight is not a minimalist composition |
| 9 | Error Recovery | 2 | Errors are text-only, no retry affordance beyond re-clicking submit |
| 10 | Help and Documentation | 1 | No tooltip or hint anywhere (e.g., what "Log Anyway" does differently from "Update Existing") |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated? Not quite the right question for a product-register tool — the sharper test is whether a user fluent in Linear/Raycast/Stripe would trust it. **Verdict: reads as competent internal tooling, not slop, but still template B2B SaaS** — the navy-gradient header, white-card-on-slate body, and blue-tinted focus ring are exactly the pattern PRODUCT.md names as the anti-reference, and it's still fully present in the file untouched.

**Deterministic scan** (`detect.mjs`, exit code 2, 19 findings): 16 are `design-system-color`/`design-system-font-size` advisories — these fired because no `DESIGN.md` existed *at scan time*; now that `DESIGN.md` documents these exact values as the intentional baseline, most should clear on a re-scan. Three real warnings survive: `single-font` (Roboto/system-stack only — likely a false positive for a 400px utility popup; product-register guidance explicitly favors one family here), `flat-type-hierarchy` (9–15px range, 1.7:1 ratio), and `dark-glow` (the navy hover-shadow on the submit button, line 210).

**Browser visual overlay** (live DOM injection succeeded via a locally-served copy of the file): confirmed `flat-type-hierarchy` and `dark-glow` from the static scan, and surfaced two things the static scan couldn't see — (1) rendered text splits **82% Roboto / 18% Arial**, an unexplained secondary font somewhere in the computed styles, worth a follow-up look; (2) a **skipped heading level** — `<h1>` "Job Application Logger" is followed directly by `<h3>` "Settings" with no `<h2>`, a real semantic/accessibility gap the static scan missed entirely.

## Overall Impression

The interaction design has real craft in a few specific places (the scrape-failure distinction, the duplicate-modal copy) — but the page composition treats all 14 form fields as equally important, which directly undercuts the product's own stated principle of "confirm, don't re-enter." The single biggest surprise: **live measurement shows the actual submit button sits ~660px down a 717px-tall document** — outside the "400×400 popup" frame PRODUCT.md treats as the whole interface. That's a bigger problem than the visual palette, and worth fixing before any redesign of colors/type.

## What's Working

1. **Auto/Not-found badges are genuinely well-built** — the text itself differs ("Auto" vs. "Not found"), not just the color, so the distinction survives even for someone who can't perceive the color difference.
2. **The scrape-failure warning is real product thinking** — distinguishing "content script never loaded" from "field wasn't found" and surfacing that distinction to the user (rather than silently leaving a blank field) is a subtlety most tools skip.
3. **Duplicate-modal copy is precise and low-anxiety** — company, role, and status/date metadata in one read gives the user everything needed to decide without digging.

## Priority Issues

**[P0] The submit button is not visible within the popup's own frame — the user must scroll ~260px to complete the core task.**
Why it matters: live-rendered measurement puts `#submit-btn` at `top:658.5, bottom:696.5` in a 717px-tall document. PRODUCT.md's own principle — "success/duplicate/failure states must be unmistakable within the 400×400 frame" — is violated at the most basic level: the primary CTA isn't in that frame at all on first open.
Fix: either make the form area internally scrollable with a bottom-pinned, always-visible submit button, or cut the visible footprint (progressive disclosure on optional fields) so it lands closer to 400–450px total.
Suggested command: `/impeccable layout public/popup.html`

**[P0] Form labels aren't programmatically associated with inputs — screen-reader users lose the label (and the Auto/Not-found signal) entirely.**
Why it matters: no `<label>` carries a `for` matching its input's `id`, so every field's accessible name resolves to placeholder text, which then disappears once the user types. The Auto/Not-found badge — the form's single most important trust signal per PRODUCT.md — lives inside that same unassociated label, so it's never announced to a screen reader at all. Fails WCAG 1.3.1/4.1.2 and the Sam persona outright.
Fix: add `for="<input-id>"` to every label (or wrap properly), and expose badge text via `aria-describedby` on the input.
Suggested command: `/impeccable audit public/popup.html`

**[P1] The duplicate-modal "Cancel" button fails WCAG AA contrast (~2.53:1 against a 4.5:1 requirement) on a trust-critical action.**
Why it matters: `.btn-cancel { color: #9ca3af }` on white is the one non-committal way out of the moment PRODUCT.md itself calls trust-critical, and it's the hardest element on the page to read.
Fix: darken to at least `#6b7280` or restyle as a proper (if quiet) text button; re-check against both banner backgrounds.
Suggested command: `/impeccable polish public/popup.html`

**[P1] 14 fields carry identical visual weight with no grouping or triage signal, contradicting "confirm, don't re-enter" at the composition level.**
Why it matters: there's no divider between core/required fields (Company, Role, Status) and supplementary detail (Recruiter, Key Details, Next Steps, Notes), and nothing visually draws attention to the "Not found" fields that actually need input. A user skimming to confirm re-reads all 14 rows at equal cost.
Fix: add a section break after Location/Work Arrangement; consider deemphasizing confirmed "Auto" rows so attention naturally goes to blank/"Not found" ones.
Suggested command: `/impeccable layout public/popup.html`

**[P2] Two structurally different, redundant "Disconnect" affordances exist, and one renders enabled even when nothing is connected.**
Why it matters: live-verified — opening Settings while unauthenticated shows both "Not connected to Google Sheets." and an active "Disconnect Google Sheets" button in the same panel. Separately, `#disconnect-link` in the connected banner is a bare `<span>` with a click handler — no `tabindex`, not keyboard-reachable, not screen-reader-announced as interactive.
Fix: hide/disable the settings-panel disconnect button when not connected; convert `#disconnect-link` to a real `<button>` styled as a link.
Suggested command: `/impeccable harden public/popup.html`

**[P2] Heading level skipped (h1 → h3, no h2) and a stray secondary font (Arial, 18% of rendered text) alongside the intended system stack.**
Why it matters: the missing h2 is a real semantic gap for assistive tech; the unexplained Arial usage suggests a fallback is firing somewhere it shouldn't, which is worth tracing before a type redesign locks in the "wrong" measured baseline.
Fix: add an `<h2>` for "Settings" (or demote it appropriately); trace which element is rendering in Arial and correct the font stack there.
Suggested command: `/impeccable typeset public/popup.html`

**[P3] Status (12 options) and Source (10 options) selects exceed the ≤4-choices-per-decision guideline for a tool meant to be fast.**
Not wrong for a tracker's vocabulary, but worth a defaults pass (surface the 3-4 most common statuses first, "More…" for the rest) given the product's own goal of sub-second decisions mid-scroll.
Suggested command: `/impeccable clarify public/popup.html`

## Persona Red Flags

**Sam (screen-reader + keyboard-only, needs 4.5:1 contrast)**: Every field is announced by placeholder text, not its label, so the name disappears once typed. The Auto/Not-found badge — the form's core trust signal — is invisible to Sam because it lives inside that same unassociated label. `#disconnect-link` has no `tabindex`, so Sam has no keyboard path to the connected-banner shortcut at all. The duplicate modal's Cancel button contrast issue compounds further for low-vision + magnification users.

**Alex (impatient power user)**: Must scroll ~260px past the "visible" popup just to find the submit button on first open — the worst possible friction for someone trying to confirm-and-submit in seconds. No keyboard shortcut (e.g. Cmd/Ctrl+Enter) to submit. All 14 fields cost equal scan time regardless of confidence, so Alex can't glance-confirm just the 1-2 uncertain fields and go.

**Riley (stress tester)**: If the content script fails to load *and* the subsequent save also fails, `scrape-warning` and `error-banner` can both render simultaneously — nothing in the DOM prevents it — stacking two full-width banners and pushing the 14-field form even further below the fold, compounding the P0 scroll issue exactly when Riley is already confused. "Log Anyway" has no undo and no confirmation step, and the always-enabled Settings "Disconnect" button invites exactly the impulsive click Riley is known for.

## Minor Observations

- `.dev-badge` ("DEV") is the only saturated warm color in the whole navy/slate palette — confirm it's fully stripped from the prod build path, since it would otherwise read as a stray debug artifact.
- The Notes textarea's resize handle isn't very discoverable at 13px font size.
- The Google sign-in button's icon is the only element that breaks from the navy/slate system — likely unavoidable given Google's own brand-mark requirements, but worth a deliberate visual bridge (spacing/border) so it doesn't read as a mismatched import.
- Success feedback (toast + banner + text-color change, all at once) is noticeably more reassuring than the error path (text only) — worth evening out once the redesign touches banners.

## Questions to Consider

- If the form is genuinely ~700px tall with all 14 fields rendered, is "fixed 400×400 popup" still the right frame — or should this become a two-tier UI: a compact review-and-submit surface for the 2-3 fields that actually need eyes, with the rest behind an explicit "Show all fields" disclosure?
- Given that most fields are correctly auto-filled most of the time, what would it look like to invert the model — treat "Auto + correct" as read-only confirmed text by default, and only present an editable input for fields that are blank or explicitly edited? That turns "confirm, don't re-enter" from a labeling convention into the actual interaction model.
- The duplicate-resolution modal is called trust-critical, but it's a generic three-button dialog today — what if "Update Existing" showed an explicit diff (old status → new status, old date → new date) instead of just naming the company/role, so the user isn't confirming blind?
