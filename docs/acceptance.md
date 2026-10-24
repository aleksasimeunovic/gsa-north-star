# Acceptance pass (round 5)

Where each problem and each item in CLAUDE.md section 13 can be checked. Start fresh with Prototype → Reset this scenario. Checked at 375 px and 1280 px.

## A five-minute path for Earl

1. **Arrival:** greeting, deadline, then the stepper: Your details, Animals, Land, Measures, Documents, Check and submit. Your details is open: "Start with your account for payments" (the bank closed …0417 and sent …2291). On the right, the part at a glance: ◆ Account for payments (now), Your household; = Your details. The page is grey, everything on it white.
2. **Your details:** Yes, the new account: "After your answer" says typing in an account number is no longer needed. Your household (grandson Luka, doesn't change the estimate), then Your details, "Yes, that's right". "Your details: done", Continue: Animals.
3. **Animals:** Your herd (41 last year, 38 in the registry; No, 41 keeps both and the herd waits for a check), your pigs, then the 14 cows that calved with what they pay, confirmed in one tap.
4. **Land:** each field change shows the place on the satellite photo. "Review this boundary" opens a map he can move: the river field (two crops: GSA's line where the photo changes), the road strip (0.12 ha, about 2,200 dinars less), the upper field (the neighbour's line, or drawing his own). The meadow: no mowing seen; Yes, he will mow or graze it. Then his other field, confirmed.
5. **Measures:** green cover may fit (the wheat fields stayed green all winter, those fields filled in for him), insemination may fit (9 inseminations in the registry), then choose your measures; a measure he adds asks only for what's still missing.
6. **Documents:** the diesel receipt is too blurry, send a new photo; then the receipts, confirmed.
7. **Check and submit:** "Your farm this year" with every part "Confirmed by you", the estimate, what the state still checks, the declaration, Submit application → receipt.
8. **Jelena (Prototype → Jelena):** grouped by state; on Milan's case the primary button is "Ask the animal registry to check"; Milan's herd then says "Jelena asked the animal registry to check."

## Problems P1 to P12

| # | Where |
|---|---|
| P1 | Welcome back: "Submit by 26 May. 29 days left." (design note: EU mandate). |
| P2 | Scenario "Second year, not renewed": renewal is the first task; readiness says "Renew your status to submit"; after renewing, "You're an active farmer. Next: your application." The receipt is unmistakable. |
| P3 | Every change brings the record in (registry count, satellite photo, land map); receipts and records are listed in the app. |
| P4 | Real satellite maps in plain words; no key, no plots; neighbours faint; the line explains itself at the field's edge. |
| P5 | "Do you have 38 cattle now?" |
| P6 | River field: GSA proposes the split line from the satellite flag; Milan nudges it or uses the slider. |
| P7 | "Changes GSA found", each with its evidence (numbers, or the place on the photo) before the question. |
| P8 | Herd disagreement → "Send this to Jelena". His item then shows Jelena's state. |
| P9 | A stepper with the parts of his application, one next action in each, the part's outline beside it; autosave with "Saved". |
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
