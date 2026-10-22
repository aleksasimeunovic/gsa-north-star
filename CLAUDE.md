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

**Low fidelity means:** greyscale, system font, plain boxes and borders, no brand, no illustrations, no animation beyond a short transition that explains a change. Hierarchy still matters: the next action is the most visible thing on every screen. Spend effort on flow, states, copy, logic, accessibility and edge behaviour. A design system is applied later by Aleksa (section 11), so structure the code for that.

## 2. How to work (token budget matters)

- Work **one phase at a time** (section 10). Start each phase in plan mode, show a short plan, wait for approval, build, then stop.
- Keep chat output short: no long explanations, no recaps of code you wrote. At the end of a phase, list what to click to check it, in under 10 lines.
- Don't re-read files you just wrote. Make small, targeted edits.
- Ask before adding any dependency beyond those in section 9.
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

Design notes are off by default and appear only where they mark a real distinction (tested, EU mandate, assumption). Since everything is North Star, don't tag things as North Star. Points that matter for the case study become design notes, never UI copy.

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
| Something hasn't changed | A named confirmation (his details, his measures, his fields). Never a miscellaneous bucket |
| Something needs attention | Its own named task, e.g. "Upload your input receipts" |
| A rule doesn't apply to his farm | Left out |
| Choosing measures | Ones that fit come first, with the reason; full list stays |
| Always | Exactly one next action, the most visible thing on screen |
| Advisor signs in | Same list, denser, what needs action first |

Structure by what Milan has to accomplish, not by the smallest step count. There is no target number of steps.

## 7. Scenario data (Milan, second year)

Use exactly these facts. Don't invent research findings or extra numbers.

- **Farm:** active farmer status renewed (scenario toggle can make it not renewed). Application window: 10 April to 26 May; show days left.
- **Herd:** last year declared 41 cattle. Animal registry today: 38 (registry has headcount only, no history, so never show a breakdown of movements). Milan knows why: 4 sold, 2 slaughtered, 3 calves born. 14 cows calved between 1 April 2025 and 31 March 2026.
- **Land:** five fields, 9.00 ha total. Use local-style names:
  - River field, 2.40 ha, wheat last year. Satellite photo: lower part looks different. The lower half floods every spring; this year sunflowers there, wheat on the rest.
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
- **Neighbour (advisor mode only):** has a parcel still in his late father's name; he sent just that problem to Jelena. Referring it to the land registry means waiting for that office, not handled.

## 8. Milan's journey (one connected flow)

Earl: one connected experience, not separate features. How the application changes as a result of Milan's answers is the defining interaction of the North Star.

**Flow:** welcome back → changes → land → readiness → submit → receipt. All of it reads as one application list that shrinks to what's left.

### Welcome back: his application as one list
- Greeting, deadline and days left, active farmer status.
- One list: **his application**. The change tasks and the rest of his application are the same list, not cards on top and an overview underneath.
- It starts from the full set of possible work. As he confirms a change, GSA removes what isn't needed (one-line reason), collapses what's done, and the next meaningful action gets focus. One primary action at a time.
- A short transition may explain each change (respect `prefers-reduced-motion`). Changes are announced with `aria-live`.
- The estimate stays a separate block, never mixed with status.

### Change cards: evidence before the question
A card is one line of context (what GSA found, and where), the evidence, the question and the actions. The three changes are different kinds of decision, so the cards differ:
- **Herd:** last year 41, registry today 38, yes or no. No invented breakdown.
- **River field:** small map preview (reuse FieldMap) with the flagged area highlighted and its source (satellite photo).
- **Road:** map preview of the strip, its size (0.12 ha) and the payment impact (about 2,200 dinars less), all visible before he answers.
- "Why am I seeing this?" only where it adds something the evidence doesn't already show.

