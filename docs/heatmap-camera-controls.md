# Heatmap Camera Controls

This document records PR 7 of the 12-PR Heatmap repair schedule.

## Purpose

PR 5 rebuilt the field geometry and PR 6 added screen-space semantic detail. PR 7 makes the Heatmap camera predictable and gives users explicit controls for zoom, reset, and refresh.

## Desktop interaction

- normal wheel continues to scroll the page
- Ctrl, Alt, or Meta plus wheel zooms the map around the pointer
- pointer drag pans the map
- pointer capture begins only after the drag threshold is crossed
- drag completion never selects a tile
- click without a drag selects the tile under the pointer
- double click zooms in around the pointer
- Shift plus double click zooms out

## Explicit controls

The Control Dock now contains:

- minus: one zoom step out
- percentage button: return to the 100% base scale
- plus: one zoom step in
- Reset view: return to the initial centered camera
- Refresh: load the latest stored Heatmap snapshot

Refresh does not trigger a new collector run. It reads the latest snapshot already available through the existing Heatmap API.

## Camera bounds

The camera uses cover-scale bounds.

- map movement cannot reveal empty space beyond the world edge
- zoom is clamped from 100% through 1200%
- if a scaled world is smaller than the viewport on an axis, it is centered on that axis
- clamping runs after pan, zoom, reset, resize, layout change, and scene restoration

## Scene and resize behavior

Camera state is stored as normalized world center plus zoom.

- automatic refresh preserves the camera when the Canvas scene is recreated
- manual refresh preserves the camera
- resize preserves the closest normalized world center and zoom
- device-pixel-ratio changes resize both Canvas layers
- selection remains synchronized after scene rebuild
- old ResizeObservers and global listeners are removed when a scene is replaced

PR 8 will change Split so it reuses the Wide world instead of rebuilding to the narrow viewport. This PR only guarantees camera preservation and clamping for the current scene lifecycle.

## Touch boundary

The current narrow-screen Move map control remains available as an interim control. The final mobile bottom sheet, focus model, and touch-accessibility pass remain PR 11.

## Verification

The camera verifier checks:

- fit camera geometry
- cover scale
- pan clamping at every edge
- minimum and maximum zoom
- normalized center preservation across resize
- 100% and Reset view behavior
- visible world bounds
- explicit controls and manual refresh copy
- modifier-wheel behavior
- drag-threshold pointer capture
- canceled gestures not selecting tiles
