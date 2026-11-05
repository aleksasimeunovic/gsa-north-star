# Leaving out a yard inside a field: exploration (5 Nov)

The case: a house, yard or barn sits inside the land Milan farms. The field is everything around it, so the
building must come out of the middle. Today the editor can only move the field's outer edge and the divider
line; it cannot make a hole.

## What the photo says

Checked on the real photo (Esri, zoom 18) with every outline from `scenarios.ts` drawn on it: **no building
sits inside any of Milan's five fields, the parcel he bought or Block 5.** The nearest real buildings are the
farmstead just east of the House field, and the house between the river and road fields (the road field's
left edge already bends around it). Since every map is real and every parcel sits on edges the photo shows,
building this needs one scenario decision first (see "Open question").

## Where it belongs in the journey

It follows the road strip, not the river split. Both are land inside the field that stops counting. The
difference is what GSA knows:

| | Road strip | Yard inside a field |
|---|---|---|
| Source | Land map record (a fact) | The photo shows a roof and a yard (a possibility) |
| GSA's wording | "The land map now marks 0.12 ha as road" | "The photo shows a building inside this field" |
| Who decides | The land registry's record, he can disagree | Milan: only he knows whether he farms that ground |
| Payment | About 2,200 dinars less | Less, by the yard's share of the area |

So it is **a change task in Land, raised by GSA** ("know, suspect, don't know"), not a tool he has to find.
Fewer decisions: if the photo shows nothing, there is no task.

A second door, for what the photo missed: inside the field editor he already opens (river field), "Leave out
a part inside" sits in the panel next to "Hard to drag? Use a slider". It is never a mode on the island.

## The flow (same shape as the river field)

1. **Card (evidence first).** Still preview of the field on the photo, the building veiled and outlined with
   GSA's dashed guess, its size ("about 0.06 ha"), the payment impact. One question: *"Do you farm the ground
   around the house?"* Primary action: "Review this boundary".
2. **Confirm first.** On the map: GSA's outline around the yard, the field's area with and without it.
   *"Is this the part you don't farm?"* "Yes, that's right" goes straight to step 3, without touching the map.
   "No, I need to change it" opens the editor. "I farm all of it" closes the task: field unchanged (the yard
   is a haystack, a shadow, a shed he has removed).
3. **Edit (only if needed).** The same grammar as the divider: press anywhere on the yard's outline and pull,
   round handles on bends, Undo, Redo, Reset on the island, snapping to the photo's edge within 6 m, arrow keys
   and Delete. No point placed on empty ground: the outline starts as GSA's guess, or as a small square at the
   place he pressed if he rejects it ("Start from a square").
4. **What this changes**, in the three groups: changes (area 1.30 → 1.24 ha, estimate about N dinars less),
   stays the same (crop, measures, the rest of his land), needs his decision (nothing, usually). Confirm.

## Rules (pure, in `geometry.ts`, unit-tested)

- The yard is a ring inside the field. A field's area is the record's area times (outline − holes) / outline,
  the same scaling the moved edge already uses, so the estimate and readiness follow without new code paths.
- A yard must sit fully inside the field. If he pulls it to the field's edge it stops there and the line above
  the island says why: "To take land off the edge, move the field's edge instead." A hole that touches the edge
  is an edge change, and two ways to do one thing is a trap.
- At least 0.01 ha (design assumption, to validate), and never crossing itself: stops at the last good shape.
- The divider may cross a yard: each part loses its share. The live area labels on the map already show it.
- Several yards are allowed, one at a time; each is its own line in "What GSA knows".
- It never applies for or drops a measure. If a measure has a minimum area, the effects screen says so.

## Review of the current delineation tools

| Tool | Keep | Change for holes |
|---|---|---|
| Confirm GSA's line first | Yes, the strongest pattern | Reuse as is |
| Pull anywhere on a line | Yes | Works on a closed ring too; no new gesture |
| Round handles (bends), square handles (line ends on the edge) | Yes | A ring has no ends, so only round handles |
| Island: Undo, Redo, Reset (Remove when selected) | Yes | Same island; Reset returns to GSA's outline |
| Automatic snapping, 6 m, "Let it go freely" | Yes | Snaps to the photo's yard edge, never to the field's edge |
| Slider in the panel | Fine for one line | No good meaning for a ring: offer "Make it bigger / smaller" (5 m steps) |
| Loupe above the finger, 24 px line, 56 px handles | Yes | A yard is small: open the editor zoomed to it |
| Stop at the last good shape, say why | Yes | New reason: touches the field's edge |
| Past the registered farmland: flagged, not stopped | Yes | Not relevant inside a field |

Weak spots found while reviewing: the slider only means something for a line; the editor has no zoom-to-the-
thing-I'm-editing, which a small yard needs; and there is no way today to say "the photo is wrong, nothing
changed here" from inside the editor (only before it), which the yard needs for a removed shed.

## Open question (scenario)

To build it on the real photo, one of:
1. **Recommended:** move the House field's recorded outline east so it takes in the real farmstead's yard
   (prototype placeholder, logged as such). Its name finally means something, and it is the one unchanged field
   left, so the task adds one decision, not a new kind of screen.
2. Place an invented building on the photo. Rejected: the photo is the evidence.
3. Design it in Figma only, like round 19's alternatives, and keep the code as it is (Earl, round 16: stop
   expanding the prototype).
