# Phase 12A-3 bounded production generator

Status: implementation candidate; runtime disabled
Branch: `work-analytics-12a3-bounded-generator`

## Purpose

Implement the accepted compact intraday generator behind the existing provider collectors without starting production accumulation in this PR.

## Runtime shape

```text
shared module: workers/shared/intraday-rollup.ts
Twitch binding: DB_TWITCH_HOT
Kick binding: DB_KICK_HOT
enable flag: INTRADAY_GENERATION_ENABLED=true
default without flag: disabled
Wrangler flag in this PR: absent
```

## Schedule and bounds

```text
existing cron: */5 * * * *
new cron: no
maintenance windows: 00:20-00:24 and 12:20-12:24 UTC
target days: today and yesterday UTC only
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
backfill: no
```

## Query and transaction shape

```text
precheck: 1 statement/day
transactional write batch: 4 statements/day
maximum target days: 2
00:20 retention cleanup: 2 statements
maximum generator queries/invocation: 12
per-streamer D1 calls: no
```

Each provider-day batch:

```text
mark existing provider-day rows refresh_pending
set-based upsert selected capped rows
remove rows still refresh_pending
upsert provider-day status
```

## Failure boundary

The existing collector runs first. Schema bootstrap and intraday generation run afterward in the entry wrapper `finally` block. Generator errors are returned and logged; they do not replace the collector outcome.

## Verification

```text
TypeScript collector typecheck
existing collector contracts
static query-budget and scope verification
SQLite fixture using SQL extracted from the runtime module
ranking and hourly JSON
cap and selection state
stale-row removal
second-run idempotency
provider separation
no-source preservation
90-day retention cleanup
```

## Exclusions

```text
production generation enablement
backfill
new cron
raw retention change
category capture
exact-session fields
cross-provider analytics
web/API changes
migration changes
```

A later, separate enablement and production acceptance step may add the Wrangler flag after this implementation is merged, deployed disabled, and verified.
