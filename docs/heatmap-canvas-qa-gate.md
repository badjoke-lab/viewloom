# ViewLoom Heatmap Canvas QA Gate

Status: Phase 2 completion gate  
Scope: Twitch Heatmap Canvas renderer  
Created: 2026-05-15

## 1. Purpose

This document fixes the QA gate for the Twitch Heatmap Canvas recovery work.

Phase 2 is not complete just because Canvas renders. It is complete only when the page preserves the agreed Heatmap quality on desktop and mobile without downgrading the UI to a card list or a simplified fallback.

## 2. Non-degradation rule

The Heatmap must keep the agreed target:

- Canvas-first renderer
- Wide-first completion
- Camera / pan / zoom interaction model
- selected stream detail
- no card-list downgrade
- no hidden demo-as-real behavior
- no normal page-scroll hijack

## 3. Desktop gate

The desktop Heatmap passes when all of the following are true:

- `/twitch/heatmap/` uses the Canvas renderer by default.
- `?heatmapRenderer=canvas` is not required.
- Legacy DOM mode is available only as an explicit fallback.
- Normal wheel scroll is not hijacked for zoom.
- Ctrl / Alt / Meta + wheel zooms the map.
- Drag pans the map.
- Click selects a tile.
- Dragging does not accidentally select a tile at pointer release.
- Double-click zooms in.
- Shift + double-click zooms out.
- Reset zoom returns to fit view.
- Selected stream detail updates after tile selection.
- The chart remains the visual hero of the page.

## 4. Mobile gate

The mobile Heatmap passes when all of the following are true:

- The page can scroll normally before entering map control mode.
- Tapping a tile selects it.
- `Control map` enters explicit map movement mode.
- `Back to scroll` exits explicit map movement mode.
- Pan works only while map control mode is active on touch devices.
- Pinch zoom works while map control mode is active.
- The toolbar does not overflow horizontally.
- Zoom badge, mode badge, Control map, and Reset zoom remain reachable.
- Selected stream detail remains below or beside the field without hiding the chart.

## 5. Data-state gate

The Heatmap must keep states honest:

- real data is shown as real
- stale data is shown as stale where available
- empty data is not presented as demo
- demo fallback is not presented as real
- API error is visible as an error state

## 6. Forbidden passes

The following must not be accepted as Phase 2 completion:

- Canvas hidden behind a query parameter only
- a card-grid replacement instead of a real heat field
- removing selected stream detail to make mobile easier
- removing pan / zoom instead of fixing it
- making wheel zoom hijack normal page scroll
- showing fallback demo data without labeling it

## 7. Current follow-up implementation items

After this gate, the next implementation patch should verify and, if needed, improve:

- toolbar wrapping below 760px
- mobile touch hit behavior
- lost pointer capture recovery
- Control map mode affordance
- Selected stream detail visibility on mobile

## 8. Completion statement

Phase 2 is complete only when the implementation and browser check satisfy this document and the non-degradation policy.
