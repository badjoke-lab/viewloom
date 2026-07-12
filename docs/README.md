# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-12

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and accepted evidence before changing the repository.

## Current execution state

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
Current workstream 12A-3 bounded production generator implementation
Production generation started no
Remaining implementation boundary bounded_generator_not_implemented
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
- 12A-3 execution-cost contract: `audits/12a3-execution-cost-probe-contract.json`
- 12A-3 execution-cost evidence: `audits/12a3-execution-cost-evidence.json`
- Current gate state: `audits/12a2-current-gate-state.json`
- 12A-3 storage acceptance: `operations/12a3-account-storage-acceptance-2026-07-12.md`
- 12A-3 execution-cost acceptance: `operations/12a3-execution-cost-acceptance-2026-07-12.md`
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
12A-3 execution-cost gate                           accepted PR #508
12A-3 bounded production generator implementation   current / not started
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted 12A-3 gates

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true

Twitch aggregate D1 duration / wall 790.730 / 1368 ms
Twitch full-cap write wall projection 5040 ms
Kick aggregate D1 duration / wall 426.097 / 788 ms
Kick full-cap write wall projection 1848 ms

idempotent second pass true for both providers
probe rows retained 0
temporary Workers retained no
```

## Current boundary

```text
implementationAuthorized true
generationAuthorized false
runtimeGenerationStarted false
remaining implementation boundary bounded_generator_not_implemented
```

The next workstream may implement bounded provider-specific generation behind existing maintenance windows. Production writes remain disabled until that implementation is separately accepted.

## Forward order

```text
12A-3 bounded production generator implementation
  -> production accumulation acceptance
  -> 12A-4 category foundation
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
