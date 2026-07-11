# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.7
Last updated: 2026-07-12
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-3 generation storage and execution gate
12A-3 generation authorized: no
Remaining blocker: `account_aggregate_storage_unmeasured`

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 controlled apply code merged PRs #502-#503
12A-2 collector deployment and remote schema accepted PR #506
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Worker deployment evidence present
Remote schema gate pass
12A-3 generation blocked pending storage/execution acceptance
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-3 generation storage and execution gate
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
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
```

## Accepted 12A-2 production state

```text
Twitch projected with safety 391.95 MB
Kick projected with safety   287.95 MB
schemaMigrationGatePass true

Twitch Worker deployment success
Twitch schemaComplete true; objects 3 / 3
Kick Worker deployment success
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0
```

The permanent deployment workflow uses direct Wrangler 4 CLI and separate provider working directories. Pull requests verify only; main push and manual dispatch may deploy. Secret values are never stored in repository evidence.

## Closed 12A-2 blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
```

## Current 12A-3 gate

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
```

The next implementation must establish account-wide D1 storage evidence and bounded generator execution-cost evidence before production accumulation begins.

### 12A-3 bounded intraday rollup generation

After all gates pass, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
