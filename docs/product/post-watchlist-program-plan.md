# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.4
Last updated: 2026-07-11
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: remote schema apply / verification gate before 12A-3 generation
12A-3 generation authorized: no
Generation blockers: `remote_schema_apply_unverified`, `account_aggregate_storage_unmeasured`

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
Remote D1 schema apply unverified
12A-3 generation blocked
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
remote schema apply / verification gate
  -> 12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

## Active authorities

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
```

## Accepted size evidence

```text
Twitch current/projected 320.96 / 391.95 MB
Kick current/projected   264.38 / 287.95 MB
schemaMigrationGatePass true
```

## Accepted repository migration

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

The repository migration passed scope, local apply, idempotency, schema-shape, empty-table, and no-DML checks.

## Current gate

Repository acceptance does not prove remote application.

```text
remoteSchemaApplied false
remoteApplyEvidencePresent false
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
```

No production generator may write until remote schema existence and generation storage/execution gates are accepted.

## Remaining Phase 12A

### Remote schema apply / verification

Use an authorized remote migration path or directly verify the accepted schema already exists in both provider databases. Record provider-separated evidence.

### 12A-3 bounded intraday rollup generation

After gates pass, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
