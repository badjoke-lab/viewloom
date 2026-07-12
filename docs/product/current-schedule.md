# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design and migration accepted through PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
12A-3 execution-cost gate accepted PR #508
12A-3 bounded generator enabled PR #510
12A-3 production accumulation accepted PR #511
Production generation started yes
Current gate 12A-4 provider-specific category capture foundation
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design/migration/deploy/remote schema          accepted through PR #506
12A-3 storage/execution/generator/accumulation       complete through PR #511
12A-4 provider-specific category capture foundation current
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted gate state

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true
boundedGeneratorEnabled true
postMergeAccumulationPass true
runtimeGenerationStarted true
providerSeparated true
newCronAdded false
backfillPerformed false
```

## Exact next action

```text
define provider-specific category capture contracts
preserve Twitch and Kick separation
reuse existing collector cadence where possible
add no cross-provider category ranking
keep raw retention unchanged
measure storage and execution cost before runtime enablement
add no backfill
add no new high-frequency cron
```

## Governing evidence

- `../audits/12a2-intraday-rollup-design-contract.json`
- `../audits/12a2-intraday-rollup-budget-evidence.json`
- `../audits/12a2-migration-acceptance.json`
- `../audits/12a2-collector-worker-deploy-evidence.json`
- `../audits/12a3-account-storage-evidence.json`
- `../audits/12a3-execution-cost-evidence.json`
- `../audits/12a3-generator-enablement-evidence.json`
- `../audits/12a3-postmerge-acceptance-evidence.json`
- `../audits/12a2-current-gate-state.json`

Do not add unbounded backfill, raw-retention extension, a new high-frequency cron, exact-session claims, or cross-provider analytics.
