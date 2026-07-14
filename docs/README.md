# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-14

Read the development policy, documentation governance, this index, roadmap, schedule, program plan, affected specifications, implementation plans, and accepted evidence before changing the repository.

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and production accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 category migration and disabled runtime implemented PR #516
12A-4 disabled-runtime production boundary accepted PR #517 / frozen PR #518
12A-4 read-only production preflight accepted and frozen PR #523
Production intraday generation started yes
Current workstream 12A-4 controlled category schema apply design
Category capture runtime not started
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
- 12A-3 storage evidence: `audits/12a3-account-storage-evidence.json`
- 12A-3 execution-cost evidence: `audits/12a3-execution-cost-evidence.json`
- 12A-3 generator evidence: `audits/12a3-generator-enablement-evidence.json`
- 12A-3 post-merge evidence: `audits/12a3-postmerge-acceptance-evidence.json`
- 12A-4 category source contract: `audits/12a4-category-source-audit-contract.json`
- 12A-4 category source evidence: `audits/12a4-category-source-audit-evidence.json`
- 12A-4 category storage contract: `audits/12a4-category-storage-design-contract.json`
- 12A-4 category storage evidence: `audits/12a4-category-storage-budget-evidence.json`
- 12A-4 category migration/runtime contract: `audits/12a4-category-migration-runtime-contract.json`
- 12A-4 disabled-runtime evidence: `audits/12a4-disabled-runtime-postmerge-evidence.json`
- 12A-4 execution-cost umbrella contract: `audits/12a4-category-execution-cost-probe-contract.json`
- 12A-4 read-only preflight evidence: `audits/12a4-category-readonly-preflight-evidence.json`
- 12A-4 controlled schema apply contract: `audits/12a4-category-controlled-schema-apply-contract.json`
- Current gate state: `audits/12a2-current-gate-state.json`
- 12A-4 source acceptance: `operations/12a4-category-source-audit-2026-07-12.md`
- 12A-4 storage acceptance: `operations/12a4-category-storage-design-acceptance-2026-07-14.md`
- Accepted preflight history: `work-in-progress/phase12a4-category-readonly-preflight-acceptance.md`
- Current WIP: `work-in-progress/phase12a4-category-controlled-schema-apply.md`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12A

```text
12A-0 current data and capacity baseline                    complete PR #490
12A-1 analytics field contract                              complete PR #492
12A-2 design/migration/deploy/remote schema                  accepted through PR #506
12A-3 storage/execution/generator/accumulation               complete through PR #511
12A-4-0 provider-specific category source audit             accepted PR #513
12A-4-1 category storage design and budget gate             accepted PR #514
12A-4-2 category migration and disabled runtime             accepted through PR #518
12A-4-3 read-only production preflight                      accepted PR #523
12A-4-4 controlled provider schema apply design             current
12A-4-5 bounded provider execution-cost probe               queued
12A-4-6 provider-separated capture acceptance               queued
12A-5 foundation acceptance and accumulation handoff        queued
```

## Accepted category source and storage boundary

```text
Twitch source: Helix /streams
Twitch fields: game_id / game_name
Kick source: public/v1/livestreams
Kick fields: category.id / category.name
source audit pass: true
storage design pass: true
selected model: embedded_hourly
category contract: category-source-v1
repository migration candidate implemented: true
disabled runtime production acceptance: true
read-only production preflight acceptance: true
production category schema present: false
remote migration apply authorized: false
bounded production cost probe authorized: false
runtime capture authorized: false
```

```text
Twitch projected total/headroom: 438.70 / 11.30 MB
Kick projected total/headroom: 314.57 / 135.43 MB
Account projected total/headroom: 3716.59 / 891.41 MB
```

## Current boundary

```text
intraday generation enabled and accumulating
repository category migration candidate implemented
disabled category runtime deployed and accepted
read-only category preflight accepted
controlled category schema apply design current
production category schema absent
remote category migration not authorized
category runtime capture disabled
raw retention unchanged
new cron not authorized
backfill not authorized
cross-provider category identity forbidden
combined-provider category ranking forbidden
```

## Forward order

```text
12A-4 controlled provider-separated category schema apply
  -> bounded provider-separated category execution-cost probe
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```
