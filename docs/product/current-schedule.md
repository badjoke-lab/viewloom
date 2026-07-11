# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-11

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 remote schema evidence observed PR #501
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Current gate controlled remote schema apply and verification
12A-3 generation authorized no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design and repository migration               accepted through PR #499
12A-2 remote schema observation                     complete PR #501
Controlled remote schema apply / verification       current
12A-3 bounded intraday rollup generation            blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted repository migration

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Local scope, apply, idempotency, exact schema shape, empty-table, and no-DML verification passed.

## Observed remote state

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

The expected schema is observed absent in both provider databases.

## Exact next action

```text
implement a controlled idempotent provider-separated remote apply path
apply only the accepted 004 schema
keep generation disabled
perform no backfill
rerun /api/schema-audit
require Twitch 3 / 3 matching objects
require Kick 3 / 3 matching objects
then close the remote_schema_not_applied blocker
```

## 12A-3 generation gate

```text
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
blockers:
  remote_schema_not_applied
  account_aggregate_storage_unmeasured
```

Do not add production writes until these gates close.

## Later steps

12A-4 remains a provider-specific category foundation. 12A-5 closes the foundation and hands off to localization while evidence accumulates. Phase 15 performs capability and calibration audit before Phase 16A-F implementation.

## Governing evidence

- `../audits/12a2-intraday-rollup-design-contract.json`
- `../audits/12a2-intraday-rollup-budget-evidence.json`
- `../audits/12a2-binding-size-production-evidence.json`
- `../audits/12a2-migration-acceptance.json`
- `../audits/12a2-remote-schema-production-evidence.json`
- `../audits/12a2-current-gate-state.json`

Do not bypass remote-schema or generation gates with payload-only estimates, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
