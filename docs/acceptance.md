# Acceptance pass (round 2)

Where each problem and each item in CLAUDE.md section 13 can be checked. Start fresh with Prototype → Reset this scenario.

## A five-minute path for Earl

1. **Your herd:** two boxes, last year 41 and registry 38. Answer No, enter 41: the same boxes become registry 38 | you, today 41, awaiting verification. "Update each animal by ear tag" is struck through with its reason. Continue.
2. **River field:** a zoomed map with the flagged lower part and "Source: satellite photo". Answer Yes: the proposed line sits on the satellite edge, top part prefilled with wheat. Pick sunflowers for the bottom part, confirm. The task collapses, Road field opens and takes focus.
3. **Road field:** map with the 0.12 ha strip, "1.80 ha becomes 1.68 ha" and "About 2,200 dinars less" before the question. Answer Yes: "Redraw the field" leaves with "GSA moved the edge to the road for you."
4. **Your other fields, Your details, Your measures, Your input receipts:** one confirmation each. The header counts down to "Ready to submit".
5. **Sign and submit → Submit application → receipt.**

## Problems P1 to P12

| # | Where |
|---|---|
| P1 | Welcome back: "Submit by 26 May. 29 days left." (design note: EU mandate). |
| P2 | Scenario "Second year, not renewed": renewal is the first task; Submit is blocked with "Go to: Renew your active farmer status"; after renewing, "You're an active farmer. Next: your application." The receipt is unmistakable. |
| P3 | Every change card brings the record in (registry count, satellite photo, land map); nothing to look up elsewhere. |
| P4 | Maps use plain labels and a two-item key; land register plots are hidden behind a toggle on the whole-farm map. |
| P5 | "Do you have 38 cattle now?" |
| P6 | River field: GSA proposes the split line from the satellite flag; Milan nudges it with the grip or end handles, or uses the slider. |
| P7 | Change cards show the evidence before the question; the header says "Three things may have changed since last year." |
| P8 | Herd disagreement → "Send this to Jelena" with a note. His item then shows Jelena's state. |
| P9 | One list that always opens the next action; autosave with "Saved". |
| P10 | Status on every task, payment impact apart (road card, estimate block), "Ready to submit", what the state still checks. |
| P11 | The whole flow can be finished alone, from Welcome back to the receipt. |
| P12 | Sign in as Jelena: only escalated problems, ordered by what matters, each saying who acts next. |

## Earl's checklist

- [x] Smartest version of the application, not a simplified form; no AI interface anywhere.
- [x] Opens with what GSA knows; asks only about what changed, evidence first.
- [x] Herd, river and road cards differ: two numbers; map with satellite flag; map with strip, size and payment impact.
- [x] Change cards and the application are one list. After each answer, done work collapses, unneeded work leaves with a reason, the next action opens and takes focus, and the change is announced politely. One primary action at a time.
- [x] No "Everything else": your other fields, your details, your measures, your input receipts; missing receipts become "Upload your input receipts" (scenario "Missing receipts").
- [x] Map in plain words; plots hidden by default; dragging the line onto the field edge stops it and says "The line stops at your field's edge. Land outside it can't get support."
- [x] Split line proposed from the satellite flag; large grip and end handles; slider, undo, guardrail and live areas remain.
- [x] Journey runs end to end: welcome back, changes, land, readiness, submit, receipt.
- [x] Readiness is the list itself plus one header line; the herd disagreement returns to the list with Continue.
- [x] Status is separate from payment impact.
- [x] "Ready to submit", never "safe"; Submit says ready isn't approved and lists what the state still checks.
- [x] 38 vs 41: both kept, explained, awaiting verification, Jelena optional, no dead end.
- [x] Submit lists what blocks (with Go to as the primary action) and what waits; non-blocking verification carries the assumption design note.
- [x] Satellite only flags; Milan decides the crops (the flagged part is never prefilled).
- [x] Estimate labelled as an estimate, below the list, assumptions under "How is this worked out?".
- [x] Jelena: yours to act on, waiting for a named office, waiting for the farmer, resolved; blocks submission first; Milan sees "Jelena asked the animal registry to check."
- [x] Design notes (off by default) tag only tested, EU mandate and assumption.
- [x] Every problem P1 to P12 is answered (table above).
- [x] `src/copy/en.ts`: 3,189 words at the start of round 2, 2,037 at the end.

## Assumptions and simplifications

- Prototype clock: today is 28 April 2026 (29 days left).
- Redrawing the river field is one click. Unchanged fields have no "something changed" path.
- Reference numbers, plot outlines and the neighbour's case are placeholders.
- Awaiting verification not blocking submission, and amending until the national deadline, are assumptions to confirm with the ministry.
