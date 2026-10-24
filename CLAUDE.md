# GSA North Star: low-fidelity coded prototype

You are building a clickable, low-fidelity prototype of Aleksa Simeunović's **GSA North Star**: his own proposal for how Serbia's agricultural subsidy application (GSA) could evolve beyond the version he designed and tested with 44 farmers and advisors for UN FAO. It is a portfolio piece reviewed by his mentor, Earl Friedberg.

This file is the single source of truth. Read it fully before planning. If something here is unclear or contradicts itself, ask Aleksa instead of guessing.

## 1. Goal and the rules

**Goal:** prove the best possible user experience, not visuals. Earl must be able to open a link and, in under five minutes, see GSA show the evidence, Milan decide, and the application shrink after each answer to only what's left, all the way to the receipt.

**The one rule (the product's core principle):**
> The complexity of the application should reflect the complexity of the farm, not the complexity of the government's policies.

**Key line:** the application is generated around Milan's farm rather than fixed around the government's process. GSA does the thinking so Milan has to think as little as possible. It must not feel like a simplified form (fewer questions, shorter wizard).

**Removal is the default.** Every sentence, card, badge, note and control must help Milan decide or act right now. If it doesn't, cut it. Never add text to explain the UI; fix the UI instead.

**No AI interface.** AI works behind the scenes (detecting changes, matching records, plain-language explanations). Eligibility, money, official records and declarations stay predictable and auditable. Milan never has to care what uses AI.

**Low fidelity means:** greyscale, system font, plain boxes and borders, no brand, no illustrations, no animation beyond a short transition that explains a change. Hierarchy still matters: the next action is the most visible thing on every screen. Spend effort on flow, states, copy, logic, accessibility and edge behaviour. A design system is applied later by Aleksa (section 11), so structure the code for that. **One exception: maps are real.** Every map is an OpenLayers map on the real satellite photo near Bečanj that Milan can pan and zoom, because the photo is the evidence and he recognises his land on it. The UI around the map stays greyscale.

**Less cognitive effort, not fewer steps (Earl, 23 Oct call).** Welcome back must feel like a guided experience, not a dashboard of problems. At any moment the screen answers three questions in this order: what to do next, what is already done, what can wait.

## 2. How to work (token budget matters)

- Work **one phase at a time** (section 10). For a round of feedback, decide and build; don't ask Aleksa to approve plans. Recommend when a design question comes up, log it in `docs/decisions.md`.
- Keep chat output short: no long explanations, no recaps of code you wrote. At the end of a phase, list what to click to check it, in under 10 lines.
- Don't re-read files you just wrote. Make small, targeted edits.
- Ask before adding any dependency beyond those in section 9 (OpenLayers is approved).
- No CSS beyond one small `src/styles.css` (layout, spacing, focus rings, greyscale). No CSS frameworks yet.
- Tests: only unit tests for the pure logic in `src/logic/`. No UI tests. Update the tests when a rule changes.
- Commit at the end of each phase with a one-line message.
- When Aleksa links a doc, board or email, use it to understand intent. Don't copy its text into the UI or into this file.
- Keep a decision log in `docs/decisions.md`: one line per decision (what was chosen, the alternative rejected, why).

## 3. The problem being solved (from the Before story)

Milan Dragović, 63, Bečanj near Čačak. Wheat, maize and a small herd of cattle. Knows his land; unsure of the old family computer. Subsidies are the part of his income the weather can't touch, so applying weighs on him.

Every feature must trace back to one of these problems. If a feature doesn't, don't build it.

| # | Problem (Before) | How the prototype answers it |
|---|---|---|
| P1 | Measures opened at different times; only national TV said when | One application a year (EU mandate). Home shows the deadline and days left |
| P2 | He renewed his farm and thought he had applied | Renewal is a gate, never a finish line. After renewal: "You're an active farmer. Next: your application." Submission ends on an unmistakable receipt |
| P3 | Answers had to match three registries; he left the app to copy numbers | GSA brings registry data in. He never leaves the app to look anything up |
| P4 | Matching cadastral parcels to fields; never needed a cadastral number | Map-first, in plain words. No technical land terms. Cadastral parcels hidden by default |
| P5 | Second year: each sold or lost animal removed by ear tag | One question: "Do you have 38 cattle now?" |
| P6 | A field turned to sunflowers had to be redrawn with Jelena | GSA proposes the split line from the satellite flag; he accepts or nudges it |
| P7 | Nothing points to what has changed; he checks line by line | GSA shows what may have changed, with the evidence, before asking |
| P8 | Three or four office visits per subsidy | He sends Jelena one specific problem from inside GSA, only if needed, and sees who acts next |
| P9 | Used too rarely to remember | One list that always shows the next action, plain language, autosave and resume |
| P10 | A mistake costs too much; fear of submitting | Status on every item, payment impact shown apart, "Ready to submit" (not "safe"), what the state still checks |
| P11 | Paying an agency up to €40 for a free application | Self-service that a 63-year-old can finish alone |
| P12 | Jelena types other people's applications, a "counter clerk" | Advisor mode: only hard cases reach her, ordered by what matters, each showing who acts next |

Also from FAO field research (citable): about 70% of farmers own a smartphone and under half of 55 to 74 year olds use computers, so **design mobile-first** (360 px wide baseline) and make it work on desktop. Sessions used to expire mid-entry, so **never lose an answer** (autosave). Farmers missed the final "finish" button, so **submission must be unambiguous**. There was no action history across advisors, so **keep a history** of who did what.

## 4. Research quotes (rationale only, never shown in the UI)

Translated from Serbian by Aleksa, from the 44 usability sessions of the tested prototype.

Farmers:
1. The map with in-app helpers made drawing easy even though they didn't know the difference between cadastral parcel, physical block and agricultural parcel. → don't teach the terms; use plain labels and explain a boundary only when it stops an action.
2. They could finally see what each measure is about and how their household fits, and didn't need to go to Jelena for everything. → plain-language measures with "your part".
3. They felt more confident to submit because they always had an overview of potential errors; before, they were unsure and feared losing money they need. → continuous readiness.

Advisors:
1. Overloaded; people delegate responsibility to have someone to blame; sending farmers to several institutions felt like an unsolvable puzzle. → GSA brings records together, says who acts next on each problem, and escalates only specific problems.
2. Seven farmers a day with different knowledge gaps; the app should teach them about measures and their part in them. → each measure states what it pays for, what Milan must do, and why it fits his farm.
3. The old app made her repeat the same action many times. → advisor mode: shortcuts, issues first.

## 5. Tested vs North Star (distinguishable in design notes)

- **Tested** (built for FAO, 44 sessions, 8-step wizard): plain-language measures, registry prefill of the herd, drawing fields on a satellite photo kept inside eligible land, errors linked to the answer that needs fixing, last year's fields return in year two.
- **North Star** (Aleksa's proposal, not built or tested, not UN scope): the whole prototype, built on the four ideas below.
- **Mandated** (EU rules, not Aleksa's decision): one application a year; pre-filled forms from last year and the animal database; satellite monitoring exists.
- **Assumption to confirm with the ministry:** items awaiting verification don't block submission; amendments allowed until a national deadline.

Design notes are off by default and appear only where they mark a real distinction (tested, EU mandate, assumption, and "AI behind the scenes" on change detection, the satellite flag and the suggested split line, so Earl sees where AI works). Since everything is North Star, don't tag things as North Star. Points that matter for the case study become design notes, never UI copy.

## 6. The product model

GSA maintains a current working picture of Milan's farm using existing government data and asks him to confirm what may have changed. The shift is from reconstructing his farm every year to confirming it. Milan is still responsible for what he declares and submits.

### The four ideas
1. **Start with the known state of the farm.**
2. **Detect possible changes, show the evidence, then ask** (one clear question per change: yes, no, or a pick from a list).
3. **Assemble the application around his farm**: remove work that isn't needed, collapse work that's done, point to what's next.
4. **Continuously tell him whether the application is ready** and, separately, what could change his payment.

### Who decides what
| | GSA, automatically | Milan decides | Jelena or the record's owner |
|---|---|---|---|
| Gather | Loads records and last year's application; checks he's an active farmer | | |
| Detect | Finds what may have changed, with its evidence (record, map, satellite photo) | | |
| Ask | One question per change, evidence first | Whether each change is true, and his own value if not | |
| Adapt | Removes work that isn't needed (with a one-line reason), collapses done work, proposes a split line from the satellite flag, focuses the next action | Where a field ends, which crop, which measures | |
| Status (always) | Gives every item a status; payment impact apart | | |
| Conflicts (any time) | Keeps both values, explains, never guesses, shows who acts next | Sends Jelena a problem he can't solve | Jelena helps; the record's owner decides the official record |
| Submit | Shows "Ready to submit" and what's awaiting verification | Submits under full liability | The state still inspects and checks eligibility |

### Authority over data
A record never overwrites Milan's answer, and his answer never overwrites an official record. When they differ, GSA keeps both, shows them side by side, says who settles it, and marks the item awaiting verification. Satellite data only flags; GSA may suggest a split line from it, but it never decides what he planted.

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

### Application list rules (pure function, unit-tested)
The application is one list of named tasks. It is also the readiness view.
| When | Then |
|---|---|
| The farm has nothing a task asks about | Task not in the list (no animals → no herd task) |
| A possible change is detected | Its own task, opening on the evidence and the question |
| An answer makes work unnecessary | That work leaves the list with a one-line reason |
| A task is done | It collapses to one line with its outcome |
| Something GSA already has | A named confirmation in its own part ("To confirm"): your details, cows that calved, your other fields, your input receipts, each shown and confirmed in one tap. Never a miscellaneous bucket. A correction asked for waits for a check where it is |
| Something needs attention | Its own named task, e.g. "Upload your input receipts" |
| A rule doesn't apply to his farm | Left out |
| Choosing measures | Ones that fit come first, with the reason; full list stays |
| Parts | The application comes in parts, in order: Your details, Animals, Land, Measures, Documents, Check and submit. Every task belongs to the part it is about. A part his farm has nothing for is left out (no animals, no Animals part). The point is not fewer steps; it is less effort per step and better, more personal questions |
| Always | Inside the open part, exactly one next action, open, the most visible thing on screen. Once the part is done, "Continue: <next part>" is the primary action |
| Kinds of work | Within each part, three kinds, each with its own label and mark, changes first because they shape the rest: **Changes GSA found** (something may differ from the records; he verifies it), **Your choices** (decided every year regardless of changes, e.g. measures and what they need), **To confirm** (what GSA already has; he confirms it is still right) |
| Advisor signs in | Same list, denser, what needs action first |

Structure by what Milan has to accomplish, not by the smallest step count. There is no target number of steps.

## 7. Scenario data (Milan, second year)

Use exactly these facts. Don't invent research findings or extra numbers.

- **Farm:** active farmer status renewed (scenario toggle can make it not renewed). Application window: 10 April to 26 May; show days left.
- **Pigs:** the animal registry shows 3 pigs; none declared last year. Question: only for the household? (household pigs needing no declaration is an assumption).
- **Herd:** last year declared 41 cattle. Animal registry today: 38 (registry has headcount only, no history, so never show a breakdown of movements). Milan knows why: 4 sold, 2 slaughtered, 3 calves born. 14 cows calved between 1 April 2025 and 31 March 2026.
- **Land:** five fields, 9.00 ha total. Use local-style names:
  - River field, 2.40 ha, wheat last year. Satellite photo: lower part looks different. The lower half floods every spring; this year sunflowers there, wheat on the rest.
  - Road field, 1.80 ha, maize. Land map: 0.12 ha strip now marked as road (wider road).
  - Upper field, 2.00 ha, wheat. The neighbour's new declaration runs 5 m (0.10 ha) into last year's drawing. Yes: GSA moves his edge (about 1,800 dinars less). No: he draws where his field ends on an OpenLayers map.
  - Meadow, 1.50 ha, grassland/fodder. Unchanged.
  - House field, 1.30 ha, maize. Unchanged.
- **Measures:** 12 in the list, 10 fit his farm, 2 don't (organic, milk premium). Last year he had the first two:
  - Basic support for plant production: 18,000 dinars per hectare (real 2026 rate), justified with input receipts.
  - Cows raising calves for fattening: 20,000 dinars per cow that calved 1 Apr 2025 to 31 Mar 2026 (real 2026 rate). 14 cows calved.
  - Fertiliser, diesel, certified seed, insurance, quality breeding cattle, artificial insemination, green cover over winter, watering fields: no rates (never invent one); each states what it pays for and what it needs (uploads, numbers, text, a choice, fields, a promise). Data in `scenarios.ts`.
- **Estimate:** 9.00 × 18,000 + 14 × 20,000 = 442,000. After the road: 8.88 × 18,000 + 280,000 = 439,840, shown as "about 440,000", with "The road took 0.12 ha. About 2,200 dinars less." Splitting the river field doesn't change the estimate (same rate per hectare). Label: "Estimated subsidy based on current information", covers only this application, assumptions visible on request (rates, eligible area, cows that calved), "The payment still depends on inspection and final eligibility."
- **Jelena:** PSSS advisor in Čačak, about 20 applications a day, studied agronomy.
- **Neighbour (advisor mode only):** has a parcel still in his late father's name; he sent just that problem to Jelena. Referring it to the land registry means waiting for that office, not handled.
- **Added in round 5 at Aleksa's request (more problems per part):**
  - Your details: the bank closed the farm account ending 0417 on 3 March 2026 and reported a new one in his name ending 2291 (Yes: paid there; No: he types the 18-digit account). The population register shows his grandson Luka Dragović now living at his address (member of the farm household? Doesn't change the estimate).
  - Animals: the 14 cows that calved come from the animal registry; he confirms them, seeing they pay about 280,000 dinars, or asks the registry to check.
  - Land: satellite photos saw no mowing or grazing on the meadow last summer. Yes, he will mow or graze it; No leaves the meadow out (1.50 ha, about 27,000 dinars less).
  - Measures: GSA suggests green cover over winter (satellite: the wheat fields, river and upper, stayed green all winter; those fields are filled in for him) and artificial insemination (registry: 9 inseminations by his vet since last April). Never a rate.
  - Documents: Diesel receipt.jpg is too blurry to read the amount; he sends a new photo.

## 8. Milan's journey (one connected flow)

Earl: one connected experience, not separate features. How the application changes as a result of Milan's answers is the defining interaction of the North Star.

**Flow:** welcome back → changes → land → readiness → submit → receipt. All of it reads as one application list that shrinks to what's left.

### Welcome back: a stepper, and one obvious next action in each part
- Greeting, deadline and days left, then the **stepper**: every part of his application, which one is open, which are done, how much is left in each (numbers only on a phone, with the open part named underneath). Any part can be opened.
- Inside a part: the one next task on the left, full width of its column ("Start with your account for payments" first); on the right, where "Your farm" used to be, the part at a glance: done ✓, now →, later ○, grouped by kind. On a phone it sits below. A finished part says so, with "Continue: <next part>".
- Back in the action bar goes to the previous part; forward is the next task in the part, then the next part.
- **Progressive disclosure:** only the open part is shown; what an answer changed appears after the answer; detail opens on request.
- **More problems, asked as GSA's best guess** (at Aleksa's request): each part has several, and each is asked from a record so the usual answer is one tap; work appears only on No (see section 7).
- After each decision, the next action takes the top slot, done work collapses, and work that isn't needed leaves with a one-line reason ("After your answer", with Undo). The application visibly changing after each answer is the defining interaction.
- A short transition may explain each change (respect `prefers-reduced-motion`). Changes are announced with `aria-live`.
- **"Your farm this year" and the estimate are on the last part, Check and submit**, beside what waits for a check, what the state still checks and the declaration. The farm shows every part and where it comes from ("From government records", "Confirmed by you", "Waiting for a check").
- The estimate stays a separate block at body size, never mixed with status: the amount, then, while anything that could change it is unanswered, that it is provisional and what it waits for. What changed it and how it is worked out open on request.
- The page is light grey and every element on it white, so cards, the outline and the stepper stand out.

### Change cards: evidence before the question
A card is one line of context (what GSA found, and where), the evidence, the question and the actions. The changes are different kinds of decision, so the cards differ:
- **Herd and pigs:** a number is easy to check, so the card stays a simple confirm. Last year 41, registry today 38, yes or no. No invented breakdown.
- **Map changes (river field, road strip, upper field):** the card shows the place, not a description: a small preview on the satellite photo with the affected area highlighted. The road card shows the exact strip the government believes is no longer farmland, its size (0.12 ha) and the payment impact (about 2,200 dinars less). The primary action is **"Review this boundary"**, which opens the map at that area; he answers there, with the map in front of him, not from text. This shows that GSA already knows things he shouldn't have to reconstruct.
- "Why am I seeing this?" only where it adds something the evidence doesn't already show.

Paths:
- Herd yes → herd complete. Herd no → "How many cattle do you have today?" → he enters 41 → **registry 38 | you declared 41** side by side, "The registry stays the official record until it's checked", awaiting verification, he can ask the registry to check or send it to Jelena, and carry on. Never a dead end. This is the one meaningful disagreement with a government record.
- River yes → the river field split becomes the next action. River no → his declaration stands (one crop), complete, estimate unchanged; "The state may still check it" (assumption).
- Road yes → complete; area and estimate drop with the reason shown. Road no → the correction is sent in the same step (awaiting verification); the land map's area counts until checked.
- Herd disagreement also says "This doesn't change your estimate" (the estimate uses cows that calved).
- Answers stay editable; changing one re-runs the list rules.

### Land: real maps in plain language, and the suggested split
- Every map is OpenLayers on the real satellite photo (loaded only when a map is shown). He can pan, zoom (buttons, pinch, wheel once the map has focus, keyboard), go back to the field or see the whole farm, and enlarge the map. Previews on cards are still pictures of the same map; the review map is the one he moves around. The split line and drawing where a field ends sit on that same satellite map. Card previews stay small; the review map is large but leaves the question in view.
- Plain labels and clearly different boundary styles, e.g. "Land the government has registered" vs "Draw the area you actually farm". No technical terms. No key. Cadastral parcels kept in the data as reference, never drawn. Road strip hatched; satellite flag patterned.
- When a boundary stops an action, explain why at that moment, in place.
- **Split:** GSA proposes the line along the area the satellite flagged. Milan accepts it or nudges it: large handles, drag the whole line. No precise point placement with a finger. Keep the guardrail (line clipped to eligible land), live areas (on the map and in the crop labels), undo (shown once there is something to undo) and the slider as the accessible alternative. Then a crop for each part. On confirm: river field complete.

### Readiness through submit
- Readiness is the application list itself, with a one-line summary on every screen ("16 things left before you can submit" / "Ready to submit"), text plus icon shape, announced politely; the stepper shows what's left per part.
- Confirmations sit in their part: his details (records, read-only, incl. active farmer, "Records wrong? Ask for a correction"), cows that calved, his other fields, his receipts (the files listed). Measures are chosen in Measures (fitting ones first, each with the amount worked out, *your part*, why it fits). Missing receipts become their own task, "Upload your input receipts".
- **Submit:** what's complete, what's awaiting verification and that it doesn't block (assumption), what the state will still check, declaration signed once ("I confirm under full criminal and material liability..."), one clear Submit button. If blocked: say exactly what's left, linked, and make that the primary action.
- **Receipt:** "Your application is submitted." Date, reference number, what happens next, what's still awaiting verification, how to amend until the national deadline. Never ambiguous.
- Renewal gate (scenario): first screen says renewal is needed, links to it (mock), lets him prepare but not submit; after renewal: "You're an active farmer. Next: your application."

### Jelena (advisor mode): small, don't let it grow
- Sign in as Jelena via prototype controls. A queue of only escalated problems (Milan's herd discrepancy with both values and his note; the neighbour's inherited parcel), each with full context.
- Case states say who owns the next action: **assigned to Jelena**, **waiting for another office** (named), **waiting for the farmer**, **resolved**. Referring to the land registry is waiting, not resolved.
- Desktop first (checked at 1280 px). Grouped by state; within hers: blocks submission, then close to the deadline. The national deadline shows only within 7 days.
- Primary action is the likely next step: refer to the record's owner; resolve once the owner has it.
- Milan sees the same state on his item, e.g. "Jelena asked the animal registry to check."
- Keyboard shortcuts and an action history per application (who did what, when).

## 9. Technical setup

- **Vite + React + TypeScript.** No router library: a tiny hash-based screen state (works on GitHub Pages without 404s).
- State: one `useReducer` store in `src/state/`. Derived values (application list, statuses, application state, estimate) are **pure functions** in `src/logic/`, never stored.
- Unit tests with Vitest for `src/logic/` only.
- Autosave the store to `localStorage` wrapped in try/catch; the app must work without it. Show a quiet "Saved" indicator.
- Data in `src/data/scenarios.ts` (all facts from section 7, nothing hardcoded in components).
- Deploy: GitHub Actions workflow to GitHub Pages; Vite `base` is the repo name. README with run and deploy steps (short).
- No backend, no real APIs, no analytics. OpenLayers (`ol`) for every map, with satellite tiles from Esri World Imagery (no key, attribution shown). The scenario's local metre grid is placed on the photo by one origin and rotation in `scenarios.ts`; all areas and rules stay in local metres (`src/logic/geo.ts` converts).

### Content rules
- All UI text in `src/copy/en.ts` (English for Earl; Serbian later). British spelling, plain language, short sentences, no em dashes, no jargon. Field and place names may stay local.
- Write for Milan, never for Earl. No "Before, this meant…", no "In this prototype…" lines in the product UI.
- Each phase deletes more from `src/copy/en.ts` than it adds. Report its word count before and after (3,189 words at the start of round 2).

### Folder structure
```
src/
  ui/          primitives only (Button, Card, Field, RadioGroup, StatusBadge, Drawer, Banner, Note, ...)
  screens/     composed screens (welcome/application list, land, submit, receipt, renewal, advisor queue)
  components/  composed pieces (change cards, FieldMap, SplitTool, ConflictPanel, SendToJelena,
               EstimateBlock, ReadinessBar, PrototypeControls, ...)
  logic/       pure rules + tests (list rules, status, readiness, estimate, geometry, advisor, submit)
  state/       store.ts, actions.ts, persist.ts
  data/        scenarios.ts
  copy/        en.ts
```

## 10. Phases (round 3; stop after each; Aleksa checks and commits)

Round 1 (foundation, four moments, prototype controls, advisor mode, deploy) and round 2 (one list, evidence cards, plain map, suggested split) are done. Round 3 makes Milan think less: (1) fewer decisions on arrival, next action on top, river and road No fixed, see what he confirms; (2) maps, split tool, copy cuts, desktop column, Jelena at a desk, AI design note.

1. **Review and CLAUDE.md update** (no code).
2. **Welcome back as one workflow:** contextual change cards with evidence, one application list that shrinks after each answer, "Everything else" replaced by named tasks.
3. **Land:** plain-language map and the suggested split line.
4. **Readiness through submit, Jelena's states and priority, scenario cuts, final content pass, `docs/acceptance.md`, deploy.**

Round 4 (Aleksa, 23 Oct): no stepper; an "After your answer" panel with Undo, a readiness drawer, a sticky action bar (Back, readiness, forward), GSA's next-step line, "Your farm this year", pigs and the neighbour overlap, OpenLayers drawing, 10 measures with their own inputs, Jelena's question and Milan's reply. See `docs/decisions.md` 55 to 68.

Round 5, third pass (Aleksa, decisions 88 onwards): a stepper with the parts of the application, each part with its own problems and confirmations, the part's outline on the right, "Your farm this year" and the estimate on the last part, a grey page with white elements, more problems per part.

Round 5 (Earl, 23 Oct call; decisions 69 onwards): one obvious next action at the top of Welcome back; three kinds of work kept apart (changes, choices, confirmations); map changes show the place with "Review this boundary"; real OpenLayers maps on the satellite photo everywhere; records vs confirmed in "Your farm this year"; a provisional estimate.

Prototype controls (floating "Prototype" button, clearly separated panel, "Not part of GSA"): scenario, sign in as Milan or Jelena, show design notes, reset. No new scenarios.

## 11. Ready for a design system later

Aleksa will later apply a design system based on Untitled UI (React, Tailwind, React Aria) with a three-tier token system. So:
- Components outside `src/ui/` never contain styling decisions; they compose primitives.
- Primitives use semantic props (`variant="primary"`, `status="awaiting_verification"`, `density="comfortable" | "compact"`), not visual ones.
- Density is a context: Milan = comfortable (larger targets), Jelena = compact. Same components.
- Never commit Untitled UI PRO files to this repository.

## 12. Accessibility and UX non-negotiables

- Semantic HTML, every input labelled, visible focus ring, full keyboard use, logical heading order.
- Touch targets at least 44 × 44 px in comfortable density; body text at least 16 px.
- Status always shown as text plus icon shape, never colour alone.
- Errors say what happened and how to fix it, and link to the place.
- One primary action at a time; it is the most visible thing on screen. Back never loses answers.
- When the list changes, move focus to the next action and announce the change (`aria-live="polite"`). Transitions respect `prefers-reduced-motion`.
- No modal traps; drawers close with Esc and return focus.
- Copy answers Milan's question on every screen: "Is my application ready?"

## 13. Acceptance checklist (Earl's feedback, Oct 5 to Oct 20)

- [ ] North Star is the smartest version of the application, not a different product, and not a simplified form; no AI interface.
- [ ] Opens with what GSA knows; asks only about what changed, with the evidence before the question.
- [ ] Herd, river and road cards look different because they are different decisions (number; map with satellite flag; map with strip, size and payment impact).
- [ ] Change cards and the application are one list. After each answer, done work collapses, unneeded work disappears with a reason, and the next action gets focus. One primary action at a time.
- [ ] No "Everything else". Unchanged things are named confirmations; anything needing attention is its own named task.
- [ ] Map in plain words; no technical land terms; cadastral parcels hidden by default; a boundary explains itself when it stops an action.
- [ ] The split line is proposed from the satellite flag; Milan accepts or nudges it with large handles; slider, undo, guardrail and live areas remain.
- [ ] Milan's journey runs end to end: welcome back, changes, land, readiness, submit, receipt.
- [ ] Readiness is the list itself, not a separate stage; conflicts are a branch that returns to the application.
- [ ] Status (complete / action required / awaiting verification) is separate from payment impact.
- [ ] "Ready to submit", never "safe"; ready isn't approved; what the state still checks is listed.
- [ ] 38 vs 41: both values kept, explained, awaiting verification, resolvable, no dead end.
- [ ] Which issues block submission and which don't is explicit; non-blocking verification is labelled an assumption.
- [ ] Satellite only flags; Milan decides what he planted.
- [ ] Estimate labelled as an estimate with assumptions visible; it is not the hero.
- [ ] Jelena's cases show who owns the next action, ordered by what matters; Milan sees the same state.
- [ ] Tested, mandate and assumptions are distinguishable (design notes, off by default).
- [ ] Every problem P1 to P12 is answered somewhere in the flow.
- [ ] `src/copy/en.ts` is shorter than at the start of the round.
- [ ] Welcome back leads with one obvious next action; the screen answers what to do next, what's done, what can wait, in that order, and discloses the rest progressively.
- [ ] A stepper shows the parts of his application, generated around his farm; each part has its own problems, asked so the usual answer is one tap; his farm and the estimate are on the last part.
- [ ] Changes GSA found, your choices and same-as-last-year are separate sections with their own labels and treatment.
- [ ] River, road and upper field cards show the place on the satellite photo; "Review this boundary" opens a map he can pan and zoom.
- [ ] "Your farm this year" says per item what comes from records and what he confirmed; the estimate says when it is provisional.
