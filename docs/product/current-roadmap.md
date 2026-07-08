# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-08

```text
Phase 8 P8B complete PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete PR #451
P9H7 canonical closeout complete PR #453
Phase 10 U10A complete PR #454
U10A canonical closeout complete PR #455
Phase 10 U10B shared shell complete PR #456
U10B canonical closeout complete PR #457
Phase 10 U10C visualization complete PR #458
U10C canonical closeout complete PR #459
Phase 10 U10D analysis coherence complete PR #462
U10D canonical closeout complete PR #464
Phase 10 U10E responsive and accessibility complete PR #465
U10E canonical closeout complete PR #466
Phase 10 U10F readiness complete PR #468
U10F canonical closeout complete PR #469
Phase 10 U10G architecture complete PR #470
Phase 10 U10H production acceptance complete PR #471
U10H canonical closeout complete PR #472
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12A implementation PR: #477
R12A implementation merge SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
R12A production acceptance: pass
Current workstream: R12B-0 evidence and configuration audit
Exact next implementation branch: work-release-r12b-stripe-support-flow
Next branch created: no
```

## Active Phase 12 authorities

- Specification: `release-readiness-spec.md`
- Implementation plan: `release-readiness-plan.md`
- Active working record: `../work-in-progress/phase12-release-readiness.md`
- R12A baseline audit: `../audits/phase12-r12a-legal-support-baseline.json`
- R12A production evidence: `../audits/r12a-production-acceptance.json`
- R12A production record: `../operations/r12a-production-acceptance-2026-07-08.md`

Phase 12 sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             active
R12C English launch package and release acceptance queued
```

R12B begins with evidence separation. Repository facts, hosted public behavior, and external Stripe dashboard/account facts must be recorded as separate evidence classes. Repository code alone must not be used to claim external Stripe registration, account state, Payment Link dashboard configuration, or refund configuration.

## Approved forward sequence

```text
Phase 12 English release readiness
Phase 12A Analytics Capture Foundation
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16 Analytics Observation System program
  Phase 16A Baseline Engine
  Phase 16B Anomaly Detection
  Phase 16C Observed Run Intelligence
  Phase 16D Category-relative Analysis
  Phase 16E Co-movement and Relationship Analysis
  Phase 16F Replay and Backtest
```

## Analytics program authority

- Specification: `analytics-observation-system-spec.md`
- Implementation plan: `analytics-observation-system-plan.md`
- Prior capability boundary: `next-feature-data-capability-audit.md`

Phase 12A is an evidence-capture and compact-rollup foundation, not an analytics UI launch. Phase 13-14 may proceed after Phase 12A while forward-only intraday/category evidence accumulates. Phase 16 implementation remains gated by Phase 15 evidence, calibration, storage cost, and query-cost acceptance.
