# Heatmap Wide-First Layout

This document records PR 4 of the 12-PR Heatmap repair schedule.

## Purpose

The previous Heatmap page was permanently split into a visual field and a fixed inspector rail. That reduced the usable map width even when the user was not actively reading the inspector. PR 4 establishes an explicit Wide / Split page state and makes Wide the default.

## Layout modes

### Wide

- default mode
- Heatmap field uses the full available page width
- inspector remains available below the field
- larger field height is used on desktop

### Split

- Heatmap field and inspector are shown side by side on wide desktop screens
- inspector stays visible while the field is inspected
- below the desktop breakpoint, Split safely collapses to one column

## Persistence and compatibility

The selected layout is synchronized with:

- URL query: `?layout=wide` or `?layout=split`
- local storage: `viewloom.heatmap.layout`

The obsolete `theater` value is interpreted as Wide so old links and saved values do not break.

## Page hierarchy

The Heatmap page is ordered as:

1. feature navigation
2. compact Page Hero
3. live data strip
4. external Control Dock
5. Heatmap field and inspector
6. support cards

The Control Dock is outside the map frame. The default Canvas renderer now places its map state, snapshot facts, zoom value, map-control toggle, and reset action in that dock rather than embedding another toolbar inside the visualization.

## Twitch and Kick

The same Wide / Split state, page hierarchy, responsive behavior, and Control Dock are used for both platform routes.

## Deliberate exclusions

This PR does not yet change:

- tile packing and gaps
- momentum color scale
- semantic label LOD
- dedicated plus, minus, and Fit controls
- Split viewport edge treatment
- selected-stream information depth
- mobile bottom sheet and keyboard work

Those remain assigned to PR 5 through PR 11.
