# ViewLoom Desktop Browser QA Log

Status: active browser QA log  
Scope: Twitch core pages  
Viewport: desktop screenshot review  
Created: 2026-05-16

## 1. Source screenshots reviewed

Reviewed screenshots from the live `viewloom.pages.dev` Twitch pages:

- `/twitch/heatmap/`
- `/twitch/day-flow/`
- `/twitch/battle-lines/`
- `/twitch/history/`

## 2. Heatmap desktop QA

Status: pass

Observed:

- Page shell loads with `Twitch data` nav and unofficial Twitch data badge.
- Hero label uses `TWITCH DATA · NOW`.
- Heatmap field renders as a dense production heatmap, not a fallback card grid.
- Top stream tiles are visible with viewer counts and momentum.
- Selected stream panel is visible and updates to a selected tile state.
- Live status card is visible and labels data as `ok · real`.
- Active streams / total viewers / strongest momentum / highest activity cards are visible.
- Legend, momentum ranking, activity ranking, and coverage note are visible.
- No obvious desktop horizontal overflow is visible in the screenshot.

Desktop result:

- Pass for visual load and desktop layout.
- Interaction checks such as pan, zoom, reset zoom, and click selection still require manual interaction verification.

## 3. Day Flow desktop QA

Status: pass

Observed:

- Page shell loads with `Twitch data` nav and unofficial Twitch data badge.
- Hero label uses `TWITCH DATA · TODAY`.
- Status panel reports `Partial · api` honestly.
- Controls are visible:
  - Range
  - Date
  - Top
  - Metric
  - Scope
  - Bucket
  - Auto update
  - Refresh
- Summary cards are visible:
  - Source
  - Observed peak
  - Scope
- Main chart renders the Today landscape with visible bucket bars.
- Time selection slider is visible.
- Time Focus panel is visible.
- Selected Stream panel is visible.
- Live Coverage, Activity unavailable, and Mode cards are visible.
- `Activity unavailable` is explicit and not presented as real activity.
- No obvious desktop horizontal overflow is visible in the screenshot.

Desktop result:

- Pass for visual load and desktop layout.
- Interaction checks such as control switching, chart selection, slider updates, and stream detail changes still require manual interaction verification.

## 4. Battle Lines desktop QA

Status: functional pass with visual follow-up required

Observed:

- Page shell loads with `Twitch data` nav and unofficial Twitch data badge.
- Hero label uses `TWITCH DATA · RIVALRY`.
- Controls are visible:
  - Top 3 / Top 5 / Top 10
  - Viewers / Indexed
  - 1m / 5m / 10m
  - Refresh
- Status banner reports `Live` and `Api · Live`.
- Primary battle summary is visible.
- Main Battle Lines chart is visible.
- Time inspector is visible and updates to a selected time state.
- Latest Reversals, Secondary Battles, and Battle Feed sections are visible.
- Footer note explicitly says missing/not-observed samples are not connected as real lines.

Functional desktop result:

- Pass for visual load, controls, chart, inspector, and supporting sections.

Visual follow-up:

- The chart background is heavily covered by missing/not-observed gap bands.
- `Observed 1405 gaps` indicates the gap overlay can dominate the chart.
- This technically preserves the rule that missing/not-observed samples are not drawn as fake continuous data, but the opacity/frequency makes the chart harder to read.

Required follow-up:

- Reduce gap-band visual dominance without hiding data-quality information.
- Prefer aggregation/thinning or lower opacity for missing/not-observed bands.
- Keep a visible coverage note and do not reconnect missing samples as real lines.

## 5. History desktop QA

Status: pass

Observed:

- Page shell loads with `Twitch data` nav and unofficial Twitch data badge.
- Hero label uses `TWITCH DATA · TRENDS`.
- Status panel reports `Partial coverage` honestly.
- Controls are visible:
  - Last 7 days
  - Last 30 days
  - Custom
  - From / To
  - Apply
  - Viewer-minutes
  - Peak viewers
- Summary cards are visible:
  - Viewer-minutes
  - Peak day
  - Top streamer
  - Coverage
- Daily trend chart is visible and marks muted/missing selected days.
- Selected day panel is visible.
- Peak archive is visible.
- Top streamers ranking is visible.
- Daily cards are visible.
- Coverage / Data Quality is visible.
- Method notes are visible.
- Battle Lines links are no longer shown as day-specific URLs in visible copy.
- No obvious desktop horizontal overflow is visible in the screenshot.

Desktop result:

- Pass for visual load and desktop layout.
- Interaction checks such as period switching, custom date validation, metric switching, and selected-day updates still require manual interaction verification.

## 6. Current desktop QA summary

| Page | Desktop visual status | Follow-up |
| --- | --- | --- |
| Heatmap | Pass | manual interaction QA still required |
| Day Flow | Pass | manual interaction QA still required |
| Battle Lines | Functional pass | reduce gap-band visual dominance |
| History | Pass | manual interaction QA still required |

## 7. Next order

1. Fix Battle Lines gap-band visual dominance.
2. Continue mobile screenshot/browser QA.
3. Continue manual interaction QA for desktop controls and chart selection.
