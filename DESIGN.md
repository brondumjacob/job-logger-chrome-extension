---
name: Job Application Logger
description: Chrome extension popup for one-click job application logging
colors:
  primary: "#ba501c"
  primary-hover: "#983000"
  bg: "#ffffff"
  surface: "#faf3f1"
  border: "#dfd5d1"
  ink: "#211815"
  ink-soft: "#3f3632"
  muted: "#766863"
  success-deep: "#00582c"
  success-tint: "#ddf6e4"
  success-border: "#68b986"
  warning-deep: "#6d4400"
  warning-tint: "#fcedcd"
  warning-border: "#d4a73e"
  error-deep: "#a50013"
  error-tint: "#ffe6e3"
  error-border: "#f97770"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "normal"
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "normal"
    letterSpacing: "0.03em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: "normal"
    letterSpacing: "normal"
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "7px"
  xl: "8px"
  xxl: "10px"
  pill: "20px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  xxl: "16px"
  section-gap: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "11px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px"
  button-danger:
    backgroundColor: "#ffffff"
    textColor: "{colors.error-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "8px"
  input-field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  badge-auto:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: "1px 5px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
---

# Design System: Job Application Logger

## 1. Overview

**Creative North Star: "The Confirmation Stamp"**

The redesign replaces the generic navy-gradient-on-slate look (documented in this file's prior revision, now retired) with a warm terracotta accent on a neutral, near-white ground — the palette of a well-kept field instrument, not a SaaS dashboard. The extension's whole job is to take something that just happened (reading a job posting) and stamp it into permanent record; the visual system leans into that with a literal checkmark-through-a-briefcase mark carried from the toolbar icon into the popup header, and a single warm terracotta used sparingly for exactly the actions that "confirm" something (the submit button, the primary modal action, focus rings) while everything else stays a calm, warm-tinted neutral. This is explicitly what the interface should NOT look like: another gradient-header B2B tool, another blue-accent dashboard, another pastel-banner-for-every-state template — the previous system named all three by name as anti-references, and this system replaces every instance of them.

**Key Characteristics:**
- One committed brand color (terracotta `#ba501c`) carrying roughly 5-10% of the surface — the submit button, the header/toolbar icon mark, focus rings, and the primary modal action. Restrained, not decorative.
- Confirmation states (auto-detected fields, the connected-to-Sheets banner, the success banner) all share one green, unifying "this is good, this is confirmed" into a single hue instead of splitting blue/green as the old system did.
- Warm-tinted neutrals throughout (bg, surface, border, ink all carry a faint chroma toward the terracotta hue) instead of the old cool slate-gray family — subtle cohesion, not a "warm theme."
- Flat by default; the only shadows are the submit-button hover lift and the duplicate modal's overlay, unchanged from the prior system's discipline.
- System font stack, no display type — unchanged; the popup format still has no room for a hero moment.

## 2. Colors

A single warm terracotta accent, a green "confirmed" family that spans auto-detection and connection status, and warm-tinted neutrals throughout.

### Primary
- **Terracotta** (#ba501c): Header/toolbar icon mark, the submit button, the primary modal action, input focus borders and rings. Used deliberately — nowhere as decoration.
- **Terracotta, deep** (#983000): Hover state for every primary-filled surface above.

### Secondary
- **Confirmed Green, deep** (#00582c): Text/icon color for anything meaning "this succeeded, this is auto-filled, this is connected" — the auto-detect badge, the connected-to-Sheets banner, the post-submit success banner. Merging "connected" and "success" into one hue (the old system split them blue/green) makes the vocabulary simpler: green always means "you're good."
- **Confirmed Green, tint** (#ddf6e4) / **border** (#68b986): The banner/badge fill and hairline border pairing with the deep shade above.

### Tertiary
- **Warning Gold, deep** (#6d4400) / **tint** (#fcedcd) / **border** (#d4a73e): The scrape-failure and auth-required banners, and the DEV-mode badge (recolored from an unrelated bright yellow into this same family — it's a caution signal, not a random highlight).
- **Error Red, deep** (#a50013) / **tint** (#ffe6e3) / **border** (#f97770): The error banner, the required-field asterisk, and the destructive Disconnect button.

### Neutral
- **White** (#ffffff): Popup body background — pure white, not a tinted "warm AI cream"; the warmth lives in the brand colors and typography, not the ground.
- **Warm Surface** (#faf3f1): Settings panel and sticky-footer background — bg pulled very slightly toward the terracotta hue (chroma 0.008), just enough for subconscious cohesion.
- **Warm Border** (#dfd5d1): Hairline borders on inputs, buttons, panels, dividers.
- **Ink** (#211815): Primary text.
- **Soft Ink** (#3f3632): Field labels, secondary emphasis text (modal body copy, Google sign-in label).
- **Muted** (#766863): Meta/status text, the "Not found" badge, the Cancel button.

### Named Rules
**The One Brand Color Rule.** Terracotta is the only color that means "brand" or "primary action." Every other color in the system is semantic (success/warning/error) or structural (the neutral ramp). If a new element needs emphasis, reach for weight or space before reaching for a second brand color.

**The One Confirmation Color Rule.** Auto-detected, connected, and successfully-saved all render in the same green. Don't reintroduce a separate blue for "connected" — that was the old system's split vocabulary, and this system deliberately unified it.

## 3. Typography

**Body Font:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif (system stack; unchanged from the prior system — carried forward because it's the right choice for a 400px extension popup, not because nothing changed)

**Character:** Purely functional, as before. The redesign is a color and mark change, not a typographic one — every size still sits between 9px and 15px.

### Hierarchy
- **Title** (600, 15px): The header line, now paired with the briefcase-and-checkmark icon mark in terracotta.
- **Body** (400, 13px): Form inputs, buttons, modal copy.
- **Label** (600, 11px, 0.03em, uppercase): Field labels above every input.
- **Caption** (600, 9–10px): Auto-detect badges, toast text, modal meta line.

### Named Rules
**The No-Display-Type Rule.** Unchanged: nothing exceeds 15px anywhere in this system.

## 4. Elevation

Unchanged from the prior system: flat by default, shadows only on the submit-button hover lift and the duplicate modal's overlay.

### Shadow Vocabulary
- **Button hover-lift** (`box-shadow: 0 4px 12px rgba(186, 80, 28, 0.3)`, paired with a 1px `translateY` lift): recolored to the terracotta primary; same behavior as before.
- **Modal elevation** (`box-shadow: 0 20px 40px rgba(33, 24, 21, 0.2)`): recolored from a neutral black shadow to a shadow tinted with the new ink color; same placement and role.

### Named Rules
**The Flat-at-Rest Rule.** Unchanged: nothing casts a shadow until hovered, or is the modal.

## 5. Components

### Buttons
- **Shape:** Unchanged radii — 8px primary/full-width, 7px modal actions, 6px danger, 4px icon-only.
- **Primary:** Flat terracotta fill (`#ba501c`), white text — no longer a gradient. Hover swaps to the deeper terracotta (`#983000`) plus the recolored lift-shadow.
- **Secondary (modal "Log Anyway"):** White fill, soft-ink text, warm-border outline — unchanged structure, recolored tokens.
- **Danger (Disconnect):** White fill, error-deep text, error-border outline; hover fills with the error tint. Disabled (nothing connected) drops to 50% opacity — a real disabled state now, not just a visual convention.
- **Ghost (Cancel, icon buttons):** Muted text at rest, ink-soft on hover; icon-btn hover picks up a faint ink-tinted background instead of the old white-on-navy overlay.

### Banners (still the primary state-communication device)
- **Style:** Unchanged shape (8px radius, tinted fill + hairline border + deep-on-tint text), now drawn from four color families: warning (gold), error (red), success (green) — and connected, folded into the same green as success rather than kept as a separate blue.

### Badges (Auto-detect indicator)
- **Style:** Unchanged 3px-radius pill. "Auto" now renders in the green confirmation family instead of an unrelated green; "Not found" uses the warm-neutral surface/muted pairing instead of a cool gray.

### Inputs / Fields
- **Style:** Unchanged white fill, 6px radius, warm-border outline instead of cool-gray.
- **Focus:** Border and ring both recolored to terracotta (`box-shadow: 0 0 0 2px rgba(186, 80, 28, 0.15)`) — this is the single most common place a user will see the brand color, by design.

### Modal (Duplicate Resolution)
- **Corner Style, layout:** Unchanged. Primary action recolored to terracotta; Cancel recolored to the muted/ink-soft pairing that passes contrast (see prior polish pass).

### Toast
- **Style:** Unchanged dark ink pill; ink itself is now a warm near-black (`#211815`) instead of a cool slate.

## 6. Do's and Don'ts

### Do:
- **Do** keep terracotta to the handful of "primary action" moments (submit, primary modal button, focus ring, icon mark) — per the One Brand Color Rule.
- **Do** keep "connected," "auto-detected," and "success" all in the same green family — per the One Confirmation Color Rule.
- **Do** keep the warm-tinted neutral ramp (bg/surface/border/ink all carry a faint terracotta chroma) rather than reverting to a cool gray scale.

### Don't:
- **Don't** reintroduce a gradient on the header or any button — the flat terracotta fill is deliberate, not a placeholder.
- **Don't** add a second, unrelated brand color "for variety." One accent, used consistently, is the point.
- **Don't** let the DEV-mode badge drift back to an arbitrary bright yellow — it's part of the warning family now, meaningfully, not just decoratively colored.
