# GSA North Star: low-fidelity coded prototype

You are building a clickable, low-fidelity prototype of Aleksa Simeunović's **GSA North Star**: his own proposal for how Serbia's agricultural subsidy application (GSA) could evolve beyond the version he designed and tested with 44 farmers and advisors for UN FAO. It is a portfolio piece reviewed by his mentor, Earl Friedberg.

This file is the single source of truth. Read it fully before planning. If something here is unclear or contradicts itself, ask Aleksa instead of guessing.

## 1. Goal and the one rule

**Goal:** prove the best possible user experience, not visuals. Earl must be able to open a link, click through Milan's year in about five minutes, and see how GSA "becomes substantially smarter and requires less effort from Milan".

**The one rule (the product's core principle):**
> The complexity of the application should reflect the complexity of the farm, not the complexity of the government's policies.

**Key line:** the wizard is generated around Milan's farm rather than fixed around the government's process.

**Low fidelity means:** greyscale, system font, plain boxes and borders, no brand, no illustrations, no animation beyond what explains a change. Spend effort on flow, states, copy, logic, accessibility and edge behaviour. A design system is applied later by Aleksa (see section 11), so structure the code for that.

## 2. How to work (token budget matters)

- Work **one phase at a time** (section 10). Start each phase in plan mode, show a short plan, wait for approval, build, then stop.
- Keep chat output short: no long explanations, no recaps of code you wrote. At the end of a phase, list what to click to check it, in under 10 lines.
- Don't re-read files you just wrote. Make small, targeted edits.
- Ask before adding any dependency beyond those in section 9.
- No CSS beyond one small `src/styles.css` (layout, spacing, focus rings, greyscale). No CSS frameworks yet.
- Tests: only unit tests for the pure logic (wizard generator, status, readiness, estimate). No UI tests.
- Commit at the end of each phase with a one-line message.

## 3. The problem being solved (from the Before story)

Milan Dragović, 63, Bečanj near Čačak. Wheat, maize and a small herd of cattle. Knows his land; unsure of the old family computer. Subsidies are the part of his income the weather can't touch, so applying weighs on him.

Every feature must trace back to one of these problems. If a feature doesn't, don't build it.

| # | Problem (Before) | How the prototype answers it |
|---|---|---|
| P1 | Measures opened at different times; only national TV said when | One application a year (EU mandate). Home shows the window and days left |
| P2 | He renewed his farm and thought he had applied | Renewal is a gate, never a finish line. After renewal: "You're an active farmer. Next: your application." Submission ends on an unmistakable receipt |
| P3 | Answers had to match three registries; he left the app to copy numbers | GSA brings registry data in. He never leaves the app to look anything up |
| P4 | Matching cadastral parcels to fields; never needed a cadastral number | Map-first. He works with his fields; cadastral numbers are secondary info. The three land terms are explained in plain words on the map |
| P5 | Second year: each sold or lost animal removed by ear tag | One question: "Do you have 38 cattle now?" |
| P6 | A field turned to sunflowers had to be redrawn with Jelena | He splits the field himself with one line |
| P7 | Nothing points to what has changed; he checks line by line | "Three things may have changed since last year." |
| P8 | Three or four office visits per subsidy | He sends Jelena one specific problem from inside GSA, only if needed |
| P9 | Used too rarely to remember | Predictable structure, plain language, guidance by default, autosave and resume |
| P10 | A mistake costs too much; fear of submitting | Status on every screen, payment impact shown apart, "Ready to submit" (not "safe"), what the state still checks |
| P11 | Paying an agency up to €40 for a free application | Self-service that a 63-year-old can finish alone |
| P12 | Jelena types other people's applications, a "counter clerk" | Advisor mode: denser, issues first, only the hard cases reach her |

Also from FAO field research (citable): about 70% of farmers own a smartphone and under half of 55 to 74 year olds use computers, so **design mobile-first** (360 px wide baseline) and make it work on desktop. Sessions used to expire mid-entry, so **never lose an answer** (autosave). Farmers missed the final "finish" button, so **submission must be unambiguous**. There was no action history across advisors, so **keep a history** of who did what.

## 4. Research quotes (rationale only, never shown in the UI)

Translated from Serbian by Aleksa, from the 44 usability sessions of the tested prototype.

Farmers:
1. The map with in-app helpers made drawing easy even though they didn't know the difference between cadastral parcel, physical block and agricultural parcel. → keep the map guided and explain the terms in place.
2. They could finally see what each measure is about and how their household fits, and didn't need to go to Jelena for everything. → plain-language measures with "your part".
3. They felt more confident to submit because they always had an overview of potential errors; before, they were unsure and feared losing money they need. → continuous readiness.

Advisors:
1. Overloaded; people delegate responsibility to have someone to blame; sending farmers to several institutions felt like an unsolvable puzzle. → GSA brings records together, says who settles each conflict, and escalates only specific problems.
2. Seven farmers a day with different knowledge gaps; the app should teach them about measures and their part in them. → each measure states what it pays for, what Milan must do, and why it fits his farm.
3. The old app made her repeat the same action many times. → advisor mode: shortcuts, bulk actions, issues first.

## 5. Tested vs North Star (must stay visibly separate)

- **Tested** (built for FAO, 44 sessions, 8-step wizard): plain-language measures, registry prefill of the herd, drawing fields on a satellite photo kept inside eligible land, errors linked to the answer that needs fixing, last year's fields return in year two.
- **North Star** (Aleksa's proposal, not built or tested, not UN scope): the four ideas below.
- **Mandated** (EU rules, not Aleksa's decision): one application a year; pre-filled forms from last year and the animal database; satellite monitoring exists.
- **Assumption to confirm with the ministry:** items awaiting verification don't block submission; amendments allowed until a national deadline.

The whole prototype is the North Star. A footer on every screen: "North Star concept by Aleksa Simeunović. Not built or tested. Not part of the UN engagement."

## 6. The product model

GSA maintains a current working picture of Milan's farm using existing government data and asks him to confirm what may have changed. The shift is from reconstructing his farm every year to confirming it. Milan is still responsible for what he declares and submits.

### The four ideas
1. **Start with the known state of the farm.**
2. **Detect possible changes and ask about them** (one clear question per change: yes, no, or a pick from a list).
3. **Assemble the wizard around his farm** (from the first application, more so from the second).
4. **Continuously tell him whether the application is ready** and, separately, what could change his payment.

### Who decides what
| | GSA, automatically | Milan decides | Jelena or the record's owner |
|---|---|---|---|
| Gather | Loads records and last year's application; checks he's an active farmer | | |
| Detect | Finds what may have changed | | |
| Ask | One question per change | Whether each change is true, and his own value if not | |
| Adapt | Hides unneeded steps, shrinks unchanged ones, opens changed ones on the change | Where a field ends, which crop, which measures | |
| Status (always) | Gives every item a status; payment impact apart | | |
| Conflicts (any time) | Keeps both values, explains, never guesses | Sends Jelena a problem he can't solve | Jelena helps; the record's owner decides the official record |
| Submit | Shows "Ready to submit" and what's awaiting verification | Submits under full liability | The state still inspects and checks eligibility |

### Authority over data
A record never overwrites Milan's answer, and his answer never overwrites an official record. When they differ, GSA keeps both, shows them side by side, says who settles it, and marks the item awaiting verification. Satellite data only flags; it never decides what he planted.

### Status (per item) vs payment impact
- `complete`: answered, nothing left to do.
- `action_required`: a change he hasn't answered or a problem to fix.
- `awaiting_verification`: his answer differs from a record; both kept until the owner settles it.
- **Payment impact** is a separate field (amount + reason). An item can be complete and still lower the payment (the road strip). Never colour or rank status by money.

### Application state (derived, never stored)
`waiting_for_renewal` → `action_required` → `ready_to_submit` → `submitted`.
- Any `action_required` item, or no renewal, blocks submission (product decision).
- Payment impact never blocks.
- `awaiting_verification` does not block; only that part waits. Label this in design notes as **assumption to confirm with the ministry**.
- "Ready to submit" means nothing needs his action. It does not mean approved. Always list what the state will still check.

### Wizard generation rules (pure function, unit-tested)
| When | Then |
|---|---|
| The farm has nothing a step asks about | Step hidden (no animals → no herd step) |
| A step hasn't changed since last year | Shrinks to one confirmation |
| A step has an open change | Opens on the change, other items still shown |
| A rule doesn't apply to his farm | Left out |
| Choosing measures | Ones that fit come first, with the reason; full list stays |
| Progress | Bar counts only the steps he has |
| Advisor signs in | Same steps, denser, what needs action first |

## 7. Scenario data (Milan, second year)

Use exactly these facts. Don't invent research findings or extra numbers.

- **Farm:** active farmer status renewed (scenario toggle can make it not renewed). Application window: 10 April to 26 May; show days left.
- **Herd:** last year declared 41 cattle. Animal registry today: 38 (registry has headcount only, no history). Milan knows why: 4 sold, 2 slaughtered, 3 calves born. 14 cows calved between 1 April 2025 and 31 March 2026.
- **Land:** five fields, 9.00 ha total. Use local-style names:
  - River field, 2.40 ha, wheat last year. Satellite: lower part looks different. The lower half floods every spring; this year sunflowers there, wheat on the rest.
  - Road field, 1.80 ha, maize. Land map: 0.12 ha strip now marked as road (wider road).
  - Upper field, 2.00 ha, wheat. Unchanged.
  - Meadow, 1.50 ha, grassland/fodder. Unchanged.
  - House field, 1.30 ha, maize. Unchanged.
- **Measures (real 2026 rates):**
  - Basic support for plant production: 18,000 dinars per hectare, justified with input receipts. Fits: he farms arable land.
  - Cows raising calves for fattening: 20,000 dinars per cow that calved 1 Apr 2025 to 31 Mar 2026. Fits: 14 cows calved.
  - One measure that doesn't fit, in the full list only (e.g. an eco-scheme practice with its condition stated).
- **Estimate:** 9.00 × 18,000 + 14 × 20,000 = 442,000. After the road: 8.88 × 18,000 + 280,000 = 439,840, shown as "about 440,000", with "The road took 0.12 ha. About 2,200 dinars less." Splitting the river field doesn't change the estimate (same rate per hectare). Label: "Estimated subsidy based on current information", covers only this application, assumptions visible on request (rates, eligible area, cows that calved), "The payment still depends on inspection and final eligibility."
- **Jelena:** PSSS advisor in Čačak, about 20 applications a day, studied agronomy.
- **Neighbour (advisor mode only):** has a parcel still in his late father's name; he sent just that problem to Jelena.

## 8. The four moments (build as one connected experience)

Earl: "Think of these as one connected experience rather than four separate features." And: how the wizard changes as a result of Milan's answers "is probably the defining moment of the entire North Star."

### Moment 1: Welcome back (application overview)
- Greeting, application window and days left, active farmer status.
- "Three things may have changed since last year." Each change is a card: what the record shows, its source in plain words ("The animal registry shows 38 cattle. Last year you declared 41."), and the question.
- **Live wizard preview** beside or below the cards: "Your application this year" listing the steps he'll have. It starts from the full set and visibly reassembles as he answers (see Moment 3).
- Readiness summary and the estimate (separate blocks).

### Moment 2: Confirming changes
- Herd: "Do you have 38 cattle now?" Yes → herd complete, herd step becomes one confirmation. Note what it replaced, small: "Before, this meant changing nine ear tags one by one."
- River field: "Are you growing two crops in the river field?" Yes → land step opens on the river field (action required until he splits it and picks crops). No → options: redraw the field, or ask for a field check; note this part won't count unless checked.
- Road: "Did the road take part of this field?" Yes → complete; area and estimate drop with the reason shown. No → he marks the strip and asks for a correction (awaiting verification).
- **Disagreement path (must be fully built):** Herd "No" → "How many cattle do you have today?" → he enters 41 → GSA shows **registry 38 | you declared 41** side by side, explains "The registry stays the official record until it's checked", item becomes awaiting verification, offers "Ask the registry to check" and "Send to Jelena", then "Carry on with your application". He never hits a dead end.
- Every question also offers "Why am I seeing this?" (static, plain explanation of the signal; not an AI chat).
- Answers are editable later; changing one re-runs the wizard generator.

### Moment 3: The adaptive wizard and parcel mapping
- For Milan's second year, 8 tested steps become 4: **Herd, Land, Everything else (one confirmation), Submit**. Progress bar counts 4.
- **Compare view** (toggle "Compare with the tested 8-step wizard"): show each tested step and what happened to it:
  - General data → folded into Everything else (records, read-only, confirm once)
  - Measures → Everything else (last year's confirmed, fitting ones first, with reasons)
  - Parcels → Land (opens on the changed fields, all parcels still shown)
  - Animal measures → Herd (one confirmation)
  - Attachments → Everything else (asked only if a document is missing)
  - Declarations → Submit (signed once)
  - Conditionality → rules that don't apply left out
  - Summary → replaced by readiness on every screen
- **Land step:** all five fields shown as a list and an SVG map (no map library, no tiles). Opens focused on the river field. Layers with a plain-words legend: *your field* (what you sow), *physical block* (land that can get support), *cadastral parcel* (the legal plot, shown for reference only). Road strip hatched. Satellite flag shown as a patterned area.
- **Split interaction:** "Draw one line where the sunflowers start." Drag the two ends of a line across the field; the line is clipped to the field (guardrail: nothing outside eligible land). Both areas update live. Accessible alternative: "Use a slider instead" (keyboard). Then pick a crop for each part from a list. Undo available. On confirm: river field complete.
- Each step header shows its own status.

### Moment 4: Continuous readiness to submission
- **Readiness bar on every screen** (top on mobile, side panel on desktop): "2 things need your action" / "Ready to submit". Counts by status, text plus icon shape (never colour alone). Opens a drawer listing items grouped by status, each linking to where it's fixed.
- Readiness changes are announced to screen readers (aria-live, polite).
- **Estimate block is separate** from status, with change reasons and "How is this worked out?".
- **Everything else:** one screen confirming records (general data read-only, with "Records wrong? Ask for a correction" instead of editing), measures kept from last year (fitting ones first, each with one plain sentence: what it pays for, *your part*, why it fits), documents (input receipts: show as attached; scenario toggle makes one missing → action required with upload from computer or phone).
- **Submit:** what's complete, what's awaiting verification and that it doesn't block (assumption), what the state will still check, declarations signed once ("I confirm under full criminal and material liability..."), one clear Submit button. If blocked: say exactly what's left, linked.
- **Receipt:** "Your application is submitted." Date, reference number, what happens next, what's still awaiting verification, how to amend until the national deadline. Never ambiguous.
- Renewal gate (scenario): first screen says renewal is needed, links to it (mock), lets him prepare but not submit; after renewal: "You're an active farmer. Next: your application."

### Supporting (after the four moments)
- **First-year scenario:** no last year's application. Wizard still adapts: no animals → no herd step; registry data becomes a question ("The animal registry shows 41 cattle on your farm. Is that your herd today?"); each field drawn once becomes next year's starting point. Keep this light.
- **Advisor mode (Jelena):** sign in as Jelena via prototype controls. Same information architecture, denser: a queue of only escalated problems (Milan's herd discrepancy with both values and his note; the neighbour's inherited parcel), each with full context attached. Keyboard shortcuts (next/previous/open), a bulk action, action history per application (who did what, when). The aim: her time goes to hard cases, not data entry.

## 9. Technical setup

- **Vite + React + TypeScript.** No router library: a tiny hash-based screen state (works on GitHub Pages without 404s).
- State: one `useReducer` store in `src/state/`. Derived values (steps, statuses, application state, estimate) are **pure functions** in `src/logic/`, never stored.
- Unit tests with Vitest for `src/logic/` only.
- Autosave the store to `localStorage` wrapped in try/catch; the app must work without it. Show a quiet "Saved" indicator.
- Data in `src/data/scenarios.ts` (all facts from section 7, nothing hardcoded in components).
- All UI text in `src/copy/en.ts` (English for Earl; Serbian later). British spelling, plain language, short sentences, no em dashes, no jargon. Field and place names may stay local.
- Deploy: GitHub Actions workflow to GitHub Pages; set Vite `base` to the repo name. README with run and deploy steps (short).
- No backend, no real APIs, no map library, no analytics.

### Folder structure
```
src/
  ui/          primitives only: Button, Card, Field, RadioGroup, StatusBadge,
               Stepper, Drawer, Banner, Note (design note tag)
  screens/     WelcomeBack, Herd, Land, EverythingElse, Submit, Receipt,
               Renewal, AdvisorQueue
  components/  ChangeCard, WizardPreview, CompareView, ReadinessBar,
               ReadinessDrawer, EstimateBlock, FieldMap, SplitTool,
               ConflictPanel, SendToJelena, PrototypeControls
  logic/       wizard.ts, status.ts, readiness.ts, estimate.ts, geometry.ts (+ tests)
  state/       store.ts, actions.ts, persist.ts
  data/        scenarios.ts
  copy/        en.ts
```

## 10. Phases (stop after each; Aleksa checks and commits)

1. **Foundation:** scaffold, data, store, `logic/` with tests (wizard generator incl. compare mapping, status, application state, estimate incl. road delta, polygon split areas). No screens beyond a debug list. *Check:* tests pass; changing answers in the debug view changes steps and readiness.
2. **Moments 1 and 2:** Welcome back, change cards, all yes/no paths, herd disagreement path, Why am I seeing this, live wizard preview, readiness bar and drawer, estimate block.
3. **Moment 3:** 4-step wizard with adaptive progress bar, compare view, Herd confirmation step, Land step with SVG map, legend, split tool and slider alternative.
4. **Moment 4:** Everything else, Submit (blocking rules, awaiting verification note), Receipt, renewal gate.
5. **Prototype controls and design notes:** floating "Prototype" button opening a clearly separated panel (dashed border, "Not part of GSA"): scenario (second year / second year, not renewed / first year / no animals / missing document), sign in as Milan or Jelena, show design notes, reset. Design notes toggle shows small tags on elements: *Tested (44 sessions)*, *North Star proposal*, *EU mandate*, *Assumption to confirm with the ministry*.
6. **Advisor mode** and first-year scenario.
7. **Deploy:** GitHub Pages workflow, README, final pass on the acceptance checklist.

## 11. Ready for a design system later

Aleksa will later apply a design system based on Untitled UI (React, Tailwind, React Aria) with a three-tier token system. So:
- Components outside `src/ui/` never contain styling decisions; they compose primitives.
- Primitives use semantic props (`variant="primary"`, `status="awaiting_verification"`, `density="comfortable" | "compact"`), not visual ones.
- Density is a context: Milan = comfortable (larger targets, more explanation), Jelena = compact. Same components.
- Never commit Untitled UI PRO files to this repository.

## 12. Accessibility and UX non-negotiables

- Semantic HTML, every input labelled, visible focus ring, full keyboard use, logical heading order.
- Touch targets at least 44 × 44 px in comfortable density; body text at least 16 px.
- Status always shown as text plus icon shape, never colour alone.
- Errors say what happened and how to fix it, and link to the place.
- One primary action per screen. Back never loses answers.
- No modal traps; drawers close with Esc and return focus.
- Copy answers Milan's question on every screen: "Is my application ready?"

## 13. Acceptance checklist (Earl's feedback, Oct 5 to Oct 16)

- [ ] North Star is the smartest version of the wizard, not a different product; no AI chat.
- [ ] Opens with what GSA knows; asks only about what changed.
- [ ] The wizard visibly reassembles as Milan answers; progress bar counts only his steps; 8 → 4 comparison is clear.
- [ ] Readiness spans the whole flow, not a final stage; conflicts are a branch that returns to the application.
- [ ] Status (complete / action required / awaiting verification) is separate from payment impact.
- [ ] "Ready to submit", never "safe"; ready isn't approved; what the state still checks is listed.
- [ ] 38 vs 41: both values kept, explained, awaiting verification, resolvable, no dead end.
- [ ] Which issues block submission and which don't is explicit; non-blocking verification is labelled an assumption.
- [ ] Satellite only flags; Milan decides what he planted.
- [ ] Estimate labelled as an estimate with assumptions visible; it is not the hero.
- [ ] Advisor mode by role, not settings; escalation carries one specific problem.
- [ ] Tested, North Star, mandate and assumptions are distinguishable (design notes).
- [ ] Every problem P1 to P12 is answered somewhere in the flow.
