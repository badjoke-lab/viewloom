# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.3
Last updated: 2026-07-08
Current phase: Phase 12 — English release readiness
Current workstream: R12B-0 evidence and configuration audit
Exact next implementation branch: `work-release-r12b-stripe-support-flow`
Next branch created: no

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness active
R12C English launch package queued
Phase 12A Analytics Capture Foundation approved and queued
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved and gated by Phase 15
```

Permanent Phase 11 closeout: `docs/operations/phase11-production-closeout-2026-07-08.md`.
Permanent R12A acceptance:

```text
docs/audits/r12a-production-acceptance.json
docs/operations/r12a-production-acceptance-2026-07-08.md
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

## Phase 12

Authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             active
R12C English launch package and release acceptance queued
```

### R12A closeout

```text
Implementation PR: #477
Implementation merge SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Production workflow run: 28941169278
Expected/deployed SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Owned HTML routes: 25
Provider status APIs: 2
Provider crossing failures: 0
Blocking alerts: 0
Watch alerts: 2
Explicit 404: pass
Result: pass
```

The five R12A policy/support routes are resolved surfaces. Historical P8B missing-surface evidence remains separately preserved.

### R12B active scope

R12B owns:

```text
repository Support/Payment Link fact audit
actual hosted Payment Link destination behavior
Support CTA wording
one-time versus recurring behavior visible to users
refund wording consistency
Commercial Disclosure consistency
mobile and desktop payment-transition flow
external-link accessibility and behavior
external Stripe registration/configuration evidence
explicit unresolved-evidence list
```

R12B evidence must separate:

```text
repository facts
hosted public behavior
external Stripe dashboard/account facts
```

Repository content alone does not prove external Stripe account state, registered website state, Payment Link dashboard configuration, or refund configuration.

### R12C

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

English remains the source language for Phase 13–14.

## Phase 12A purpose

Phase 12A begins data capture and compact aggregation for facts that existing daily rollups cannot reconstruct later.

It owns:

```text
current capacity baseline
analytics field contract
compact intraday rollup model
bounded rollup generation
provider-specific category capture foundation
production acceptance and accumulation handoff
```

R12A closeout retained these non-blocking capacity observations:

```text
Twitch 300/300 at-or-over-window
Kick 100/100 at-or-over-window
```

They are baseline inputs, not authorization to expand observed windows.

## Phase 13-14 relationship to analytics

Localization remains the active product program after Phase 12A. During localization, compact intraday/category evidence may accumulate, while Phase 16 feature work remains blocked until Phase 15.

## Phase 15 purpose

Phase 15 must produce:

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
