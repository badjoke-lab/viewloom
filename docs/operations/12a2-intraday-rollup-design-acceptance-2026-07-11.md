# 12A-2 compact intraday rollup design acceptance

Date: 2026-07-11
Workstream: 12A-2 compact intraday rollup design and migration
Status: design budget accepted; migration still blocked

## Accepted evidence identity

```text
PR: #494
Accepted design head: 398499a7161c81d014c5e9c5af83b03ffb93e4b4
Workflow: Analytics 12A2 Rollup Design
Workflow run: 29111507401
Artifact: phase12a2-intraday-rollup-budget
Artifact ID: 8234941392
Artifact digest: sha256:76992b5308750004c917bcc2795d2bbf90f9976360f31df3a948b40757631cb1
Generated at: 2026-07-10T17:35:29.371Z
Permanent evidence: docs/audits/12a2-intraday-rollup-budget-evidence.json
```

The dedicated workflow passed:

```text
static design contract verifier             pass
local SQLite storage measurement            pass
generated budget verifier                    pass
query-plan index verification                pass
design-only/no-migration guard               pass
```

## Accepted model

```text
grain: provider x day x streamer
hour encoding: sparse JSON array of compact numeric cells
Twitch retained cap: 600 streamers/day
Kick retained cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no
category fields: excluded
exact-session fields: excluded
```

The primary future baseline lookup reads at most 90 daily rows for one provider/streamer and uses the `(provider, streamer_id, day)` index.

## Storage benchmark result

The benchmark inserted seven full-cap synthetic days and assigned all 24 hourly cells to every synthetic row before projection to 90 days.

### Twitch

```text
data + primary key bytes/row: 1,087.39
secondary index bytes/row:       61.44
total measured bytes/row:     1,148.83
projected 90d rows:              54,000
projected 90d storage:            59.16 MB
20% safety projection:            70.99 MB
12A-0 payload-at-retention baseline: 311.40 MB
payload baseline + safe rollup projection: 382.39 MB
```

### Kick

```text
data + primary key bytes/row: 1,082.51
secondary index bytes/row:       61.44
total measured bytes/row:     1,143.95
projected 90d rows:              18,000
projected 90d storage:            19.64 MB
20% safety projection:            23.57 MB
12A-0 payload-at-retention baseline: 277.80 MB
payload baseline + safe rollup projection: 301.37 MB
```

Combined safe projected rollup storage is 94.56 MB across the two separate provider databases.

## Write budget

Using the two existing refresh windows and today+yesterday scope:

```text
Twitch max rollup upserts/day: 2,400
Kick max rollup upserts/day:     800
Combined rollup upserts/day:   3,200
Combined status upserts/day:       8
```

These are design bounds, not production D1 `rows_written` measurements.

## Query-plan result

The local benchmark verified:

```text
90-day streamer lookup -> idx_intraday_streamer_day
provider/day lookup     -> primary-key autoindex
```

The provider/day ordered result still uses a temporary B-tree for `daily_rank` ordering. The bounded result set is at most 600 Twitch rows or 200 Kick rows, so v1 does not add another secondary index solely for that sort. Any future index addition requires a new storage budget check.

## Migration remains blocked

Design budget acceptance is not migration authorization.

The 12A-0 baseline records payload bytes, not full remote D1 database size. Before migration apply, current remote size evidence is required for:

```text
DB_TWITCH_HOT / vl_twitch_hot
DB_KICK_HOT   / vl_kick_hot
```

The remote-size gate must prove provider-specific headroom against the current Workers Free per-database limit before schema apply.

No `db/d1` migration, collector runtime change, generation logic, retention change, or cron change is accepted by this record.

## Next 12A-2 action

```text
collect current remote D1 database-size evidence
verify provider-specific storage headroom
freeze remote-size gate evidence
then and only then add the table/index migration
```
