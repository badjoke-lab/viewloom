# Phase 12A-2 compact intraday rollup migration

Status: active schema-only migration
Branch: `work-analytics-12a2-migration`

## Authorized scope

```text
add streamer_intraday_rollups table
add idx_intraday_streamer_day index
add intraday_rollup_status table
verify idempotent schema apply
record migration acceptance
```

## Prohibited scope

```text
backfill
runtime rollup generation
raw-retention extension
new high-frequency cron
category capture
provider_started_at rollup field
exact-session fields or claims
cross-provider analytics
```

## Gate basis

Accepted production size evidence:

```text
Twitch current/projected: 320.96 / 391.95 MB
Kick current/projected:   264.38 / 287.95 MB
schemaMigrationGatePass: true
```

Generation remains blocked:

```text
accountAggregateMeasured: false
generationStorageGatePass: false
generation authorized: false
```
