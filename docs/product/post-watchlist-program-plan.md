# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.9
Last updated: 2026-07-09
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: `work-analytics-12a0-current-data-capacity-baseline`
Next branch created: no

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A complete
R12B complete through R12B-2
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved and gated by Phase 15
```

## Program sequence

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

## Phase 12 permanent closeout

Phase 12 is complete.

```text
main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Production Smoke run: 28993206779
Production Smoke artifact: 8188712759
Independent closeout probe run: 28993547481
Result: pass
```

Permanent records:

```text
docs/audits/phase12-release-acceptance.json
docs/operations/phase12-release-acceptance-2026-07-09.md
docs/audits/r12c3-candidate-acceptance.json
docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

Retained launch packages:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
apps/web/public/launch-assets/
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
```

## Phase 12A purpose

Phase 12A begins capture and compact aggregation for facts that existing daily rollups cannot reconstruct later. The program order is:

```text
12A-0 current data and capacity baseline
12A-1 analytics field contract
12A-2 compact intraday rollup design and migration
12A-3 bounded intraday rollup generation
12A-4 provider-specific category capture foundation
12A-5 production acceptance and accumulation handoff
```

### 12A-0 current scope

12A-0 is evidence-only baseline work. It records:

```text
current D1 and table footprint
current raw and rollup retention
row counts and observed growth evidence
current query paths and known expensive paths
5-minute cadence ownership
scheduled work ownership
current Twitch/Kick capacity state
provider-specific category availability
free-tier and operational constraints
```

No migration or runtime behavior change is allowed in 12A-0.

Capacity observations carried forward:

```text
Twitch 300/300 at-or-over-window
Kick   100/100 at-or-over-window
```

They are baseline inputs, not authorization to expand observed windows, extend raw retention, combine providers, or strengthen coverage claims.

### Phase 12A completion intent

Phase 12A should leave compact analytics evidence accumulating while Phase 13–14 localization proceeds. Phase 16 feature work remains blocked until Phase 15 evaluates evidence quantity, baseline support, anomaly calibration, category coverage, relationship candidates, replay feasibility, storage cost, and query cost.

## Phase 13-14 relationship to analytics

Localization remains the active product program after Phase 12A. During localization, compact intraday/category evidence may accumulate, while Phase 16 feature work remains blocked until Phase 15.

## Phase 15 purpose

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

Permanent analytics authorities:

- `docs/product/analytics-observation-system-spec.md`
- `docs/product/analytics-observation-system-plan.md`
- `docs/product/next-feature-data-capability-audit.md`
