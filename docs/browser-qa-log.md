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
- Standalone feature entry files may still contain short platform labels like `Twitch` in their own local headers, but visible route labels are normalized by `label-risk-cleanup.ts`.

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

## 5. Day Flow static QA

URL:

- `/twitch/day-flow/`

Status: static implementation check passed, browser interaction QA still required.

Confirmed in source:

- Day Flow entry page loads:
  - `twitch-day-flow-band-focus-experiment.ts`
  - `twitch-day-flow-alpha-experiment.ts`
  - `twitch-day-flow-render-polish.ts`
  - `twitch-day-flow.ts`
  - `twitch-history-nav.ts`
  - `label-risk-cleanup.ts`
  - `dayflow-unify.ts`
- `twitch-day-flow.ts` owns the Day Flow app shell and fetches `/api/day-flow` directly.
- `/api/day-flow` is ViewLoom-owned and does not proxy to `livefield.pages.dev`.
- Frontend query parameters include:
  - `day`
  - `rangeMode`
  - `date`
  - `top`
  - `mode`
  - `metric`
  - `bucket`
- Owned API supports:
  - `today`
  - `rolling24h`
  - `yesterday`
  - `date`
  - `top=10|20|50`
  - `bucket=5|10`
  - `metric=volume|share`
- Owned API returns fields used by the frontend:
  - `buckets`
  - `totalViewersByBucket`
  - `bands`
  - `detailPanelSource`
  - `coverageNote`
  - `partialNote`
  - `activity`
- `Others` is marked with `isOthers: true` by the owned API.
- `activity.available` is false and the frontend displays `Activity unavailable` honestly.
- `biggestRiseTime` is returned in `detailPanelSource` and displayed in the detail panel.
- Mobile CSS exists for:
  - two-column controls below 640px
  - hidden desktop rail below 640px
  - mobile Time Focus card
  - mobile detail dialog button
  - 300px mobile canvas height

Known source note:

- The local Day Flow header still renders simple `Twitch` / `Kick` nav labels before `label-risk-cleanup.ts` normalizes visible text. This is not a runtime blocker, but source-level cleanup should be considered later when editing the large Day Flow file safely.

## 6. Day Flow browser QA still required

Desktop viewport:

- 1440 x 900

Must verify in browser:

- page loads without runtime errors.
- Full / Top Focus switching remains visible and usable.
- Volume / Share switching remains visible and usable.
- Top 10 / 20 / 50 switching remains visible and usable.
- 5m / 10m bucket switching updates API metadata and chart rendering.
- Others appears in Full context when applicable.
- Time selection slider updates the chart selection and Time Focus panel.
- clicking the chart selects a bucket and stream.
- selected stream detail updates.
- activity unavailable state is clearly shown.
- partial/empty states do not look like normal successful data.

Mobile viewport:

- 390 x 844

Must verify in browser:

- controls fit without horizontal overflow.
- chart remains visible at mobile height.
- Time Focus mobile card is readable.
- Open detail button opens the dialog.
- detail dialog has readable content and a working Close button.
- page scroll remains usable.

## 7. Next QA order

1. Heatmap desktop browser QA.
2. Heatmap mobile browser QA.
3. Day Flow desktop browser QA.
4. Day Flow mobile browser QA.
5. Battle Lines desktop browser QA.
6. Battle Lines mobile browser QA.
7. Twitch Status browser QA.
8. History browser QA.
