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
12A-4 migration and disabled runtime implemented PR #516
12A-4 disabled-runtime production boundary accepted PR #517 / frozen PR #518
Production intraday generation started yes
Current workstream 12A-4 production category execution-cost probe
Category capture runtime not started
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics specification: `product/analytics-observation-system-spec.md`
- Analytics implementation plan: `product/analytics-observation-system-plan.md`
- Current gate state: `audits/12a2-current-gate-state.json`
- Category source contract/evidence: `audits/12a4-category-source-audit-contract.json`, `audits/12a4-category-source-audit-evidence.json`
- Category storage contract/evidence: `audits/12a4-category-storage-design-contract.json`, `audits/12a4-category-storage-budget-evidence.json`
- Category migration/runtime contract: `audits/12a4-category-migration-runtime-contract.json`
- Disabled-runtime post-merge evidence: `audits/12a4-disabled-runtime-postmerge-evidence.json`
- Current execution-cost contract: `audits/12a4-category-execution-cost-probe-contract.json`
- Current WIP: `work-in-progress/phase12a4-category-execution-cost-probe.md`

## Active Phase 12A

```text
12A-0 current data and capacity baseline                    complete PR #490
12A-1 analytics field contract                              complete PR #492
12A-2 design/migration/deploy/remote schema                  accepted through PR #506
12A-3 storage/execution/generator/accumulation               complete through PR #511
12A-4-0 provider-specific category source audit             accepted PR #513
12A-4-1 category storage design and budget gate             accepted PR #514
12A-4-2 category migration and disabled runtime             accepted through PR #518
12A-4-3 production cost, remote apply, capture acceptance   current
12A-5 foundation acceptance and accumulation handoff        queued
```

## Current boundary

```text
intraday generation enabled and accumulating
repository category migration candidate implemented
disabled category runtime deployed and accepted
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
12A-4 production execution-cost probe and remote migration decision
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```
