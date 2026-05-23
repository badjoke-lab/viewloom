# ViewLoom Provider Data / Activity Audit

## Purpose

This document records the current gap between the ViewLoom feature specifications and the actual Twitch / Kick implementation.

It must be used before changing collection interval, API payloads, visual encodings, or activity/comment features.

## Feature roles

| Feature | Spec role |
| --- | --- |
| Heatmap | Now view. Area = viewers. Color / tone should communicate momentum, state, or heat. Activity/comment heat is a required auxiliary signal when available, and must be marked unavailable when not connected. |
| Day Flow | Today view. 5m/10m flow of Top N + Others using volume/share. Activity is not band height; it is auxiliary glow/marker only. |
| Battle Lines | Rivalry / compare view. Viewer lines drive the main battle logic. Heat overlap and most heated battle are auxiliary, not the primary line logic. |
| History / Trends | 7d/30d/custom trend view. Viewer-minutes, peak, top streamers, rising, and coverage. Comment text analysis is not v1 scope. |

## Current verified data state

### Twitch

- Latest observed stream count: 284.
- Latest total viewers: 969747.
- Covered pages: 3.
- `has_more`: 1.
- Effective interval: about 1 minute from collector status.
- Heatmap endpoint currently returns `latest` and `status`, not the richer `items` payload shape used by Kick.
- Day Flow returns 126 buckets and 21 bands, but activity is unavailable.
- Battle Lines returns 5 lines and 1 event; events are viewer-line-derived, not comment heat.
- History returns 24 daily rows and 30 top streamers, with partial coverage.

### Kick

- Source: official livestreams primary.
- Latest observed stream count: 100.
- Collection interval: 5 minutes.
- D1 rows after 09:21 show 100 streams per snapshot.
- Previous fallback rows were only 2-3 streams.
- Heatmap returns 100 items and live state, but tiles are visually flat/gray because API items do not include computed momentum.
- Day Flow returns 126 buckets and 21 bands, but activity is unavailable.
- Battle Lines returns 5 lines and 3 events; activity / heat fusion is explicitly not connected.
- History returns 4 daily rows and 30 top streamers, with partial 30d coverage.

## Current critical gaps

### P0

1. Kick Heatmap color is effectively broken because Kick API items lack momentum, causing all tiles to be treated as flat.
2. Heatmap activity/comment heat is not connected, although the spec requires it as an auxiliary signal.
3. UI copy can imply that activity/chat signal exists even when it does not.
4. Twitch Heatmap API shape is not aligned with Kick Heatmap's richer payload.
5. Twitch and Kick collection intervals differ: Twitch about 1m, Kick 5m.
6. Kick History likely undercounts viewer-minutes because 5m snapshots may be treated like 1m samples.
7. Kick Battle Lines should not present 1m granularity as equivalent to Twitch if actual Kick samples are 5m.
8. Twitch has `has_more=1`, so 3 pages / 284 streams is not complete top coverage.
9. Kick official livestreams endpoint currently returns at most 100 rows per request according to docs.
10. Browser QA is still required; API success is not enough.

### P1

1. Add `targetSource` and `coverageMode` to Kick Day Flow and Kick History, matching Heatmap and Battle Lines.
2. Add consistent `activityAvailable=false` and `activityUnavailableReason=chat_sampling_not_connected` to Heatmap payloads.
3. Label Battle Lines events as viewer-derived until heat/comment fusion exists.
4. Test Twitch 5 pages and 10 pages before increasing production collection.
5. Test Kick 1m cron as an experiment before adopting it.

## Kick one-minute interval feasibility

Cloudflare cron can run every minute using `* * * * *`.

Kick official `GET /public/v1/livestreams` has `limit` max 100 according to the public docs. The docs list filters such as broadcaster_user_id, category_id, language, limit, and sort, but do not show a pagination cursor/page parameter for the endpoint.

Therefore:

- 1m collection is technically possible at the scheduler level.
- It does not increase stream count beyond 100 by itself.
- It increases freshness and improves momentum / Battle Lines / History weighting.
- It also increases writes 5x versus 5m.
- It must be tested for API failures / 429 / D1 growth before making it permanent.

## Required next checks

1. Confirm Kick 1m cron behavior with a short production test window.
2. Confirm whether Kick `/public/v1/livestreams/stats` can help display total live count separately from top 100 observed streams.
3. Confirm whether category/language split collection can expand Kick coverage beyond 100 without duplication.
4. Confirm Twitch page-count increase impact: 3 pages -> 5 pages -> 10 pages.
5. Run browser QA for all Twitch/Kick feature pages.

## Implementation order

1. Fix Kick Heatmap momentum/color by computing momentum from latest vs previous snapshots.
2. Mark activity/comment unavailable honestly in Heatmap API and UI.
3. Add interval metadata to all feature APIs.
4. Fix Kick History viewer-minute weighting.
5. Restrict or label Kick Battle Lines 1m granularity.
6. Align Twitch Heatmap API payload shape.
7. Test larger Twitch collection.
8. Test Kick 1m collection.
