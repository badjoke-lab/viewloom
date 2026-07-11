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
Current gate remote schema apply / verification
12A-3 generation authorized no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design and repository migration               accepted through PR #499
Remote schema apply / verification                  current gate
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

Verified:

```text
scope guard pass
local apply pass
second apply idempotency pass
exact table shape pass
exact primary-key shape pass
exact secondary-index shape pass
empty after apply
forbidden DML absent
```

## Current remote apply boundary

```text
repositoryMigrationAccepted true
remoteSchemaApplied false
remoteApplyEvidencePresent false
```

Before any production generator runs, prove the new tables exist in both provider D1 databases or apply the accepted migration through an authorized remote path and then verify the schema.

## 12A-3 generation gate

```text
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
blockers:
  remote_schema_apply_unverified
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
- `../audits/12a2-current-gate-state.json`

Do not bypass remote-schema or generation gates with payload-only estimates, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
