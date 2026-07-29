# ViewLoom Heatmap Canvas redesign specification

Status: source of truth  
Scope: Twitch Heatmap renderer and interaction foundation  
Public category-filter exposure: not authorized by this specification

## Purpose

Replace the current DOM-tile and board-transform interaction model with a Canvas scene, camera state, redraw, world-coordinate hit testing, and semantic zoom.

The goal is smoother pan/zoom, reliable click-versus-drag behavior, stable selected-stream synchronization, and readable rendering for approximately 300 real streams.

## Current problem

The current Heatmap:

- builds tiles as DOM elements;
- pans/zooms by transforming the whole board;
- captures the pointer too early;
- allows click and drag to conflict;
- shows the same information at every zoom level.

The required change is architectural, not cosmetic.

## Required architecture

### Layers

1. Tiles canvas: base rectangles, fill, borders.
2. Labels canvas: names, viewers, momentum, optional logos.
3. Overlay canvas: hover, selection, keyboard focus, interaction feedback.

All layers use 2D Canvas. Canvas elements themselves are not moved with CSS transforms during pan/zoom.

### Scene model

A scene node combines business data and a layout rectangle:

```ts
type HeatmapSceneNode = {
  id: string
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number
  x: number
  y: number
  width: number
  height: number
}
```

### Camera

```ts
type CameraState = {
  zoom: number
  tx: number
  ty: number
  viewportWidth: number
  viewportHeight: number
}
```

Pan/zoom updates camera state and redraws. Layout is recomputed only when data or viewport layout requirements change.

### Hit testing

Pointer coordinates are converted from screen to world coordinates. Selection uses scene rectangles, not DOM tile buttons.

Pointer capture begins only after the drag threshold is crossed.

## LOD

Information is selected from screen-space tile area.

- far: fill only;
- medium: short label;
- near: full label, viewers, momentum, optional logo;
- selected: overlay emphasis and synchronized detail rail at every zoom.

LOD thresholds must be tuned with real 300-stream payloads and mobile viewport tests.

## Input behavior

Required:

- click selects a stream;
- drag pans without selecting;
- wheel/pinch zoom anchors around the pointer/focal point;
- keyboard focus and selection remain visible;
- reset/fit returns to a stable camera state;
- resize preserves a valid visible scene.

## Data and provider boundaries

- Keep existing real API and data-truth states.
- Do not change collector behavior, cadence, D1 schema, retention, or backfill.
- Do not combine Twitch and Kick.
- Do not expose the hidden category filter.
- Preserve the existing unfiltered Heatmap as fallback until cutover acceptance.

## Rollout boundary

The Canvas scene must first run behind a hidden route or disabled feature flag.

Production cutover requires:

- current API and state compatibility;
- desktop and mobile browser validation;
- click/drag/wheel/touch/keyboard checks;
- accessibility and focus checks;
- selected rail synchronization;
- real-data rendering;
- fallback behavior;
- no public category-filter exposure;
- a separate cutover PR with production verification.

## Non-goals for the first two PRs

- public renderer cutover;
- category-filter release;
- collector or API redesign;
- new ranking semantics;
- cross-provider view;
- removal of legacy fallback.
