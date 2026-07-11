# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-11

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
Remote D1 schema apply unverified
Current workstream remote schema apply / verification gate before 12A-3 generation
12A-3 generation authorized no
Generation blockers account_aggregate_storage_unmeasured, remote_schema_apply_unverified
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
- 12A-2 repository migration acceptance: `audits/12a2-migration-acceptance.json`
- 12A-2 current state: `audits/12a2-current-gate-state.json`
- 12A-2 migration acceptance record: `operations/12a2-migration-acceptance-2026-07-11.md`
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
12A-2 design and repository migration               accepted through PR #499
Remote schema apply / verification                  current gate
12A-3 bounded intraday rollup generation            blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted migration boundary

```text
repository migration accepted true
local apply verified true
idempotency verified true
remoteSchemaApplied false
remoteApplyEvidencePresent false
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
```

The repository migration is `db/d1/004_intraday_rollups.sql`. It creates `streamer_intraday_rollups`, `idx_intraday_streamer_day`, and `intraday_rollup_status` without inserting rows.

## Forward order

```text
remote schema apply / verification gate
  -> 12A-3 generation storage and execution gate
  -> bounded intraday generation
  -> 12A-4 category foundation
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
