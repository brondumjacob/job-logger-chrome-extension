# Product

## Register

product

## Platform

web

## Users

Job seekers actively applying to roles, using the extension in the moment they're already reading a job posting — on LinkedIn, Indeed, Greenhouse, Lever, Workday, or Glassdoor. They open the popup mid-browse, glance at a form that's already mostly filled in, and want to confirm and submit without breaking their scanning flow. The tracker they're logging into is the single source of truth for their job search, so the tool has to feel trustworthy with that data, not just fast.

## Product Purpose

A one-click bridge between a job posting and a Google Sheets tracker: auto-detect company, role, salary, location, and source from the page, catch duplicates before they're logged twice, and let the user confirm or correct in seconds. It exists so applying to ten jobs in a sitting doesn't mean ten manual spreadsheet entries later — the log gets written in the moment, or it doesn't get written at all.

## Positioning

The only application logger that reads the job posting for you and writes straight into the spreadsheet you already use — no separate tracker to maintain, no copy-paste.

## Brand Personality

Fast, precise, quietly polished — a tool that respects the user's time and stays out of the way once the data is confirmed. It should feel like a well-made instrument, not another SaaS dashboard: no filler, no self-promotion, no delight for delight's sake. Trustworthy carries real weight here — this is the one copy of the user's job-search history, so the UI should never feel flimsy or ambiguous about whether an action succeeded.

*Defaulted without direct user confirmation — the "3 words" and reference-site questions went unanswered. Revisit if this doesn't feel right once the design is in front of you.*

## Anti-references

The original UI (navy gradient header on slate-gray, generic rounded-corner form fields, blue focus rings) read as default corporate SaaS — that look has since been replaced with a warm terracotta accent on warm-tinted neutrals (see DESIGN.md, "The Confirmation Stamp"). Keep avoiding dashboard-template tells going forward: gradient headers, generic Inter-on-white forms, icon-and-label settings rows that could belong to any B2B tool, or a second unrelated brand color added "for variety."

*Updated after the 2026-07-11 recolor + icon redesign; originally defaulted from the existing code plus the stated design goal.*

## Design Principles

- **Confirm, don't re-enter.** Every interaction should feel like checking pre-filled facts, not filling out a form from scratch — auto-detected fields must be visually distinct from manual ones at a glance.
- **Never leave a save ambiguous.** Success, duplicate, and failure states must be unmistakable within the 400×400 popup frame — a job seeker mid-application-spree won't scroll back to double-check.
- **Instrument, not dashboard.** Precision and restraint over decoration; earn every color and every animation.
- **Respect the one copy of the truth.** Sheet connection status, sync state, and duplicate resolution are trust-critical moments — clarity here outranks visual minimalism.

## Accessibility & Inclusion

WCAG AA contrast throughout (the current form already uses fairly dark text on white/light-gray, but this should be re-verified against any new palette). Status colors (the 12-state `STATUS_COLORS` map in `src/shared/constants.js`) must not be the only signal — pair with the text label, which the current implementation already does via the `<select>`, so preserve that pattern in any redesign. Respect `prefers-reduced-motion` for toast/modal transitions.

*Defaulted to standard best practice — the specific-needs question went unanswered.*
