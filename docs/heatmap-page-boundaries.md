# Heatmap Page Boundaries

This document records PR 2 of the Heatmap repair schedule.

## Purpose

The public Heatmap entry must no longer import the existing all-in-one implementation directly. It enters through a page controller and lifecycle runtime so later repair PRs can replace fetch, state, layout, renderer, inspector, and status responsibilities without changing the HTML entry point again.

## Current boundary chain

```text
heatmap-current-shell-entry.ts
  -> features/heatmap-page/controller.ts
  -> features/heatmap-page/runtime.ts
  -> features/heatmap-page/legacy-adapter.ts
  -> live/twitch-heatmap.ts
```

The final legacy adapter is temporary. PR 2 deliberately preserves the current production behavior while isolating it behind the new application boundary.

## Boundary contracts

`contracts.ts` defines the six replacement boundaries:

- fetch
- state
- layout
- renderer
- inspector
- status

It also defines the page lifecycle states and the adapter/runtime contracts.

## Runtime rules

- only one mount or refresh run may execute at a time
- a refresh requested during an active run is queued
- lifecycle state and the last error are observable
- the public entry calls only `mountHeatmapPage`
- the current implementation remains available only through the compatibility adapter

## Non-goals for PR 2

This PR does not change:

- visual layout
- data normalization
- state labels
- treemap packing
- LOD
- camera behavior
- selected-stream content
- mobile behavior

Those changes belong to PR 3 through PR 12.

## Regression rule

The public Heatmap entry must not return to importing `live/twitch-heatmap.ts` directly. Future work replaces the compatibility adapter boundary by boundary until the monolith can be removed during the final cutover.
