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
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 controlled apply code merged PRs #502-#503
12A-2 collector deployment and remote schema accepted PR #506
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Worker deployment evidence present
Remote schema gate pass
Current workstream 12A-3 generation storage and execution gate
12A-3 generation authorized no
Remaining blocker account_aggregate_storage_unmeasured
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
- 12A-2 production size evidence: `audits/12a2-binding-size-production-evidence.json`
- 12A-2 migration acceptance: `audits/12a2-migration-acceptance.json`
- 12A-2 deployment evidence: `audits/12a2-collector-worker-deploy-evidence.json`
- 12A-2 current state: `audits/12a2-current-gate-state.json`
- 12A-2 deployment acceptance: `operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md`
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
12A-3 generation storage and execution gate         current / blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted production state

```text
method Wrangler 4 CLI
Twitch deploy success; DB_TWITCH_HOT -> vl_twitch_hot
Twitch schemaComplete true; objects 3 / 3
Kick deploy success; DB_KICK_HOT -> vl_kick_hot
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0
```

The permanent collector deployment workflow verifies on pull requests and deploys only on main push or manual dispatch. It uses repository Cloudflare secrets without storing or printing their values.

## Current 12A-3 boundary

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
```

The next workstream is the account-wide storage and execution-cost gate. Production rollup generation remains disabled.

## Forward order

```text
12A-3 generation storage and execution gate
  -> bounded intraday generation
  -> 12A-4 category foundation
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
