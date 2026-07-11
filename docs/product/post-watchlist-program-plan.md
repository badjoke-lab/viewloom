# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.3
Last updated: 2026-07-11
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-2 empty schema migration
Schema migration authorized: yes
Schema migration started: no
Exact next branch: `work-analytics-12a2-migration`
12A-3 generation authorized: no
Generation blocker: `account_aggregate_storage_unmeasured`

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 binding size source merged PR #497
12A-2 production provider-size evidence accepted PR #498
12A-2 empty schema migration current
12A-3 generation blocked
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-2 empty schema migration
  -> migration acceptance
  -> 12A-3 generation gate and bounded generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

## Active Phase 12A authorities

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/analytics-field-contract-v1.md
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
```

## Accepted 12A-2 provider size evidence

```text
Twitch current size 320.96 MB
Twitch projected with safe rollup 391.95 MB
Twitch provider migration gate true

Kick current size 264.38 MB
Kick projected with safe rollup 287.95 MB
Kick provider migration gate true

schemaMigrationGatePass true
```

The evidence was observed through the existing production provider bindings using `D1Result.meta.size_after`. The audit query wrote zero rows.

## Current 12A-2 migration scope

The next branch is:

```text
work-analytics-12a2-migration
```

It may add only:

```text
streamer_intraday_rollups table
idx_intraday_streamer_day index
intraday_rollup_status table
migration verification
migration acceptance evidence
```

It must not add:

```text
backfill
runtime rollup generation
raw-retention extension
new high-frequency cron
category capture
exact-session fields or claims
cross-provider analytics
```

## 12A-3 generation gate

Schema migration permission is not generation permission.

```text
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
blocker account_aggregate_storage_unmeasured
```

12A-3 remains blocked until storage and execution evidence is accepted. The empty schema migration must not begin data accumulation.

## Later phases

12A-4 remains a provider-specific category foundation with source verification. 12A-5 closes the foundation and hands off to localization while evidence accumulates. Phase 15 calibrates support thresholds, baselines, anomaly rules, observed-run policies, category coverage, relationship candidates, replay policy, and storage/query budgets. Phase 16 remains gated by Phase 15.

Twitch and Kick remain provider-separated throughout the program.
