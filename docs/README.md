# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-08

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12A implementation PR #477 merged
R12A production acceptance pass
Current workstream R12B-0 evidence and configuration audit
Exact next implementation branch work-release-r12b-stripe-support-flow
Next branch created no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 12 specification: `product/release-readiness-spec.md`
- Phase 12 implementation plan: `product/release-readiness-plan.md`
- Active Phase 12 record: `work-in-progress/phase12-release-readiness.md`
- R12A baseline audit: `audits/phase12-r12a-legal-support-baseline.json`
- R12A production evidence: `audits/r12a-production-acceptance.json`
- R12A production record: `operations/r12a-production-acceptance-2026-07-08.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- P11A strict-null evidence: `audits/phase11-strict-null-baseline.json`
- P11B CI ownership evidence: `audits/phase11-ci-ownership-baseline.json`
- P11B overlap classification: `audits/phase11-ci-overlap-classification.json`
- P11C monitoring contract and hosted evidence: `audits/phase11-monitoring-contract.json`
- P11D runbook: `operations/phase11-monitoring-and-escalation.md`
- P11E cadence: `operations/phase11-maintenance-cadence.md`
- P11F historical ownership evidence: `audits/phase11-public-acceptance-ownership.json`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Active Phase 12 sequence

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             active
R12C English launch package and release acceptance queued
```

R12A exact production acceptance verified 25 owned HTML routes, both provider status contracts, provider separation, monitoring evidence with zero blocking alerts, and explicit 404 behavior against merged main SHA `952f0008209363f4fd5b22587975ac247ee8d6f2`.

The five R12A routes are resolved:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

R12B begins with evidence separation between repository facts, hosted public behavior, and external Stripe dashboard/account facts. External Stripe state must not be inferred from repository files alone.

## Approved analytics program authorities

- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior next-feature capability audit: `product/next-feature-data-capability-audit.md`

Approved forward order:

```text
Phase 12 English release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

The immediate repository priority is R12B-0 evidence and configuration audit. The exact next implementation branch is `work-release-r12b-stripe-support-flow`, which must not be created before the R12A closeout PR merges and that merge is verified.
