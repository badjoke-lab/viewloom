# ViewLoom Owned API QA Notes

Status: active QA notes  
Scope: Twitch Day Flow and Battle Lines owned APIs  
Created: 2026-05-16

## 1. Current state

The legacy `livefield.pages.dev` dependency has been removed from the main branch.

Confirmed repository search:

- `livefield.pages.dev`: no remaining search hits

Current owned API files:

- `apps/web/functions/api/day-flow.ts`
- `apps/web/functions/api/battle-lines.ts`

## 2. Day Flow API current contract

`/api/day-flow` now reads from `DB_TWITCH_HOT.minute_snapshots` and returns a frontend-compatible payload.

Current returned fields include:

- `ok`
- `source`
- `state`
- `status`
- `note`
- `coverageNote`
- `partialNote`
- `lastUpdated`
- `selectedDate`
- `bucketSize`
- `topN`
- `valueMode`
- `rangeMode`
- `windowStart`
- `windowEnd`
- `isRolling`
- `summary`
- `buckets`
- `totalViewersByBucket`
- `bands`
- `focusSnapshot`
- `detailPanelSource`
- `activity`

Current supported controls:

- `today`
- `rolling24h`
- `yesterday`
- `date`
- `top=10|20|50`

Current known limitations:

- bucket size is fixed to 5m
- `activity.available` is false
- `biggestRise` is not yet calculated
- `valueMode` currently returns `volume` as API metadata even though frontend can still render volume/share from the same band values

## 3. Day Flow next fixes

Next Day Flow patches should be small and ordered:

1. Add `bucket=5|10` support without changing the frontend contract.
2. Add biggest-rise bucket calculation.
3. Improve `valueMode` echo so API metadata matches requested `metric` / `mode`.
4. Confirm empty / partial / demo / error display in `/twitch/day-flow/`.
5. Browser QA for Full / Top Focus, Volume / Share, Others, Time Focus, and selected stream detail.

## 4. Battle Lines API current contract

`/api/battle-lines` now reads from `DB_TWITCH_HOT.minute_snapshots` and returns a frontend-compatible payload.

Current returned fields include:

- `source`
- `state`
- `status`
- `platform`
- `updatedAt`
- `generatedAt`
- `top`
- `bucket`
- `window`
- `lines`
- `primaryBattle`
- `recommendedBattle`
- `secondaryBattles`
- `battles`
- `events`
- `reversals`
- `feed`
- `notes`

Current supported controls:

- `top=3|5|10`
- `bucket=1m|5m|10m`
- optional `from` / `to`

Current data-state behavior:

- unobserved buckets are returned as `value: null`, `state: not_observed`
- offline buckets are returned as `value: 0`, `state: offline`
- missing/not observed samples must not be connected as real line values

Current known limitations:

- event detection is based on leader reversals in the primary pair
- metric is accepted by the frontend but not materially used by the owned API payload yet
- frontend QA is still required for selected time, Time Inspector, gap band, reversals, and secondary battles

## 5. Battle Lines next fixes

Next Battle Lines patches should be small and ordered:

1. Echo/handle `metric=viewers|indexed` explicitly in the API payload.
2. Add clearer partial/empty notes to the API payload.
3. Browser QA for selected time and Time Inspector.
4. Browser QA for gap band and missing/offline/not_observed rendering.
5. Browser QA for reversal events and secondary battle selection.

## 6. QA priority

Immediate priority after this note:

1. Day Flow `metric` / `bucket` metadata support.
2. Day Flow frontend empty/partial/error display check.
3. Battle Lines selected-time rendering check.
4. Status rebuild from current main.

## 7. Non-degradation reminder

These owned APIs are backend replacements only.

They must not justify removing:

- Day Flow Full / Top Focus
- Day Flow Volume / Share
- Day Flow Others
- Day Flow Time Focus
- Battle Lines selected time
- Battle Lines Time Inspector
- Battle Lines gap band
- Battle Lines reversal events
- missing / offline / not_observed separation
