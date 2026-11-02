# GSA North Star prototype: context brief

**Live link:** https://aleksasimeunovic.github.io/gsa-north-star/
**Code:** https://github.com/aleksasimeunovic/gsa-north-star

## What it is
A clickable, low-fidelity prototype of my North Star proposal for Serbia's agricultural subsidy application (GSA). It follows on from the 8-step wizard I designed and tested with 44 farmers and advisors for UN FAO. The North Star is my own proposal. It has not been built or tested, and it is not part of the UN engagement.

It is deliberately low fidelity: greyscale, system font, plain boxes. The effort went into flow, states, wording, logic and accessibility, not visuals. It is mobile-first (360 px) and also works on desktop.

**Core principle:** the complexity of the application should reflect the complexity of the farm, not the complexity of the government's policies. The wizard is generated around Milan's farm rather than fixed around the government's process.

## The scenario
Milan Dragović, 63, from Bečanj near Čačak, in his second year. He grows wheat and maize and keeps cattle. Three things may have changed since last year:
- **Herd:** the animal registry shows 38 cattle; last year he declared 41.
- **River field:** the satellite photo shows the lower part looks different (he now grows sunflowers there).
- **Road field:** the land map now marks a 0.12 ha strip as road.

## A five-minute path
1. **Welcome back:** GSA opens with what it already knows and asks one clear question per change. The live preview shows the application reassembling as he answers ("4 steps this year. The tested version had 8.").
2. **Herd, answer "No", enter 41:** both numbers are kept side by side and the item is awaiting verification. He can ask the registry to check, send just this problem to Jelena, or carry on. There is no dead end.
3. **Land:** a full-width map with the river field split by one draggable line (a slider is also available). He picks a crop for each part. Satellite data only flags the field; Milan decides what he planted.
4. **Everything else:** one confirmation covering records, measures (each with what it pays for, his part and why it fits) and documents.
5. **Submit, then Receipt:** "Ready to submit" means nothing needs his action, not that the application is approved. The Submit screen lists what the state will still check. The declaration is signed once and the receipt cannot be misread.

The header shows on every screen whether the application is ready ("3 things need your action"). Clicking that line lists items by status. The payment estimate is shown separately and is never mixed with status.

## Prototype controls (Prototype button, top right)
- **Scenarios:** second year, not renewed (renewal gate), first year, no animals (the herd step disappears), missing document.
- **Sign in as Jelena:** advisor mode. Only problems farmers have escalated reach her. Each comes with full context, and she gets keyboard shortcuts, a bulk action and an action history.
- **Show design notes:** tags on screen mark what was **Tested (44 sessions)**, what is my **North Star proposal**, what is an **EU mandate**, and what is an **assumption to confirm with the ministry**.

## Assumptions to confirm with the ministry
- Items awaiting verification do not block submission; only that part waits.
- Amendments are allowed until a national deadline.

## Prototype simplifications
- The prototype clock is set to 28 April 2026.
- Redrawing a field and first-year field drawing are reduced to one click.
- Reference numbers, cadastral parcel labels and the neighbour's case are placeholders.

## Build notes
React, TypeScript and Vite, hosted on GitHub Pages. The rules (wizard generator, status, readiness, estimate, map geometry) are pure functions covered by 72 unit tests. It is structured so a design system (Untitled UI) can be applied later.
