# ViewLoom Heatmap Canvas implementation plan

Status: source of truth  
Depends on: `docs/product/heatmap-canvas-redesign-spec.md`

## Goal

Migrate safely from the current DOM/transform Heatmap to Canvas/Camera/LOD while preserving the real data path and production fallback.

## Branch and PR order

### PR-1 — responsibility split

Branch: `work-heatmap-canvas-module-split`

- split types, selectors, layout, color, selection, viewport, and UI synchronization from the current entry;
- keep the DOM renderer and current public behavior;
- add no category exposure;
- pass existing Heatmap and shared web checks.

Stop rule: do not add the Canvas scene until PR-1 is accepted.

### PR-2 — hidden Canvas scene

Branch: `work-heatmap-canvas-scene`

Add:

```text
apps/web/src/features/twitch-heatmap/
  model.ts
  selectors.ts
  layout.ts
  color.ts
  lod.ts
  hit-test.ts
  scene.ts
  page.ts
  ui-sync.ts
  renderer/
    tiles-layer.ts
    labels-layer.ts
    overlay-layer.ts
    index.ts
  interactions/
    camera.ts
    pointer.ts
    wheel.ts
    keyboard.ts
  legacy/
    dom-viewport.ts
    dom-selection.ts
```

- use a hidden route or disabled flag;
- keep public `/twitch/heatmap` on the accepted renderer;
- render real payloads without collector/API changes;
- establish camera transform, redraw, visible-node culling, and hit testing.

Stop rule: no production cutover.

### PR-3 — interactions

Branch: `work-heatmap-canvas-interactions`

- click/drag separation;
- drag-threshold pointer capture;
- pointer-anchored wheel zoom;
- touch/pinch behavior;
- double-click/reset/fit;
- keyboard selection and focus.

### PR-4 — labels and LOD

Branch: `work-heatmap-canvas-lod`

- labels layer;
- semantic zoom thresholds;
- small-tile noise reduction;
- selected overlay/detail rail synchronization;
- real 300-stream performance checks.

### PR-5 — production cutover candidate

Branch: `work-heatmap-canvas-cutover`

Entry conditions:

- PRs 1–4 accepted;
- real-data, desktop/mobile, accessibility, fallback, and data-truth gates pass;
- public category filter remains independently governed;
- current roadmap and schedule explicitly place cutover next.

Use a separate Preview only when required. Merge only after final candidate validation.

### PR-6 — legacy cleanup

Branch: `work-heatmap-canvas-legacy-cleanup`

- retire unused viewport/DOM paths only after production smoke acceptance;
- retain rollback/fallback until cutover is proven;
- update docs and remove temporary hidden routes/flags as authorized.

## Current scheduling

Before 2026-08-05:

1. #659 audit package remains first priority.
2. PR-1 may begin after the package candidate is ready.
3. PR-2 may begin only after PR-1 acceptance.
4. No Canvas production cutover occurs before the audit boundary or without independent final validation.

## Required checks

As applicable:

- web typecheck/build/checks;
- Heatmap unit and contract tests;
- provider separation;
- real-data fixture and state truth;
- browser desktop/mobile;
- pointer/touch/keyboard;
- accessibility/focus;
- selected rail synchronization;
- performance with approximately 300 nodes;
- public category control absence;
- unfiltered fallback.
