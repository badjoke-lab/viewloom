# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.0
Last updated: 2026-07-08
Current phase: Phase 11 — hosted production monitoring closeout
Current workstream: complete Phase 11 hosted closeout and canonical synchronization after PR #473

Completed U10A implementation: PR #454
Completed U10B implementation: PR #456
Completed U10C implementation: PR #458
Completed U10D implementation: PR #462
Completed U10E implementation: PR #465
Completed U10F implementation: PR #468
Completed U10G implementation: PR #470
Completed U10H implementation: PR #471
Completed U10H canonical closeout: PR #472
Phase 11 candidate merged: PR #473

```text
Phase 10 complete through U10H
Phase 11 P11A strict-null migration complete
Phase 11 P11B CI ownership complete
Phase 11 P11C monitoring contract complete; hosted closeout required after merge
Phase 11 P11D escalation runbook complete
Phase 11 P11E maintenance cadence complete
Phase 11 P11F acceptance ownership complete
Phase 11 P11G candidate merged PR #473
Phase 11 hosted production monitoring closeout pending
Phase 12 release readiness queued
Phase 12A Analytics Capture Foundation approved and queued
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved as future major program and gated by Phase 15
```

Current Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.

## Program sequence

```text
Phase 11 hosted closeout
  -> Phase 12 release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

## Phase 12A purpose

Phase 12A begins data capture and compact aggregation for analytical facts that the existing daily rollups cannot reconstruct later.

It owns:

```text
current capacity baseline
analytics field contract
compact intraday rollup model
bounded rollup generation
provider-specific category capture foundation
production acceptance and accumulation handoff
```

It does not own analytics UI.

## Phase 13-14 relationship to analytics

Localization remains the active product program after Phase 12A. During localization:

- compact intraday evidence continues accumulating;
- category evidence continues accumulating;
- existing maintenance cadence checks storage/capacity drift;
- Phase 16 feature work remains blocked;
- no ad hoc analytics UI may bypass Phase 15.

## Phase 15 purpose

Phase 15 converts accumulated data into approved analytical thresholds and boundaries. It must produce:

```text
sample support thresholds
baseline fallback hierarchy
baseline configuration v1
anomaly rule candidate v1
observed-run gap/confidence policy
category coverage policy
relationship candidate policy
replay execution policy
storage/query budget evidence
```

## Phase 16 purpose

Phase 16 changes ViewLoom from a viewer-count visualization site into an explainable observation system.

Target progression:

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

The program does not authorize raw-retention expansion, high-frequency cron growth, all-pairs continuous computation, unsupported causal attribution, provider mixing, or constant LLM inference.

## Permanent analytics authorities

- `docs/product/analytics-observation-system-spec.md`
- `docs/product/analytics-observation-system-plan.md`
- `docs/product/next-feature-data-capability-audit.md`

The prior capability audit remains authoritative for current limitations. The new analytics program addresses those limitations by creating evidence and compact data foundations before product claims are allowed.
