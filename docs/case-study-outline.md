# Case study outline: GSA North Star

Working outline for the presentation, built from Earl's email of 4 November. It uses only facts already in `CLAUDE.md` and `docs/decisions.md`. Anything marked **[Aleksa]** needs your material: nothing there should be invented.

**Story in one line (Earl, 31 Oct):** I transformed a specialist GIS workflow into a guided task that farmers can complete using their existing knowledge of their land.

**Principle:** the complexity of the application should reflect the complexity of the farm, not the complexity of the government's policies.

---

## 1. The original problem

- Milan's Before story: subsidies are the part of his income the weather can't touch. Measures opened at different times, three registries to match, cadastral numbers he'd never needed, several office visits per subsidy, agencies charging up to €40 for a free application (P1 to P12).
- Jelena's side: about 20 applications a day, typing other people's applications.
- FAO field research: about 70% of farmers own a smartphone; under half of 55 to 74 year olds use computers. Sessions expired mid-entry; farmers missed the final "finish" button; no action history across advisors.
- **[Aleksa]** One image of the old process (the office, the paper, the old app).

## 2. The product I designed and tested (FAO)

- 8-step wizard, 44 usability sessions with farmers and advisors.
- What was tested: plain-language measures, the herd filled in from the registry, drawing fields on a satellite photo kept inside eligible land, errors linked to the answer that needs fixing, last year's fields returning in year two.
- The three farmer quotes and three advisor quotes in `CLAUDE.md` section 4 (translated by you).
- **[Aleksa]** Screens of the original drawing interaction, and the observations from the 44 sessions that the North Star answers (where farmers got stuck placing points, finding the field, recovering from mistakes, reading areas). Earl asked for these specifically.

## 3. The limits that led to the North Star

- Even when tested and easier, the second year still meant rebuilding the farm: checking line by line, removing animals one ear tag at a time, redrawing a field that changed crop with Jelena's help.
- The shift: from rebuilding the farm every year to confirming it. GSA starts from what it knows, finds what may have changed, shows the evidence, then asks.
- Status: North Star is a proposal, not built or tested, and outside the UN scope.

## 4. Three strategic decisions (most of the presentation)

Ten points of comparison with the original GIS experience are working material (the North Star Figma file). They support these three decisions and aren't presented one by one.

### Decision 1: start with a proposed boundary, not a blank map (product strategy)

- GSA proposes the divider line along the edge the satellite photo shows. Milan's first question is "Is this where the crop changes?", and if it is, he confirms without touching the map (round 16). Editing exists only for when GSA is wrong.
- Why the proposed line beat the three other approaches explored (tapping a detected area, brushing over it, placing points with a crosshair): only a proposed line can be accepted as it is and still corrected precisely.
- Trust the photo less: the line is worded as a guess; he can move it freely, reset it or reject it for a straight line. Satellite data only flags; it never decides what he planted.
- Evidence: the four approaches in Figma; the river field at 1.08 and 1.32 ha.

### Decision 2: precision and recovery through direct manipulation and constraints (interaction design)

- He pulls the line or the field's edge from anywhere, and it bends there; no point is ever placed on empty ground.
- An impossible shape can't exist (crossing itself, a part under 0.10 ha); the move stops at the last good position and the map says why, where he's looking.
- But a registered boundary isn't assumed correct: going past the registered farmland is flagged for the land registry, with both areas kept, not prevented (round 16).
- Undo, Redo and Reset only; snapping works on its own with a way off; a slider for anyone who finds dragging hard.
- Evidence: handle sizes and states, the toolbar variations (four in Figma), snapping, validation states.

### Decision 3: connect the change on the map to the rest of the application (systems thinking)

- Before he confirms: what changes, what stays the same, what needs his decision. The usual split changes no money because both crops pay the same per hectare, which is more credible than inventing a payment change.
- After he confirms: land, crops, measures, readiness and the estimate all follow, worked out rather than stored.
- GSA points out new possibilities (certified seed for sunflowers) but never applies for a measure on his behalf.
- The road strip as the one exception: Milan disagrees with the government's map; both areas kept, who settles it, what he must do, what happens next.

## 5. What made it difficult (seniority)

- **[Aleksa]** Organisational challenges you mentioned to Earl (who owns which registry, what the ministry would need to agree to, UN scope).
- **[Aleksa]** Technical challenges (satellite edge detection quality, registry data with no history, matching three registries).
- What went wrong in both the original redesign and this one, which you told Earl you'd cover. **[Aleksa]**
- Decisions reversed along the way, from `docs/decisions.md`: blocking the edge at the registered farmland (250) became a flagged disagreement (262); four helpers on the toolbar (233) became Undo, Redo, Reset (263); editing first (rounds 13 to 15) became confirming first (260).

## 6. Assumptions that still need validation

- To confirm with the ministry: items awaiting verification don't block submission; amendments until a national deadline; household pigs need no declaration; unsown land stops counting for plant production; the 0.10 ha minimum part.
- Design assumptions: snapping within 6 m; touch distances on the line and handles; the registered area counting while an edge is checked.
- To validate with farmers: whether Milan can drag the line on his own phone at 360 px without panning the map; whether "confirm first" is trusted or rubber-stamped. No claim about better usability holds until the North Star is tested.

## 7. Close

- The walkthrough of the after story (Earl, 31 Oct). **[Aleksa]** Recording.
- Link to the prototype.
