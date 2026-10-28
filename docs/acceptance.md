# Acceptance pass (round 10)

Where each problem and each item in CLAUDE.md section 13 can be checked. Start fresh with Prototype → Reset this scenario. Checked at 360 px and 1280 px.

## A five-minute path for Earl

1. **Arrival:** the stepper (Your details, Animals, Land, Measures, Documents, Check and submit), then "Start with your account for payments". The readiness bar says "Not ready to submit yet / Next: check your account for payments", no big number. 11 things to do, down from 14: name, address and active farmer are reused without asking; the household question is gone; the blurry receipt lives inside "Your input receipts".
2. **Your details:** Yes, the new account. The toast says what changed; Animals opens.
3. **Animals:** Your herd, No, 41: four plain answers (your part: done; who settles it: the animal registry; do you need to do anything: no, unless they contact you; what happens next). The same words in the drawer, the toast and "Your farm this year". Pigs, then cows that calved, one tap.
4. **Land, the hero:** river field card shows the photo with its source and date. Review this boundary → "What's growing in the lower part this year?" → Something else → the toast says "1 more thing: split the field, because something else is growing in the lower part" → GSA's line, nudge it (large handles, or the slider), a crop for each part, Confirm. Road: the hatched 0.12 ha strip, about 2,200 dinars less. Upper field, "No, the strip is mine": move the edge as one line by its handle or the metre stepper, live area, it stops at his land and says why, undo. Meadow: what the state checks this year leads; last summer's photo is only why GSA asks.
5. **Measures:** "You applied for these last year", unticked, each with "Apply again". GSA's two suggestions with the evidence and its source, what the state still checks and what he provides; green cover's fields are one tap, "Use these fields".
6. **Documents:** "Send a clearer diesel receipt": the blurry file is red in the list (an error); then confirm the receipts.
7. **Check and submit:** a review until nothing blocks (what's left is the primary action); then the state's checks, the declaration and Submit. "Unchanged since last year" sits beside the estimate, each line with "Something wrong? Ask for a correction". Receipt.
8. **Jelena (Prototype → Jelena):** refer the neighbour's parcel; it moves to "Referred, awaiting a response" with a follow-up date; only "Record the decision of the land registry" resolves it. The case shows the parcel on the photo, the registry record, the explanation and the deadline.

## Problems P1 to P12

| # | Where |
|---|---|
| P1 | Header: days left to apply (design note: EU mandate on the river field). |
| P2 | Scenario "Second year, not renewed": renewal comes first; after it, "You're an active farmer. Next: your application." The receipt is unmistakable. |
| P3 | Every change brings the record in, with its source and date; what's unchanged is reused without asking. |
| P4 | Real satellite maps in plain words; no plots, no key; a line explains itself where it stops. |
| P5 | "Do you have 38 cattle now?" |
| P6 | River field: GSA's line from the photo, nudged by large handles or the slider; no point placement anywhere. |
| P7 | Facts before questions, with source and date; meanings left to Milan. |
| P8 | Herd disagreement → "Send this to Jelena"; his item shows her state in the same words she sees. |
| P9 | Stepper with parts, one next action, readiness verdict first; autosave with "Saved". |
| P10 | One status signal everywhere: to do (neutral), look at this (orange), error (red); payment impact apart; "Ready to submit"; what the state still checks. |
| P11 | The whole flow can be finished alone. |
| P12 | Jelena: only escalated problems, who acts next, follow-up dates, resolved only with the record owner's decision. |

## Earl's checklist

- [x] Smartest version of the application, not a simplified form; AI only as a design note.
- [x] Opens with what GSA knows; asks only about what changed, evidence first.
- [x] Herd, river and road differ: two numbers; photo with flag; photo with strip, size and payment.
- [x] One list: done work collapses, unneeded work leaves with a reason, added work is announced with its reason, the next action gets focus.
- [x] No "Everything else": unchanged reused without asking, yearly declarations one tap each, changes their own tasks.
- [x] Map in plain words; parcels hidden; a boundary explains itself when it stops a line.
- [x] Split line from the photo; large handles; slider, undo, guardrail and live areas.
- [x] Journey runs end to end at 360 px and 1280 px.
- [x] Status separate from payment impact.
- [x] "Ready to submit", never "safe"; the state's checks listed.
- [x] 38 vs 41: both kept, four plain answers, no dead end, same words everywhere.
- [x] Satellite only flags; Milan decides what he planted.
- [x] Estimate: no basis yet / provisional / current; never "About 0 dinars".
- [x] Jelena: who acts next, ordered by what matters, never resolved straight after a referral; Milan sees the same state.
- [x] Design notes (off by default): tested, EU mandate, assumption, AI behind the scenes.
- [x] Fewer decisions on arrival: 14 → 11 (decision 149).
- [x] Facts with source and date; meanings as possibilities; what GSA can't know is his question.
- [x] One status function on every screen; red only for errors; review is not submit.
- [x] No point placement with a finger anywhere.
- [x] Solid green only on the primary action; open part and row neutral and labelled; one content width; the task's action pinned in one place.
- [x] `src/copy/en.ts`: 4,242 words at the start of round 10, 4,208 at the end.

## Assumptions and placeholders

- Prototype clock: today is 28 April 2026 (29 days left).
- Placeholders: receipt file names and dates, reference numbers, plot outlines, the neighbour's parcel outline, the evidence dates (satellite photo 21 April 2026, land map 16 March 2026, neighbour's declaration 15 April 2026, summer 2025, winter 2025 to 2026).
- Assumptions to confirm with the ministry: awaiting verification doesn't block submission; amending until the national deadline; after "the same as the rest of the field" the state may still check it; the meadow must be mowed or grazed at least once this year, checked by satellite (no date invented); household pigs need no declaration.
- Follow-up date for a referral: halfway to the application deadline (a design choice, not a policy).
