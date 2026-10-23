# Acceptance pass (round 3)

Where each problem and each item in CLAUDE.md section 13 can be checked. Start fresh with Prototype → Reset this scenario. Checked at 360 px and 1280 px.

## A five-minute path for Earl

1. **Arrival:** one line, "We've filled in your application from last year and the state's records. Check 3 changes and confirm the rest." Readiness: "4 things left before you can submit". The list opens on "3 changes since last year", then "Same as last year".
2. **Your herd:** last year 41, registry 38. Answer No, enter 41: registry 38 | you, today 41, "This doesn't change your estimate.", awaiting verification. "Update each animal by ear tag" is struck through at the top with its reason. Continue: the herd moves to "Waiting for a check (1)".
3. **River field:** zoomed map, neighbours faint, the flagged lower part, "Source: satellite photo". Yes: the line sits on the satellite edge, top part prefilled with wheat; pick sunflowers, confirm. No instead: done at once, "One crop. The state may still check it." Estimate unchanged.
4. **Road field:** strip, "1.80 ha becomes 1.68 ha", "About 2,200 dinars less" before the question. Yes: done. No instead: "Correction asked for. Until it's checked, the land map's area counts." in one step.
5. **Same as last year:** your other fields, details, measures (with amounts), input receipts (files listed), each openable. "Yes, all the same as last year".
6. **"Ready to submit" sits at the top → Sign and submit → "Ready to submit. The state still checks:" → declaration → Submit application → receipt.**
7. **Jelena (Prototype → Jelena):** grouped by state. On Milan's case the primary button is "Ask the animal registry to check"; after it the case moves to "Waiting for another office" and Milan's herd says "Jelena asked the animal registry to check."

## Problems P1 to P12

| # | Where |
|---|---|
| P1 | Welcome back: "Submit by 26 May. 29 days left." (design note: EU mandate). |
| P2 | Scenario "Second year, not renewed": renewal is the first task; readiness says "Renew your status to submit"; after renewing, "You're an active farmer. Next: your application." The receipt is unmistakable. |
| P3 | Every change brings the record in (registry count, satellite photo, land map); receipts and records are listed in the app. |
| P4 | Maps in plain words; no key, no plots; neighbours faint; the line explains itself at the field's edge. |
| P5 | "Do you have 38 cattle now?" |
| P6 | River field: GSA proposes the split line from the satellite flag; Milan nudges it or uses the slider. |
| P7 | "3 changes since last year", each with its evidence before the question. |
| P8 | Herd disagreement → "Send this to Jelena". His item then shows Jelena's state. |
| P9 | One list, next action always on top; autosave with "Saved". |
| P10 | Status by section (needs you / waiting for a check / done), payment impact apart, "Ready to submit", what the state still checks. |
| P11 | The whole flow can be finished alone, from Welcome back to the receipt. |
| P12 | Jelena: only escalated problems, grouped by who acts next, likely next step primary. |

## Earl's checklist

- [x] Smartest version of the application, not a simplified form; no AI interface (AI shown to Earl only as a design note).
- [x] Opens with what GSA knows; asks only about what changed, evidence first.
- [x] Herd, river and road cards differ: two numbers; map with satellite flag; map with strip, size and payment impact.
- [x] Change cards and the application are one list, ordered by status. After each answer the task moves to Done, unneeded work is struck through with a reason, and the next action opens at the top with focus and a polite announcement.
- [x] No "Everything else": "Same as last year" names each thing and opens it; anything changed or missing is its own task.
- [x] Map in plain words; no technical terms, no plots, no key; a boundary explains itself when it stops the line.
- [x] Split line proposed from the satellite flag; grip, handles, slider, undo (when there is something to undo), guardrail and live areas.
- [x] Journey runs end to end at 360 px and 1280 px.
- [x] Readiness is the list itself plus one line; disagreements return to the list with Continue.
- [x] Status is separate from payment impact ("This doesn't change your estimate").
- [x] "Ready to submit", never "safe"; the same heading lists what the state still checks.
- [x] 38 vs 41: both kept, explained, awaiting verification, no dead end.
- [x] What blocks (needs you) and what doesn't (waiting for a check, assumption note) is explicit.
- [x] Satellite only flags; a No about crops stands.
- [x] Estimate at body size with its basis; assumptions under "How is this worked out?".
- [x] Jelena's cases show who owns the next action; Milan sees the same state.
- [x] Design notes (off by default): tested, EU mandate, assumption, AI behind the scenes.
- [x] Every problem P1 to P12 is answered (table above).
- [x] `src/copy/en.ts`: 2,037 words at the start of round 3, 1,944 at the end.

## Assumptions and placeholders

- Prototype clock: today is 28 April 2026 (29 days left).
- Receipt file names and dates (Seed receipt.pdf, Fertiliser receipt.pdf, Diesel receipt.jpg), reference numbers, plot outlines and the neighbour's case are placeholders.
- Assumptions to confirm with the ministry: awaiting verification doesn't block submission; amending until the national deadline; after a "one crop" answer the state may still check the field. A geotagged field photo (as in EU area monitoring) is an idea to raise with the ministry, not built.
- Unchanged things have one change path only: "Records wrong? Ask for a correction" on your details.
