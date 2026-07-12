# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-12

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

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
Current workstream 12A-3 production execution-cost measurement and bounded generation dry run
12A-3 generation authorized no
Remaining blocker generation_execution_cost_unmeasured
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics specification: `product/analytics-observation-system-spec.md`
- Analytics implementation plan: `product/analytics-observation-system-plan.md`
- 12A-0 baseline: `audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `audits/12a1-source-evidence.json`
- 12A-2 design contract: `audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 migration acceptance: `audits/12a2-migration-acceptance.json`
- 12A-2 deployment evidence: `audits/12a2-collector-worker-deploy-evidence.json`
- 12A-3 account storage contract: `audits/12a3-account-storage-gate-contract.json`
- 12A-3 account storage evidence: `audits/12a3-account-storage-evidence.json`
- Current gate state: `audits/12a2-current-gate-state.json`
- 12A-2 deployment acceptance: `operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md`
- 12A-3 storage acceptance: `operations/12a3-account-storage-acceptance-2026-07-12.md`
- Phase 12 release acceptance: `audits/phase12-release-acceptance.json`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12A

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design, migration, deployment, remote schema  accepted through PR #506
12A-3 account-wide storage gate                     accepted PR #507
12A-3 execution-cost measurement and bounded dry run current / blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted production and storage state

```text
Twitch schemaComplete true; objects 3 / 3
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0

Twitch current/projected storage 319.39 / 390.38 MB
Kick current/projected storage   268.99 / 292.56 MB
Account databases measured       8 / 8
Account current/projected        3551.70 / 3646.26 MB
Account operational ceiling      4608 MB
generationStorageGatePass        true
```

The permanent storage workflow uses D1 Read only, runs manually and weekly, deletes raw control-plane responses, and persists no database names, database IDs, Account ID, or secret values.

## Current 12A-3 boundary

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured true
generationStorageGatePass true
generationAuthorized false
runtimeGenerationStarted false
```

The next workstream is a production execution-cost measurement and bounded dry run. Production rollup generation remains disabled until that gate passes.

## Forward order

```text
12A-3 production execution-cost measurement and bounded dry run
  -> bounded intraday generation
  -> 12A-4 category foundation
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
