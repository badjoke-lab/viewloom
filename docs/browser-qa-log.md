# ViewLoom Browser QA Log

Status: active QA log  
Scope: Twitch core pages after owned API recovery  
Started: 2026-05-16

## 1. CI baseline

Latest verified PR-head checks before Heatmap QA:

- PR #99 head commit: `03288d88dc39a0d6442c1c53eb8ab61cbb95095d`
- Web checks: success
- Web build: success

Main merge commit for #99:

- `dd9918a7b482ab0704d096fc1bec3012697457b3`

## 2. Source label gate

Status: pass by source inspection

Confirmed:

- `Twitch ViewLoom` was removed from `apps/web/src/main.ts`.
- `Kick ViewLoom` was removed from `apps/web/src/main.ts`.
- `Now / Today / Compare` was replaced with `Now / Today / Rivalry` in source.
- Battle Lines role label was changed to `Rivalry` in source.
- Header nav uses `Twitch data` and `Kick data`.
- `label-risk-cleanup.ts` no longer performs broad standalone `Compare` replacement.

Remaining note:

- `label-risk-cleanup.ts` still catches known risky legacy phrases as a safety net.

## 3. Heatmap static QA

URL:

- `/twitch/heatmap/`

Status: static implementation check passed, browser interaction QA still required.

Confirmed in source:

- Heatmap entry page loads `src/main.ts`, `twitch-history-nav.ts`, `label-risk-cleanup.ts`, and `heatmap-unify.ts`.
- `hydrateTwitchHeatmap()` runs for `body[data-page="twitch-heatmap"]`.
- `shouldUseCanvasRenderer()` returns Canvas by default.
- DOM/legacy renderer is only opt-out via:
  - `?heatmapRenderer=dom`
  - `?heatmapRenderer=legacy`
  - `localStorage.viewloom.heatmap.renderer = dom`
  - `localStorage.viewloom.heatmap.renderer = legacy`
- Canvas scene includes:
  - zoom badge
  - page scroll / move mode badge
  - Control map button
  - Reset zoom button
  - selected tile hit testing
  - selection overlay
  - pointer pan
  - Ctrl/Alt/Meta + wheel zoom
  - double-click zoom
  - explicit mobile move mode
  - pinch gesture in move mode
- Mobile toolbar hardening is now in source:
  - toolbar stacks at `max-width:760px`
  - action controls become a 2-column grid
  - controls use `width:100%` and `min-width:0`
  - mobile viewport min-height is 360px

## 4. Heatmap browser QA still required

Desktop viewport:

- 1440 x 900

Must verify in browser:

- Canvas is visible without query flag.
- no horizontal overflow.
- Ctrl/Alt/Meta + wheel zoom works.
- drag pan works with mouse.
- click selection updates the selected stream rail.
- reset zoom works.
- live status and coverage notes are visible.

Mobile viewport:

- 390 x 844

Must verify in browser:

- page scroll is not hijacked by the map in normal mode.
- Control map toggles move mode.
- Page scroll / 100% / Control map / Reset zoom controls are reachable and not clipped.
- tap selection updates the detail panel.
- chart area remains visible.
- selected stream detail is reachable below or near the map.

## 5. Next QA order

1. Heatmap desktop browser QA.
2. Heatmap mobile browser QA.
3. Day Flow desktop browser QA.
4. Day Flow mobile browser QA.
5. Battle Lines desktop browser QA.
6. Battle Lines mobile browser QA.
7. Twitch Status browser QA.
8. History browser QA.
