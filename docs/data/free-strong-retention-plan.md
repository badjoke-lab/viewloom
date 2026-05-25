# ViewLoom Free Strong data retention plan

Status: accepted plan for the zero-cost ViewLoom data path.

## Fixed target

```text
Cost: free
Twitch raw snapshots: 30 days
Kick raw snapshots: 60 days by default, 90 days only after capacity checks
Observed set: Twitch 300 / Kick 100 maintained
History: 180 days via daily rollups
```

## Current measured baseline

Recent D1 audit confirmed both providers are collecting at the intended 5-minute cadence.

```text
Twitch rows_24h: 288
Kick rows_24h:   288

Twitch minute_snapshots: 714
Twitch payload total:    24.53 MB

Kick minute_snapshots:   1153
Kick payload total:      10.66 MB
```

Approximate raw payload growth:

```text
Twitch: about 10 MB/day
Kick:   about 3 MB/day
Total:  about 13 MB/day
```

These are payload-only estimates. D1 table overhead and indexes add extra storage.

## Main decision

Do not reduce observed streamer count yet.

The current problem is not write count. The risk is long-term raw snapshot storage and History reading too many raw rows.

## Retention policy

```text
Twitch minute_snapshots: 30 days
Kick minute_snapshots:   60 days first, 90 days if measured capacity remains safe
collector_runs:          14 days
daily_rollups:           180 days
```

## API policy

```text
Heatmap:
  latest raw snapshot only

Day Flow:
  raw snapshots inside the raw retention window

Battle Lines:
  raw snapshots inside the raw retention window

History:
  daily_rollups, not raw minute_snapshots, for normal 7d / 30d / custom ranges
```

## PR roadmap

```text
PR-Data-01: Free Strong docs + data storage audit API
PR-Data-02: daily_rollups schema
PR-Data-03: daily rollup generator and backfill path
PR-Data-04: migrate History APIs to daily_rollups
PR-Data-05: raw retention cleanup
PR-Data-06: raw-retention boundary UI for Day Flow / Battle Lines / History links
PR-Data-07: Kick 90-day retention evaluation
PR-Data-08: Free Strong runbook and QA commands
```

## Acceptance criteria

```text
- Twitch and Kick keep 5-minute collection.
- Twitch keeps up to 300 observed streams.
- Kick keeps up to 100 official livestream rows when available.
- Twitch raw snapshots stop growing beyond 30 days.
- Kick raw snapshots stop growing beyond 60 days unless 90-day mode is approved.
- History uses daily_rollups for period views.
- daily_rollups retains 180 days.
- Data audit output exposes rows, payload MB, oldest/latest bucket, rows_24h, and retention estimates.
```

## Later paid path

If paid infrastructure is approved later, the next target is longer raw retention and an optional R2 raw archive. D1 should remain the normal read path for latest data, short raw windows, rollups, and status.
