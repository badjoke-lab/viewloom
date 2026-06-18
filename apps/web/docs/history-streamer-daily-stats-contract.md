# History streamer daily stats contract

History exposes a bounded, provider-separated daily streamer statistics layer derived from each day's existing `topStreamers` data.

## Public fields

```text
streamerDailyStats
streamerDailyStatsMeta
```

Each `streamerDailyStats` item includes:

```text
day
coverageState
streamerId
displayName
viewerMinutes
peakViewers
avgViewers
observedMinutes
rankByViewerMinutes
rankByPeak
changePct
changeAbs
comparisonState
```

## Metadata

```text
rankingBasis = viewer_minutes
limitPerDay = 10
bounded = true
includesDayOverDayComparison = true
providerSeparated = true
source = daily.topStreamers
```

## Scope and boundedness

The list contains at most the existing Top 10 streamer records for each requested day. It is not a complete all-streamer archive and must not be described as provider-wide coverage.

Missing days contribute no streamer records. Partial, demo, and good day states are copied to each record through `coverageState`.

## Data paths

The contract is generated from the existing History payload after the original handler finishes.

- `daily_rollups` path: uses normalized daily `top_streamers_json` data.
- `minute_snapshots` fallback: uses the same normalized day-level ranking model.
- error and empty responses: return `streamerDailyStats: []` with the same metadata.

No new database table, migration, cron, or collector job is introduced.

## Provider separation

Twitch and Kick History responses receive the same field shape, but their records are never combined. Twitch History remains under `/api/history`; Kick History remains under `/api/kick-history`.

Kick History continues to apply its provider coverage contract inside the route. The shared middleware only adds daily streamer statistics and does not apply Kick coverage a second time.

## Compatibility

The following existing fields remain unchanged:

```text
daily[].topStreamers
topStreamers
coverage
summary
comparison
state
source
```

This layer is an additive API foundation for additional rankings, peak archive, battle archive, channel pages, and exports.
