# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.8
Last updated: 2026-07-12
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-3 production execution-cost measurement and bounded generation dry run
12A-3 generation authorized: no
Remaining blocker: `generation_execution_cost_unmeasured`

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 repository migration accepted PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Remote schema gate pass
Account D1 databases measured 8 / 8
Generation storage gate pass
12A-3 generation blocked pending execution-cost acceptance
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-3 production execution-cost measurement and bounded generation dry run
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
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a3-account-storage-gate-contract.json
docs/audits/12a3-account-storage-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
docs/operations/12a3-account-storage-acceptance-2026-07-12.md
```

## Accepted production and storage state

```text
Twitch schemaComplete true; objects 3 / 3
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true

Twitch current/projected storage 319.39 / 390.38 MB
Kick current/projected storage   268.99 / 292.56 MB
Account databases measured       8 / 8
Account current/projected        3551.70 / 3646.26 MB
Account operational ceiling      4608 MB
Account projected utilization    71.22%
Account projected headroom       1473.74 MB
generationStorageGatePass        true
```

The permanent deployment workflow uses direct Wrangler 4 CLI and separate provider working directories. The permanent account storage workflow uses D1 Read only, deletes raw control-plane responses before artifact upload, and runs manually and weekly.

## Closed blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
```

## Current 12A-3 execution gate

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured true
generationStorageGatePass true
generation authorized false
runtimeGenerationStarted false
remaining blocker generation_execution_cost_unmeasured
```

The next implementation must run a bounded provider-separated dry run and record D1 rows_read, rows_written, SQL duration, Worker duration, output rows/bytes, idempotency, and failure behavior before recurring production accumulation begins.

### 12A-3 bounded intraday rollup generation

After the execution gate passes, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and continue measuring collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
