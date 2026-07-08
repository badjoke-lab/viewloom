# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.2
Last updated: 2026-07-08
Current phase: Phase 12 — English release readiness
Current workstream: R12A-5 candidate and hosted acceptance
Active implementation branch: `work-release-r12a-legal-support`
Branch created: yes

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
Analytics roadmap synchronized: PR #475
Phase 11 hosted production closeout: complete

```text
Phase 10 complete through U10H
Phase 11 P11A strict-null migration complete
Phase 11 P11B CI ownership complete
Phase 11 P11C monitoring contract complete
Phase 11 P11D escalation runbook complete
Phase 11 P11E maintenance cadence complete
Phase 11 P11F acceptance ownership complete
Phase 11 P11G candidate merged PR #473
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A-0 through R12A-4 complete on candidate branch
R12A-5 candidate and hosted acceptance active
Phase 12A Analytics Capture Foundation approved and queued
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved as future major program and gated by Phase 15
```

Permanent Phase 11 closeout: `docs/operations/phase11-production-closeout-2026-07-08.md`.

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

## Phase 12 — English release readiness

Authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Sequence:

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

### R12A current state

```text
R12A-0 current legal/support surface audit                 complete
R12A-1 shared legal/support page foundation                complete
R12A-2 Contact, Terms, Privacy                             complete
R12A-3 Refund Policy and Commercial Disclosure             complete
R12A-4 About/footer and route ownership integration        complete
R12A-5 candidate and hosted acceptance                     active
```

R12A candidate ownership:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
About and Support provider-neutral static entry
shared footer legal/support navigation
25 Vite HTML inputs
26 inventory entries including explicit 404
21 indexable/sitemap routes
25 Public Readiness routes
25 Production Smoke routes
100 current candidate browser scenarios at 1440/820/390/360
```

Historical P8B evidence remains locked separately at 21 routes, 84 production scenarios, 5 missing-surface probes, and 10 History scenarios. The five policy pages are candidate surfaces until exact post-merge production acceptance passes.

### R12B

R12B owns:

```text
Support CTA wording
actual Payment Link destination audit
external Stripe registration evidence
refund wording consistency
Commercial Disclosure consistency
mobile and desktop support/payment transition flow
external-link accessibility and behavior
```

Repository content alone does not prove external Stripe account/dashboard state. Any completion claim about registered website, Payment Link configuration, or refund configuration requires recorded authoritative/operator evidence.

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

English is the source language for Phase 13–14. Phase 12 does not add localization runtime.

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

It does not own analytics UI. Phase 11 closeout observed both Twitch 300/300 and Kick 100/100 at `at-or-over-window`; those non-blocking capacity observations are explicit Phase 12A baseline inputs, not authorization to expand limits.

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

The prior capability audit remains authoritative for current limitations. The analytics program addresses those limitations by creating evidence and compact data foundations before product claims are allowed.
