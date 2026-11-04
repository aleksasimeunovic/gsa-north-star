# GSA North Star: low-fidelity coded prototype

You are building a clickable, low-fidelity prototype of Aleksa Simeunović's **GSA North Star**: his own proposal for how Serbia's agricultural subsidy application (GSA) could evolve beyond the version he designed and tested with 44 farmers and advisors for UN FAO. It is a portfolio piece reviewed by his mentor, Earl Friedberg.

This file is the single source of truth. Read it fully before planning. If something here is unclear or contradicts itself, ask Aleksa instead of guessing.

## 1. Goal and the rules

**Goal:** prove the best possible user experience, not visuals. Earl must be able to open a link and, in under five minutes, see GSA show the evidence, Milan decide, and the application shrink after each answer to only what's left, all the way to the receipt.

**The one rule (the product's core principle):**
> The complexity of the application should reflect the complexity of the farm, not the complexity of the government's policies.

**Key line:** the application is generated around Milan's farm rather than fixed around the government's process. GSA does the thinking; it must not feel like a simplified form.

**Fewer decisions, not easier ones (Earl, 26 Oct).** Before a task exists, ask whether it needs Milan's input this year. If not, GSA reuses it without asking.

**Know, suspect, don't know.** A photo or record is a fact, with its date. What it might mean is worded as a possibility, or left out. What GSA can't know becomes his question.

**GSA prepares, only Milan declares.** Nothing counts as declared without his tap.

**Removal is the default.** Every sentence, card, badge, note and control must help Milan decide or act right now. If it doesn't, cut it. Never add text to explain the UI; fix the UI instead.

**No AI interface.** AI works behind the scenes (detecting changes, matching records, plain-language explanations). Eligibility, money, official records and declarations stay predictable and auditable. Milan never has to care what uses AI.

**Look (round 7, Aleksa):** clean, modern and sleek, with little on screen, built on shadcn/ui (Tailwind + Radix) in natural colours: warm stone page, white cards. **One meaning per colour:** solid green fills only the primary action; done is a green tick plus the word; work not done yet is neutral, never an error; orange means look at this (a check, a lower payment); red means something is wrong and must be fixed. The open part and row are neutral, with a label. Every task and part has its own lucide icon; colour always comes with text and an icon. Hierarchy: the next action is the most visible thing on every screen. **Maps are real:** every map is an OpenLayers map on the real satellite photo near Bečanj that Milan can pan and zoom, because the photo is the evidence and he recognises his land on it.

**Less cognitive effort, not fewer steps (Earl, 23 Oct).** Welcome back is a guided experience, not a dashboard of problems: what to do next, what is done, what can wait, in that order.

## 2. How to work (token budget matters)

- Work **one phase at a time** (section 10). For a round of feedback, decide and build; don't ask Aleksa to approve plans. Recommend when a design question comes up, log it in `docs/decisions.md`.
- Keep chat output short: no long explanations, no recaps of code you wrote. At the end of a phase, list what to click to check it, in under 10 lines.
- Don't re-read files you just wrote. Make small, targeted edits.
- Ask before adding any dependency beyond those in section 9 (OpenLayers, lucide-react, Tailwind, shadcn/ui's Radix packages, class-variance-authority, clsx and tailwind-merge are approved).
- Styling: `src/index.css` (Tailwind and the shadcn theme tokens), shadcn components in `src/ui/shadcn/`, our primitives in `src/ui/` (Tailwind classes), composed pieces and page layout in `src/styles.css` (plain CSS on the same tokens).
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
| P6 | A field turned to sunflowers had to be redrawn with Jelena | GSA proposes the split line along the edge the photo shows; he accepts it or pulls it into place |
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
- **Payment impact** is a separate field (amount + reason). An item can be complete and still lower the payment (the road strip). Never rank status by money.
- **Severity, from one pure function** for the stepper, outline, readiness bar and drawer, Check and submit, "Your farm this year" and Jelena's view: **to do** (neutral; blocks, not an error), **look at this** (orange: waiting for a check or a lower payment; never blocks), **error** (red: something wrong he must fix, such as an unreadable receipt, an invalid account number, a missing required document).

### Application state (derived, never stored)
`waiting_for_renewal` → `action_required` → `ready_to_submit` → `submitted`.
- Any `action_required` item, or no renewal, blocks submission (product decision).
- Payment impact never blocks.
- `awaiting_verification` does not block; only that part waits. Label this in design notes as **assumption to confirm with the ministry**.
- "Ready to submit" means nothing needs his action. It does not mean approved. Always list what the state will still check.
- Check and submit opens any time, but until nothing blocks it is a review with what's left as the primary action. The declaration and Submit appear only when he can submit.

### Application list rules (pure function, unit-tested)
The application is one list of named tasks. It is also the readiness view.
| When | Then |
|---|---|
| The farm has nothing a task asks about | Task not in the list (no animals → no herd task) |
| A record differs (bank account, herd, pigs, river, road) | Its own change task, opening on the evidence and the question |
| An answer makes work unnecessary | That work leaves the list, said in one short toast |
| A task is done | It collapses to one line with its outcome |
| Unchanged, nothing to declare this year (name, address, active farmer, fields nothing changed on) | Reused without asking: not a task, not counted. One "Unchanged since last year" review on Check and submit, each item with "Something wrong? Ask for a correction". In Land, one "Unchanged fields" line under What GSA knows |
| He declares it under liability, or it needs new evidence every year (cows that calved, input receipts, the declaration) | A one-tap confirmation in its part. Never bundled. A problem with it (the blurry diesel receipt) is an action inside it |
| A rule doesn't apply to his farm | Left out |
| Choosing measures | Ones that fit come first, with the reason; full list stays |
| Parts | The application comes in parts, in order: Your details, Animals, Land, Measures, Documents, Check and submit. Every task belongs to the part it is about. A part his farm has nothing for is left out (no animals, no Animals part). The point is not fewer steps; it is less effort per step and better, more personal questions |
| Always | Inside the open part, exactly one next action, open, the most visible thing on screen. Once the part is done, "Continue: <next part>" is the primary action |
| Kinds of work | Within each part, changes first because they shape the rest, then choices (measures), then yearly confirmations |
| An answer adds work | The toast says what, in one line; the finish line never moves silently |
| Advisor signs in | Same list, denser, what needs action first |

Structure by what Milan has to accomplish, not by the smallest step count. There is no target number of steps.

## 7. Scenario data (Milan, second year)

Use exactly these facts. Don't invent research findings or extra numbers.

- **Farm:** active farmer status renewed. One scenario only. Application window: 10 April to 26 May; show days left.
- **Pigs:** the animal registry shows 3 pigs; none declared last year. Question: only for the household? (household pigs needing no declaration is an assumption).
- **Herd:** last year declared 41 cattle. Animal registry today: 38 (registry has headcount only, no history, so never show a breakdown of movements). Milan knows why: 4 sold, 2 slaughtered, 3 calves born. 14 cows calved between 1 April 2025 and 31 March 2026.
- **Land:** five fields, 9.00 ha total. Use local-style names:
  - River field, 2.40 ha, wheat last year, beside the river (the tree line along its top edge). Satellite photo: the part along the river looks paler than the rest (about 1.08 ha). That ground stays wet for longer every spring; this year sunflowers there, wheat on the rest (1.32 ha along GSA's line).
  - Road field, 1.80 ha, maize. Land map: 0.12 ha strip along the road now marked as road (wider road).
  - Upper field, 2.00 ha, wheat. Unchanged.
  - Meadow, 1.50 ha, grassland/fodder. Unchanged.
  - House field, 1.30 ha, maize. Unchanged.
  - Every shape is traced on the edges the real photo shows (round 14). The record's area is what counts: a shape says where the land is, and a part of a field is its share of the record's area.
- **Measures:** 13 in the list, 10 fit his farm, 3 don't (organic, milk premium, fattening cattle). Last year he had the first two:
  - Basic support for plant production: 18,000 dinars per hectare (real 2026 rate), justified with input receipts.
  - Cows raising calves for fattening: 20,000 dinars per cow that calved 1 Apr 2025 to 31 Mar 2026 (real 2026 rate). 14 cows calved.
  - Fertiliser, diesel, certified seed, insurance, quality breeding cattle, artificial insemination, green cover over winter, watering fields: no rates (never invent one); each states what it pays for and what it needs (uploads, numbers, text, a choice, fields, a promise). Data in `scenarios.ts`.
- **Round 13:** a part of the river field can be left unsown: it stops counting for plant production (assumption), with the reason. A part must be at least 0.10 ha (placeholder, assumption).
- **Estimate:** 9.00 × 18,000 + 14 × 20,000 = 442,000. After the road: 8.88 × 18,000 + 280,000 = 439,840, shown as "about 440,000", with "The road took 0.12 ha. About 2,200 dinars less." Splitting the river field doesn't change the estimate (same rate per hectare), unless a part is left unsown. Label: "Estimated subsidy based on current information", covers only this application, assumptions visible on request (rates, eligible area, cows that calved), "The payment still depends on inspection and final eligibility."
- **Jelena:** PSSS advisor in Čačak, about 20 applications a day, studied agronomy.
- **Neighbour (advisor mode only):** has a parcel still in his late father's name; he sent just that problem to Jelena. Referring it to the land registry means waiting for that office, not handled.
- **Added in round 5 at Aleksa's request (more problems per part):**
  - Your details: the bank closed the farm account ending 0417 on 3 March 2026 and reported a new one in his name ending 2291 (Yes: paid there; No: he types the 18-digit account). Round 10 cut the household question (grandson Luka): it changes nothing in this application.
  - Animals: the 14 cows that calved come from the animal registry; he confirms them, seeing they pay about 280,000 dinars, or asks the registry to check.
  - Measures: GSA suggests green cover over winter (satellite: the river and upper fields stayed green all winter; suggested, with one tap "Use these fields"; the photo justifies the suggestion, never eligibility) and artificial insemination (registry: 9 inseminations by his vet since last April). Never a rate.
  - Documents: Diesel receipt.jpg is too blurry to read the amount: an error inside "Your input receipts", "Send a clearer diesel receipt".
- **Added in round 11 at Aleksa's request (new land):**
  - Land: the land registry shows a parcel in his name since 12 February 2026, 0.80 ha above the road field (prototype placeholder). Question: will he farm it this year? Yes: GSA adds the whole parcel; he names it, gives its crop and chooses its measures. No: left out.
  - Land: registered farmland south of the meadow (0.90 ha) is where a field he adds himself can go ("Add a field"); the land is taken whole.
- **Added in round 12 at Aleksa's request (prototype placeholders):** what he lacks for the three measures that don't fit: keep his land organic for 2 more months; 2 more dairy cows; 5 more cattle in fattening. What each could pay him a year, worked out in the side panel: 7.50 ha × 16,000, 16 animals × 8,000, 5 animals × 10,000. These three rates are placeholders, the one exception to never inventing a rate, and only here, never in the estimate. Every map shows when the photo was taken: 21 April 2026.

## 8. Milan's journey (one connected flow)

Earl: one connected experience, not separate features. How the application changes as a result of Milan's answers is the defining interaction of the North Star.

**Flow:** welcome back → changes → land → readiness → submit → receipt. All of it reads as one application list that shrinks to what's left.

### Welcome back: a stepper, and one obvious next action in each part
- Greeting, deadline and days left, then the **stepper**: every part, which is open, which are done. Any part can be opened.
- Inside a part: the one next task on the left ("Start with your account for payments" first); on the right the part at a glance: done ✓, now →, later ○. On a phone it sits below.
- On arrival the readiness bar leads with the verdict and the next action, not a big number; the count lives in the open part of the stepper and in the drawer.
- Back in the action bar goes to the previous part; forward is the next task in the part, then the next part.
- **Progressive disclosure:** only the open part is shown; detail opens on request.
- Each change is asked as GSA's best guess from a record, so the usual answer is one tap.
- After each decision, the next action takes the top slot, done work collapses, and unneeded work leaves with a one-line reason (a toast, with Undo). This visible change is the defining interaction. Announced with `aria-live`.
- **"Your farm this year", the estimate and "Unchanged since last year" are on Check and submit.** The farm shows every part and where it stands ("Unconfirmed", "Confirmed by you", "Waiting for a check"). He cares whether a line is true, not where it came from, except the date of the photo, which is on every map.
- The estimate is a separate block, never mixed with status, in three states (pure, tested): **no basis yet** (no number; "Your estimate appears once you choose your measures"), **provisional** (amount and what it waits for), **current** (amount and caveat). Never "About 0 dinars".

### Change cards: evidence before the question
A card is one line of context (what GSA found, and where), the evidence, the question and the actions. The changes are different kinds of decision, so the cards differ:
- **Herd and pigs:** a number is easy to check, so the card stays a simple confirm. Last year 41, registry today 38, yes or no. No invented breakdown.
- **Map changes (river field, road strip):** the card shows the place, not a description: a small preview on the satellite photo with the affected area highlighted. The road card shows the exact strip, its size (0.12 ha) and the payment impact (about 2,200 dinars less). The primary action is **"Review this boundary"**, which opens the map at that area; he answers there.

Paths:
- Herd yes → herd complete. Herd no → "How many cattle do you have today?" → he enters 41 → **registry 38 | you declared 41** side by side, "The registry stays the official record until it's checked", awaiting verification. The one exception and the best-designed state: it says plainly that his part is done; who settles it (the animal registry, and Jelena if he sent it); that he needs to do nothing unless they contact him; what happens next (the registry checks, its 38 counts until then, he can still submit, the result appears here). Same words wherever the herd appears.
- River: the part along the river looks paler than the rest of his wheat (fact). He compares last year's field with what the photo shows. "What's growing along the river this year?" The same as the rest → complete. Something else → three steps: where the crop changes, what grows in each part, what this changes. No third branch.
- Road yes → complete; area and estimate drop with the reason shown. Road no → both areas kept side by side, awaiting verification, and the herd's four answers (your part, who settles it, do you need to do anything, what happens next) plus what he gains if they agree. He stays on the map to read it. The land map's area counts until checked.
- Answers stay editable; changing one re-runs the list rules.

### Land: real maps in plain language, and the suggested split
- Every map is OpenLayers on the real satellite photo (loaded only when a map is shown). He can pan, zoom (buttons, pinch, wheel, keyboard) or see the whole farm; the way back to the field appears only once he has moved away from it. Card previews are small still pictures; the review map fills the screen with the question beside it.
- Plain labels and clearly different boundary styles, e.g. "Land the government has registered". No technical terms. No key. Cadastral parcels are never drawn. Road strip hatched; satellite flag a light veil with a dashed line, so the photo stays readable.
- When a boundary stops an action, explain why at that moment, in place.
- **Split (rounds 13 to 16, the hero):** GSA's line runs along the edge the satellite shows, worded as a guess the photo can get wrong. **Confirmation first (round 16):** step 1 asks "Is this where the crop changes?" over the line and the two areas; "Yes, that's right" goes to the crops without touching the map; only "No, I need to change it" opens the editor, where he can also reject GSA's line ("Start from a straight line"). In the editor he presses anywhere on the line, or on the river field's own edge, and pulls, and it bends there, as many times as he likes; small round handles move bends and corners (white dot on a dark ring, a halo on hover, a ring when selected); small square handles at the line's ends slide along the field's edge. The tool island floats over the bottom of the map while he edits and holds only Undo, Redo and Reset (Remove while a point is selected). Snapping works on its own: within 6 m (design assumption) a point joins the satellite's edge or the field's registered edge, a dashed guide shows each once he has left it, and the map says when it joined, with "Let it go freely" to turn it off. The slider is a link in the panel ("Hard to drag? Use a slider"). On touch, the line answers to a press 24 px away and handles to 56 px (to validate). Arrow keys, Delete and Ctrl or Cmd + Z work too. He never places a point on empty ground. The field's edge can go past the farmland registered around it (shown dashed while he works), because the record can be wrong: the map says so, the field waits for the land registry's check with both areas kept and the four answers, and no more than the registered area counts until then. A bad shape (crossing itself, a part under 0.10 ha, a design assumption) stops at the last good position and the line above the island says why, so an invalid shape can't exist. A moved edge changes the field's area (the record's area, scaled), and that carries through everywhere. Live areas on the map, as River side and Road side. Then a crop for each part (tap a part on the map; nothing sown is a choice), and the island leaves. Then what this changes in his application, before he confirms, in three groups: what changes, what stays the same, what needs his decision. GSA never applies for a measure because a crop or an edge changed. Nothing counts until he confirms.
- **The split carries through:** every map draws it, the land list and crops show it, measures offer each part (a choice of the river field carries to both, and back), the estimate and readiness follow, all derived.
- **Only the river field's edge moves (round 15, Aleksa):** no dragging of sides or edges for the road field, the parcel he bought or a field he adds; the land is taken whole as the record has it. The road field is where he disagrees with the government's map instead. River and road are the hero moments; check at 360 px, then 1280.
- **New land stays small (round 13, Earl):** adding a field is its place, name and crop. It joins his land, so measures cover it like the rest; there is no measures step of its own.

### Readiness through submit
- Readiness is the application list itself, with a one-line verdict on every screen, text plus icon shape, announced politely.
- Measures are decision support: each one GSA recommends says why it may fit, what the state still checks and what he must provide. Last year's come first as "You applied for these last year", unchosen, each with "Choose again". Choosing opens what a measure needs; each says where it stands (still to fill in, ready to apply, applied); the one action is "Fill in what's missing" until everything is in, then "Apply for N measures". Under the progress widget, "What you need for more support" says what he lacks for the measures that don't fit yet, as things to do with what each could mean for his household; the arrow beside a name opens everything about that measure in a side panel.
- **Submit:** what's complete, what's awaiting verification and that it doesn't block (assumption), what the state will still check, declaration signed once ("I confirm under full criminal and material liability..."), one clear Submit button.
- **Receipt:** "Your application is submitted." Date, reference number, what happens next, what's still awaiting verification, how to amend until the national deadline. Never ambiguous.
- Renewal gate (scenario): first screen says renewal is needed, links to it (mock), lets him prepare but not submit; after renewal: "You're an active farmer. Next: your application."

### Jelena (advisor mode): small, don't let it grow
- Sign in as Jelena via prototype controls. A queue of only escalated problems (the neighbour's inherited parcel; since round 11 Milan's herd disagreement stays with the animal registry and doesn't reach her), each with full context.
- Case states name who acts next: **needs Jelena**, **referred to <office>** (awaiting its response), **needs farmer action**, **resolved**. A referral moves responsibility; resolved needs the record owner's decision recorded as the outcome, never right after a referral. Show when she should follow up, worked out from the application deadline. Each case carries enough to decide without opening the application (parcel dispute: map preview, registry record, farmer's explanation, deadline).
- Desktop first (checked at 1280 px). Grouped by state; within hers: blocks submission, then close to the deadline. The national deadline shows only within 7 days.
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

## 10. Rounds (one phase at a time; decide, build, log, commit)

Rounds 1 to 9 are done (see `docs/decisions.md`): one list that shrinks, evidence cards, real maps, the suggested split, a stepper with parts, readiness severities, shadcn/ui in natural colours.

**Round 10 (Earl, 26 Oct, on 558f96d): fewer decisions, not easier ones.** Phases: (1) CLAUDE.md; (2) fewer decisions on return: reuse without asking, confirm every year, only when changed; (3) know, suspect, don't know (river, meadow, measures, herd); (4) one status system, three severities, three estimate states, review is not submit; (5) parcel delineation as the hero, the upper field's edge moved as one line; (6) Jelena's states, colour, spacing, content pass, `docs/acceptance.md`, deploy.

**Round 11 (Aleksa, 29 Oct):** readiness drawer shows only errors and warnings; "What GSA knows" per part with a pen per line; no Jelena button once the herd is his part done; the bought parcel and adding a field on the map.

**Round 12 (Aleksa, 30 Oct):** no edge moving; no sources or database icons (states only, the photo's date on every map); measures apply only when filled in; goals widget; action points instead of "Before you submit"; meadow in one timeframe.

**Round 13 (Earl, 31 Oct):** go deep on one parcel delineation workflow, one meaningful exception, and how both connect to the rest of the application; no suite of GIS tools. River field in three steps with a line he pulls, the road dispute with its owner and next steps, new land reduced, exploration in `docs/parcel-exploration.html`. Next from Earl: record a walkthrough with the after story; case study needs the original interaction and observations from the 44 sessions; claims about usability need new validation.

**Round 14 (Aleksa, 1 Nov, on Earl's email of 31 Oct):** deepen the one parcel workflow. Parcels traced on the real photo, and the hero is a real two-tone field beside the river. A tool island with a constant overview of what's on, after the older mobile tool island; small handles; variations and reasoning in the Figma file North Star. Land keeps three tasks: river field, road field, the parcel he bought (Upper field, Meadow and Crops on your other fields are gone). Toasts are one line, with Undo and close the same control.

**Round 15 (Aleksa, 3 Nov, on Earl's email of 31 Oct):** edit the whole river field, not only its parts: unlimited points on the field's edge and the divider line, Straight removed, snapping to the satellite's edge and the field's registered edge, an error toast at the registered farmland; the divider line is called that; the stepper says what's left in his words ("2 fields to go"); the application fills the window on a computer with no page scroll; the map task's button sits beside its heading; tighter spacing; a new crop says which measure it opens.

**Round 16 (Earl, 4 Nov, on round 15):** one final pass on the river field, then stop expanding the prototype and build the case study. Confirm GSA's line first and edit only if it's wrong; treat the photo as a guess (reject it entirely, move it freely); past the registered farmland is flagged, not stopped; 6 m snap and 0.10 ha labelled design assumptions; the island is Undo, Redo, Reset, with snapping automatic and the slider in the panel; larger touch targets on the line; what changes, what stays the same and what needs his decision before he confirms; never apply for a measure on his behalf. Case study: three decisions (a proposed boundary rather than a blank map; precision and recovery through direct manipulation and constraints; the map change carried through the application), with the original tested product, its limits, the alternatives rejected, organisational and technical challenges, and what still needs validation.

**Round 17 (Aleksa, 4 Nov):** a pass on details from all of Earl's emails: walk the whole journey at 360 and 1280 px and fix what gets in Milan's way (Check and submit scrolls and lists what's left by part; Submit says why rather than greying out; one finger never pans the map while editing on touch; the deadline stays on a phone); tokens for map overlays.

**Round 18 (Aleksa, 4 Nov):** the map experience, motion and states, after research into GIS editing on phones: a loupe above the finger, quiet field corners, the farmland shown only when it matters, the sliver past it veiled orange, GSA's line drawing itself in, panel and map lighting the same part, snapping felt and seen, purposeful motion under reduced-motion rules, never a grey button without a reason, the answer in view on a phone.

**Round 19 (Aleksa, 4 Nov):** alternatives for the key decision points across the whole application, in the Figma file North Star only (frames 5 to 12), never in the code; every state of the journey audited for clipping and keyboard focus at 360, 768, 1024 and 1280 px.

Prototype controls (floating "Prototype" button): persona (Milan or Jelena) and reset. Design notes are switched off (Aleksa, 3 Nov).

## 11. Design system

shadcn/ui components live in `src/ui/shadcn/` and our semantic primitives in `src/ui/` wrap them. Tokens follow shadcn/ui's semantic names (`--background`, `--card`, `--primary`, `--muted-foreground`, `--border`, `--ring`, `--radius`, plus `--success`, `--warning`, `--info`, `--meta` for status and design notes) in two tiers: primitives, then semantic. Components only use the semantic tier, so a theme is one file. Icons come from lucide (shadcn's set) through `src/ui/Icon.tsx`, by meaning. So:
- Components outside `src/ui/` never contain styling decisions; they compose primitives.
- Primitives use semantic props (`variant="primary"`, `status="awaiting_verification"`, `density="comfortable" | "compact"`), not visual ones.
- Density is a context: Milan = comfortable (larger targets), Jelena = compact. Same components.

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
- [ ] One list: after each answer, done work collapses, unneeded work leaves with a reason, the next action gets focus.
- [ ] No "Everything else". Unchanged things with nothing to declare are reused without asking; yearly declarations are separate one-tap confirmations; changes are their own tasks.
- [ ] Map in plain words; no technical land terms; cadastral parcels hidden by default; a boundary explains itself when it stops an action.
- [ ] The split line is proposed along the photo's edge; Milan accepts it or pulls it with large handles; slider, undo, guardrail and live areas remain; an invalid line can't exist. Only the river field's edge moves; past the registered farmland it is flagged for a check, not stopped. GSA's line can be confirmed without touching the map.
- [ ] Before confirming a split he sees what it changes in the application, with reasons; afterwards land, crops, measures, estimate and readiness all reflect it.
- [ ] Road dispute: both areas kept, who settles it, what he must do, what happens next, what he gains if they agree; assumptions labelled.
- [ ] Milan's journey runs end to end: welcome back, changes, land, readiness, submit, receipt.
- [ ] Status (complete / action required / awaiting verification) is separate from payment impact.
- [ ] "Ready to submit", never "safe"; ready isn't approved; what the state still checks is listed.
- [ ] 38 vs 41: both values kept, explained, awaiting verification, resolvable, no dead end.
- [ ] Satellite only flags; Milan decides what he planted.
- [ ] Estimate labelled as an estimate with assumptions visible; it is not the hero.
- [ ] Jelena's cases show who owns the next action, ordered by what matters; Milan sees the same state.
- [ ] Tested, mandate and assumptions are distinguishable (design notes, off by default).
- [ ] Every problem P1 to P12 is answered somewhere in the flow.
- [ ] `src/copy/en.ts` is shorter than at the start of the round.
- [ ] Welcome back leads with one obvious next action, then what's done, then what can wait; a stepper of parts generated around his farm.
- [ ] River and road cards show the place on the satellite photo; "Review this boundary" opens a map he can pan and zoom.
- [ ] "Your farm this year" says per item where it stands: unconfirmed, confirmed by him, or waiting for a check.
- [ ] Round 10: fewer decisions on arrival (count logged before and after); progress leads with the verdict; added work is announced with its reason.
- [ ] Facts carry source and date; meanings are possibilities; what GSA can't know is his question (river, measures).
- [ ] The herd disagreement answers: your part is done, who settles it, do you need to act, what happens next; same words everywhere.
- [ ] One status function on every screen; red only for errors; the estimate has no basis / provisional / current; review is not submit.
- [ ] River field and road strip are the strongest moments; no point placement with a finger anywhere.
- [ ] Jelena never resolves straight after a referral; follow-up date from the deadline; cases decidable without opening the application.
- [ ] Solid green only on the primary action; one content width; the primary action in one place on every task.
- [ ] Every parcel sits on edges visible in the photo; the toolbar always shows what's on and off; handles never cover the edge he is checking.
