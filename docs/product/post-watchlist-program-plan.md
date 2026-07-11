# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.5
Last updated: 2026-07-11
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: controlled remote schema apply and verification
12A-3 generation authorized: no
Generation blockers: `remote_schema_not_applied`, `account_aggregate_storage_unmeasured`

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
Remote schema gate blocked
12A-3 generation blocked
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
controlled remote schema apply
  -> read-only remote schema verification
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
docs/audits/12a2-remote-schema-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md
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

## Observed production remote schema

```text
Twitch schemaComplete false; observed 0 / 3
Kick schemaComplete false; observed 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

All expected schema objects were observed absent in both provider databases. The remote apply blocker is confirmed.

## Current gate

A controlled remote apply implementation must:

```text
use the accepted 004 schema contract
apply idempotently to Twitch and Kick separately
keep generation disabled during apply
perform no backfill
perform no retention change
perform no category capture
record provider-separated apply evidence
rerun the read-only schema probe
require 3 / 3 matching objects for both providers
```

12A-3 remains blocked until remote schema verification and generation storage/execution gates pass.

## Remaining Phase 12A

### Controlled remote schema apply and verification

Apply the accepted schema through a bounded provider-separated path, then rerun production read-only evidence.

### 12A-3 bounded intraday rollup generation

After gates pass, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
