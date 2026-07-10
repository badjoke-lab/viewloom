# ViewLoom compact intraday rollup design v1

Status: 12A-2 candidate design
Design version: `intraday-rollup-v1`
Source contract: `analytics-source-v1`

## Purpose

Preserve enough time-of-day structure for later 90-day streamer baseline work without extending Twitch or Kick raw snapshot retention.

The design is provider-separated and bounded. 12A-2 design acceptance does not itself authorize production migration or generation.

Permanent machine-readable design authority:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
```

Budget measurement:

```text
scripts/measure-12a2-intraday-rollup-budget.mjs
```

## Why current daily rollups are insufficient

The current `daily_rollups` table stores one provider/day row. It preserves daily total viewer-minutes, daily peak, observed snapshot support, coverage state, and Top-30 streamer summaries.

That is suitable for current History, but it cannot reconstruct:

```text
streamer normal value by weekday x hour
hour-specific support counts
hour-specific first/last viewer values
hour-specific peak and observation coverage
```

The existing daily rollup remains unchanged.

## Chosen grain

Primary grain:

```text
provider x day x streamer
```

Each row contains a sparse compact JSON array of observed UTC hours.

Cell format:

```text
[
  hour_utc,
  viewer_minutes,
  peak_viewers,
  sample_count,
  observed_minutes,
  first_viewers,
  last_viewers
]
```

Example:

```json
[[0,60000,1200,12,60,900,1050],[1,63000,1300,12,60,1050,1100]]
```

Only observed hours are stored. Cells are sorted by `hour_utc`.

This design favors the primary future query: one streamer across up to 90 daily rows, followed by weekday/hour grouping and support checks.

## Primary table

Candidate schema:

```sql
CREATE TABLE streamer_intraday_rollups (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  streamer_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  daily_rank INTEGER NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  observed_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_json TEXT NOT NULL DEFAULT '[]',
  selection_state TEXT NOT NULL DEFAULT 'complete_within_daily_cap',
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, streamer_id)
);

CREATE INDEX idx_intraday_streamer_day
  ON streamer_intraday_rollups(provider, streamer_id, day);
```

The primary key supports provider/day refresh and bounded daily reads. The secondary index supports one-streamer multi-day baseline reads.

## Status table

Candidate schema:

```sql
CREATE TABLE intraday_rollup_status (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  candidate_streamers INTEGER NOT NULL,
  retained_streamers INTEGER NOT NULL,
  retained_streamer_cap INTEGER NOT NULL,
  source_snapshots INTEGER NOT NULL,
  selection_state TEXT NOT NULL,
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  refreshed_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);
```

This table prevents a missing streamer row from being overinterpreted.

When candidate streamers exceed the cap:

```text
selection_state = daily_cap_truncated
```

In that state, absence from retained rows does not mean offline and does not prove that ViewLoom never observed the streamer.

## Provider-specific caps

The initial v1 cap is twice the current observed window:

```text
Twitch observed window: 300
Twitch daily retained cap: 600

Kick observed window: 100
Kick daily retained cap: 200
```

Selection order:

```text
daily viewer_minutes DESC
peak_viewers DESC
streamer_id ASC
```

The caps are explicit Free Strong bounds, not claims about total provider activity.

12A-3 must record candidate count, retained count, and truncation frequency. A later cap change requires a new storage budget check.

## Retention

```text
intraday rollup: 90 days
Twitch raw:      unchanged at 30 days
Kick raw:        unchanged at 60 days
daily rollup:    unchanged at 180 days
```

No raw-retention extension is part of this design.

## Refresh design

No new cron is required by default.

Preferred windows remain:

```text
00:20-00:24 UTC
12:20-12:24 UTC
```

Each accepted refresh scope is:

```text
today
yesterday
```

Maximum v1 rollup row upserts from this schedule:

```text
Twitch: 2 windows x 2 days x 600 = 2,400/day
Kick:   2 windows x 2 days x 200 =   800/day
Combined design upper bound:        3,200/day
```

Status rows add at most eight provider/day upserts per day across both databases under the same schedule.

These are design upper bounds, not production D1 `rows_written` measurements. 12A-3 must record D1 execution metadata.

## Query contracts

### 90-day streamer baseline input

```sql
SELECT day, hourly_json, sample_count, observed_minutes
FROM streamer_intraday_rollups
WHERE provider = ?
  AND streamer_id = ?
  AND day BETWEEN ? AND ?
ORDER BY day;
```

Expected primary row bound:

```text
<= 90 rows
```

The secondary index must be used.

### Recent fallback context

Same index, typically:

```text
<= 30 daily rows
```

### Provider/day refresh ownership

The primary key prefix:

```text
(provider, day)
```

owns idempotent delete/upsert or replacement of one bounded provider/day set.

## Timing targets

These are future acceptance targets, not current measurements:

```text
single provider/day refresh target: < 10,000 ms
single provider/day hard stop:       < 25,000 ms
90-day streamer lookup target:       < 1,000 ms
```

The hard stop leaves margin below the current documented D1 30-second maximum query duration.

Production D1 timing, `rows_read`, and `rows_written` evidence belong to 12A-3.

## Storage measurement method

The budget workflow creates local SQLite databases using the exact candidate schema.

For each provider it:

```text
1. creates empty candidate tables
2. inserts 7 full-cap synthetic days
3. gives every synthetic rollup row all 24 hourly cells
4. VACUUMs and measures data + primary-key bytes
5. creates the secondary index
6. VACUUMs and measures index growth separately
7. derives measured bytes/row
8. projects 90-day capped storage
9. adds a 20% safety margin
10. combines the projection with the 12A-0 payload-at-retention baseline
```

The benchmark is deliberately conservative about hourly occupancy. It is still not remote D1 size evidence.

## Free-plan migration boundary

Current Cloudflare documentation records these relevant Workers Free limits:

```text
maximum D1 database size: 500 MB
maximum D1 account storage: 5 GB
rows read: 5 million/day
rows written: 100,000/day
queries per Worker invocation: 50
maximum query duration: 30 seconds
```

12A-0 retained payload MB is not complete D1 database size. Therefore:

```text
design budget artifact accepted != migration authorized
```

Before applying a migration, 12A-2 still requires current remote database-size evidence for both provider databases.

## 12A-1 contract preservation

The intraday rollup intentionally excludes:

```text
category fields
exact session id
exact stream end
authoritative offline state
provider_started_at
```

`provider_started_at` is approved for future Twitch capture as provider-reported evidence, but this rollup grain is day x streamer and must not imply one daily row equals one exact session.

Kick provider start time remains unavailable until source verification.

Category capture remains unapproved for both providers in the current contract.

## 12A-3 handoff

12A-3 may implement generation only after 12A-2 budget and migration gates close.

It must provide:

```text
idempotent refresh evidence
candidate vs retained counts
truncation frequency
D1 rows_read
D1 rows_written
SQL duration
collector duration impact
failure visibility
proof that analytics maintenance failure does not corrupt raw collection
```

Twitch and Kick evidence must remain separate.
