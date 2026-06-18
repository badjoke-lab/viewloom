# Twitch feature coverage audit

Audit scope: Twitch Heatmap, Day Flow, Battle Lines, and History public API responses.

## C5 result

All four APIs remain isolated to Twitch storage and now receive the same structured provider-observation coverage contract after their existing handlers finish.

| Feature | Public route | targetSource | sourceMode | coverageMode | existing coverage meaning | coverageModel | explicit non-provider-wide |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Heatmap | `/api/twitch-heatmap` | `twitch-helix-streams` | yes | preserved | prose note only | yes | yes |
| Day Flow | `/api/day-flow` | `twitch-helix-streams` | yes | added | bucket completeness remains in existing fields | yes | yes |
| Battle Lines | `/api/battle-lines` | `twitch-helix-streams` | yes | added | observed timeline buckets | yes | yes |
| History | `/api/history` | `twitch-helix-streams` | yes | added | requested-day completeness | yes | yes |

## Shared provider-observation contract

Every enriched response includes:

```text
provider = twitch
platform = twitch
coverageMode
targetSource = twitch-helix-streams
sourceMode
coverageModel.mode = helix | fixture | unknown
coverageModel.targetSource
coverageModel.sourceMode
coverageModel.authMode
coverageModel.label
coverageModel.isDirectoryCoverage
coverageModel.isProviderWide = false
coverageModel.isBounded = true
coverageModel.description
coverageModel.limitation
coverageModel.sourceLimitation
coverageModel.topLimit = 300
coverageModel.collectionCadenceSeconds = 300
```

## Source-mode rules

- `real`, `api`, `authenticated`, Helix target values, and observed/partial top-page modes normalize to `coverageModel.mode = helix`.
- `demo` and `fixture` normalize to `coverageModel.mode = fixture`.
- Missing or unconfirmed source information normalizes to `coverageModel.mode = unknown`.
- The raw public `sourceMode` remains separate from the normalized coverage mode.

## Response-path coverage

The root Functions middleware enriches all JSON responses from:

```text
/api/twitch-heatmap
/api/day-flow
/api/battle-lines
/api/history
```

This includes success, empty, partial, stale, demo, validation-error, range-error, and internal-error responses. Non-JSON responses pass through unchanged. Enrichment failure returns the original response.

## Compatibility rules

- Battle Lines timeline `coverage` is preserved unchanged.
- History day-completeness `coverage` is preserved unchanged.
- Heatmap legacy `coverageMode` is preserved when already present.
- Chart, ranking, state, source, and fallback behavior remain owned by the original feature handler.
- The middleware does not read `DB_KICK_HOT` or include Kick totals.
- Kick feature routes continue through the separate Kick enrichment helper.
- `/api/kick-history` remains route-level and is not double-enriched.
