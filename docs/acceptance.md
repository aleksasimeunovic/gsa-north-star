# Acceptance pass

Where each item from CLAUDE.md sections 3 and 13 can be checked in the prototype.

## Problems P1 to P12

| # | Where |
|---|---|
| P1 | Welcome back: application window and days left (design note: EU mandate). |
| P2 | Renewal gate (scenario "Second year, not renewed"): prepare, blocked at Submit, "You're an active farmer. Next: your application." Receipt is unmistakable. |
| P3 | Change cards and Everything else records show registry data; nothing to look up elsewhere. |
| P4 | Land: map first, cadastral parcels as reference only, legend explains the three land terms. |
| P5 | Herd: "Do you have 38 cattle now?" |
| P6 | Land: split the river field with one line (drag or slider). |
| P7 | Welcome back: "Three things may have changed since last year." |
| P8 | Herd "No" → Send to Jelena with one specific problem and a note. |
| P9 | Same four-step structure, plain language, "Why am I seeing this?", autosave with "Saved". |
| P10 | Readiness on every screen, estimate separate, "Ready to submit" (not approved), what the state still checks. |
| P11 | The whole flow can be finished alone, from Welcome back to Receipt. |
| P12 | Sign in as Jelena: queue of escalated problems only, context attached, shortcuts, bulk action, history. |

## Earl's checklist

- [x] Smartest version of the wizard, not a new product; no AI chat ("Why am I seeing this?" is static text).
- [x] Opens with what GSA knows; asks only about what changed.
- [x] Live preview reassembles as Milan answers; progress counts only his steps; 8 → 4 compare view on every step.
- [x] Readiness bar and drawer on every screen; the 38 vs 41 conflict returns to the application ("Carry on").
- [x] Status (complete / needs your action / awaiting verification) is separate from payment impact (estimate block).
- [x] "Ready to submit", never "safe"; ready isn't approved; Submit lists what the state still checks.
- [x] 38 vs 41: both values kept, explained, awaiting verification, ask the registry or Jelena, no dead end.
- [x] Submit says what blocks and what doesn't; non-blocking verification carries the "Assumption to confirm with the ministry" note.
- [x] Satellite only flags (river field); Milan decides what he planted.
- [x] Estimate labelled as an estimate, assumptions under "How is this worked out?", placed below the cards.
- [x] Advisor mode by role (prototype sign-in), escalation carries one specific problem.
- [x] Design notes distinguish Tested, North Star proposal, EU mandate and assumptions.
- [x] Every problem P1 to P12 is answered (table above).

## Assumptions and simplifications in the prototype

- Prototype clock: today is 28 April 2026 (29 days left).
- Vite `base` assumes the repository is named `gsa-north-star`.
- Redrawing a field and drawing first-year fields are simplified to one confirmation.
- Reference numbers, cadastral parcel labels and the neighbour's case are placeholders.
- Awaiting verification not blocking submission, and amending until the national deadline, are assumptions to confirm with the ministry.
