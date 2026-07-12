# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.9
Last updated: 2026-07-12
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-3 bounded production generator implementation
Production generation started: no
Remaining implementation boundary: `bounded_generator_not_implemented`

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design and migration accepted through PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
12A-3 execution-cost gate accepted PR #508
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Account D1 databases measured 8 / 8
Generation storage gate pass
Generation execution-cost gate pass
Bounded generator implementation current / not started
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-3 bounded production generator implementation
  -> production accumulation acceptance
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
docs/audits/12a3-execution-cost-probe-contract.json
docs/audits/12a3-execution-cost-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a3-account-storage-acceptance-2026-07-12.md
docs/operations/12a3-execution-cost-acceptance-2026-07-12.md
```

## Accepted 12A-3 gates

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true

Twitch source snapshots 288
Twitch aggregate D1 duration / wall 790.730 / 1368 ms
Twitch full-cap write wall projection 5040 ms

Kick source snapshots 288
Kick aggregate D1 duration / wall 426.097 / 788 ms
Kick full-cap write wall projection 1848 ms

idempotent second pass true for both providers
probe rows retained 0
temporary Workers retained no
```

## Closed blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
generation_execution_cost_unmeasured
```

## Current implementation boundary

```text
implementationAuthorized true
generationAuthorized false
runtimeGenerationStarted false
bounded_generator_not_implemented
```

### 12A-3 bounded intraday rollup generation

Implement provider-specific generation behind existing maintenance windows. Reuse the accepted aggregate/upsert contract, refresh only today and yesterday, keep Twitch and Kick separate, use idempotent upserts, add no new cron, perform no backfill, contain failures after collector execution, and preserve cost observability.

Runtime generation remains disabled until implementation acceptance and deploy verification.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