Paths:
- Herd yes → herd complete. Herd no → "How many cattle do you have today?" → he enters 41 → **registry 38 | you declared 41** side by side, "The registry stays the official record until it's checked", awaiting verification, he can ask the registry to check or send it to Jelena, and carry on. Never a dead end. This is the one meaningful disagreement with a government record.
- River yes → the river field split becomes the next action. River no → redraw the field, or ask for a field check (this part won't count unless checked).
- Road yes → complete; area and estimate drop with the reason shown. Road no → he asks for a correction (awaiting verification).
- Answers stay editable; changing one re-runs the list rules.

### Land: plain-language map and suggested split
- All five fields on an SVG map (no map library, no tiles), opening on the river field.
- Plain labels and clearly different boundary styles, e.g. "Land the government has registered" vs "Draw the area you actually farm". No technical terms. Legend shrunk or removed. Cadastral parcels hidden by default (reference only). Road strip hatched; satellite flag patterned.
- When a boundary stops an action, explain why at that moment, in place.
- **Split:** GSA proposes the line along the area the satellite flagged. Milan accepts it or nudges it: large handles, drag the whole line. No precise point placement with a finger. Keep the guardrail (line clipped to eligible land), live areas, undo and the slider as the accessible alternative. Then a crop for each part. On confirm: river field complete.

### Readiness through submit
- Readiness is the application list itself, with a one-line summary on every screen ("2 things need your action" / "Ready to submit"), text plus icon shape, announced politely.
- Unchanged things are named confirmations: his details (records, read-only, "Records wrong? Ask for a correction"), his measures (fitting ones first, each with what it pays for, *your part*, why it fits), his receipts. Missing receipts become their own task, "Upload your input receipts".
- **Submit:** what's complete, what's awaiting verification and that it doesn't block (assumption), what the state will still check, declaration signed once ("I confirm under full criminal and material liability..."), one clear Submit button. If blocked: say exactly what's left, linked, and make that the primary action.
- **Receipt:** "Your application is submitted." Date, reference number, what happens next, what's still awaiting verification, how to amend until the national deadline. Never ambiguous.
- Renewal gate (scenario): first screen says renewal is needed, links to it (mock), lets him prepare but not submit; after renewal: "You're an active farmer. Next: your application."

### Jelena (advisor mode): small, don't let it grow
- Sign in as Jelena via prototype controls. A queue of only escalated problems (Milan's herd discrepancy with both values and his note; the neighbour's inherited parcel), each with full context.
- Case states say who owns the next action: **assigned to Jelena**, **waiting for another office** (named), **waiting for the farmer**, **resolved**. Referring to the land registry is waiting, not resolved.
- Queue order: blocks submission, then close to the deadline, then waiting on others.
- Milan sees the same state on his item, e.g. "Jelena asked the animal registry to check."
- Keyboard shortcuts and an action history per application (who did what, when).

## 9. Technical setup

- **Vite + React + TypeScript.** No router library: a tiny hash-based screen state (works on GitHub Pages without 404s).
- State: one `useReducer` store in `src/state/`. Derived values (application list, statuses, application state, estimate) are **pure functions** in `src/logic/`, never stored.
- Unit tests with Vitest for `src/logic/` only.
- Autosave the store to `localStorage` wrapped in try/catch; the app must work without it. Show a quiet "Saved" indicator.
- Data in `src/data/scenarios.ts` (all facts from section 7, nothing hardcoded in components).
- Deploy: GitHub Actions workflow to GitHub Pages; Vite `base` is the repo name. README with run and deploy steps (short).
- No backend, no real APIs, no map library, no analytics.

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

## 10. Phases (round 2; stop after each; Aleksa checks and commits)

Round 1 (foundation, four moments, prototype controls, advisor mode, deploy) is done.

1. **Review and CLAUDE.md update** (no code).
2. **Welcome back as one workflow:** contextual change cards with evidence, one application list that shrinks after each answer, "Everything else" replaced by named tasks.
3. **Land:** plain-language map and the suggested split line.
4. **Readiness through submit, Jelena's states and priority, scenario cuts, final content pass, `docs/acceptance.md`, deploy.**

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
