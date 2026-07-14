# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan  
Version: 10.0  
Last updated: 2026-07-14  
Current phase: Phase 12A — Analytics Capture Foundation  
Current workstream: 12A-4 production category execution-cost probe  
Production intraday generation started: yes  
Category runtime capture started: no

```text
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and production accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design and budget accepted PR #514
12A-4 category migration and disabled runtime accepted through PR #518
12A-4 production execution-cost probe current
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-4 production execution-cost probe and remote migration decision
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

## Active authorities

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a3-generator-enablement-evidence.json
docs/audits/12a3-postmerge-acceptance-evidence.json
docs/audits/12a4-category-source-audit-contract.json
docs/audits/12a4-category-source-audit-evidence.json
docs/audits/12a4-category-storage-design-contract.json
docs/audits/12a4-category-storage-budget-evidence.json
docs/audits/12a4-category-migration-runtime-contract.json
docs/audits/12a4-disabled-runtime-postmerge-evidence.json
docs/audits/12a4-category-execution-cost-probe-contract.json
docs/audits/12a2-current-gate-state.json
```

## 12A-4-3 production execution-cost gate

Required work:

```text
provider-separated read-only preflight
controlled remote migration decision
pre/post schema and database-size evidence
CATEGORY_CAPTURE_ENABLED remains absent during schema apply
separate Twitch and Kick D1 cost measurements
rows read/written, changes, SQL duration, Worker duration
collector latency delta
dictionary unchanged-name no-op measurement
category-aware generator remains within 12 queries
failure-containment proof
cleanup and temporary Worker deletion
explicit thresholds and stop conditions
```

Planning PR boundary:

```text
no production deployment
no remote migration
no category enablement
no production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no combined-provider category identity or ranking
```

## 12A-4 completion boundary

12A-4 closes only after provider-specific capture is real, coverage is measurable,
storage and production query cost are accepted, production evidence exists, and no
combined-provider category ranking exists.

## 12A-5 foundation acceptance

Run provider-separated acceptance, verify retention and rollup behavior, freeze
schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15.
