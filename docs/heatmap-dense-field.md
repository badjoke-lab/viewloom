# Heatmap Dense Field

This document records PR 5 of the 12-PR Heatmap repair schedule.

## Purpose

PR 4 corrected the page hierarchy and restored Wide-first rendering. PR 5 repairs the Heatmap field itself so it reads as one continuous treemap instead of a grid of separate cards.

## Geometry

The Heatmap now uses a gapless squarified treemap core.

- every positive-viewer item remains in the field
- tile area remains proportional to current viewers
- layout geometry consumes the complete map rectangle
- structural gaps are not subtracted from the treemap
- long-tail items are arranged with a squarified row heuristic to reduce extreme slivers
- floating-point geometry is preserved instead of rounding every tile boundary

The visual seam is rendered separately at a constant screen-space width. Zooming therefore does not turn a thin seam into a wide black gutter.

## Tile surface

- tile inset: 0.5 screen pixels per side
- tile border: low-contrast 0.6 screen pixels
- positive and negative momentum use continuous intensity rather than one flat green or red
- near-flat tiles use a quieter blue-gray surface
- activity only adds a small lightness lift
- channel name stays at the top
- viewers and momentum are anchored at the bottom when the tile has enough screen area
- small tiles remain unlabeled until zoom gives them enough screen area

## Selection

The previous thick double white outline was replaced with an inset purple overlay.

- selection never changes tile geometry
- selection stays inside the selected tile
- stroke width remains constant in screen pixels during zoom
- a subtle inner highlight preserves contrast without creating a triple-border effect

## Scope boundary

This PR does not add field-count buttons, dedicated minus / Fit / plus controls, expanded inspector data, keyboard navigation, or the final mobile bottom-sheet treatment. Those remain later PRs.

## Verification

The dense-field verifier creates a 300-item weighted fixture and checks that:

- all items are preserved
- the full map area is preserved
- every tile stays inside the map bounds
- every tile has positive geometry
- the fixture avoids pathological aspect ratios
