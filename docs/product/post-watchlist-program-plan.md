# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.4
Last updated: 2026-07-09
Current phase: Phase 12 — English release readiness
Current workstream: R12C-0 message inventory
Exact next implementation branch: `work-release-r12c0-message-inventory`
Next branch created: no

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness complete through R12B-2
R12C English launch package active at R12C-0
Phase 12A Analytics Capture Foundation approved and queued
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved and gated by Phase 15
```

## Program sequence

```text
Phase 12 English release readiness
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

## Phase 12 authorities

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C English launch package and release acceptance active
```

## R12B closeout

Permanent evidence:

```text
docs/audits/r12b-evidence-and-configuration-audit.json
docs/audits/r12b-repository-consistency-notes.md
docs/operations/r12b0-evidence-audit-2026-07-09.md
docs/operations/r12b1-support-transition-acceptance-2026-07-09.md
docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md
```

Accepted execution:

```text
R12B-0 PR #481 / merge dcdedebc1e491c3dbab95149d1a46c38b6d2aeae
R12B-1 PR #482 / merge 1bcc9590f4ca04202a8155e8d10862f91d73cc7f
R12B-2 workflow 28963522407 / artifact 8177066249 / result pass
```

R12B evidence keeps these classes separate:

```text
repository facts
hosted public behavior
historical external correspondence
current external Stripe dashboard/account facts
```

Unproven current external state remains explicitly pending and is not converted into a completion claim.

## R12C active scope

R12C owns:

```text
one-line product description
short listing description
long product description
feature-role summary
bounded-data limitations
provider separation explanation
Status/help links
Support/legal links
FAQ
launch/share asset package
final release candidate acceptance
exact production verification
```

R12C-0 begins with evidence collection rather than copy rewriting:

```text
Portal and About message inventory
feature descriptions
current limitations and coverage wording
Twitch/Kick separation wording
Status/help/support/legal links
existing FAQ-like explanations
current screenshots and share assets
missing launch explanations/assets
approved terminology candidates
```

English remains the source language for Phase 13–14.

## Phase 12A purpose

Phase 12A begins data capture and compact aggregation for facts that existing daily rollups cannot reconstruct later. It starts only after R12C-3 closes Phase 12.

```text
current capacity baseline
analytics field contract
compact intraday rollup model
bounded rollup generation
provider-specific category capture foundation
production acceptance and accumulation handoff
```

Capacity observations carried forward:

```text
Twitch 300/300 at-or-over-window
Kick 100/100 at-or-over-window
```

They are baseline inputs, not authorization to expand observed windows.

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
