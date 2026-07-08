# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-08

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 10 U10F readiness                          complete PR #468
U10F canonical closeout                          complete PR #469
Phase 10 U10G architecture                       complete PR #470
Phase 10 U10H production acceptance              complete PR #471
U10H canonical closeout                          complete PR #472
Phase 11 P11A strict-null migration              complete
Phase 11 P11B CI ownership                       complete
Phase 11 P11C monitoring contract                complete
Phase 11 P11D escalation runbook                 complete
Phase 11 P11E maintenance cadence                complete
Phase 11 P11F acceptance ownership               complete
Phase 11 P11G candidate                          merged PR #473
Phase 11 production closeout                     complete
Phase 12 English release readiness               active
Current workstream                               R12A-0 current legal/support surface audit
Exact next implementation branch                 work-release-r12a-legal-support
Next branch created                              no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 12 specification: `product/release-readiness-spec.md`
- Phase 12 implementation plan: `product/release-readiness-plan.md`
- Active Phase 12 record: `work-in-progress/phase12-release-readiness.md`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- P11A strict-null evidence: `audits/phase11-strict-null-baseline.json`
- P11B CI ownership evidence: `audits/phase11-ci-ownership-baseline.json`
- P11B overlap classification: `audits/phase11-ci-overlap-classification.json`
- P11C monitoring contract and hosted evidence: `audits/phase11-monitoring-contract.json`
- P11D runbook: `operations/phase11-monitoring-and-escalation.md`
- P11E cadence: `operations/phase11-maintenance-cadence.md`
- P11F ownership evidence: `audits/phase11-public-acceptance-ownership.json`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Active Phase 12 sequence

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

R12A starts with an audit of current About, Support, footer, build inputs, public inventory, readiness, smoke ownership, sitemap, metadata, and browser ownership. Do not pre-edit route counts before implementation is measured. External Stripe dashboard/account state requires explicit evidence in R12B.

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

Phase 12A begins capture and compact rollup work only after Phase 12 closes. Phase 16 implementation is gated by Phase 15 calibration and capacity acceptance.

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

The immediate repository priority is Phase 12 R12A-0 audit followed by the exact next implementation branch `work-release-r12a-legal-support`. Future analytics work must follow its approved capture, calibration, and phase-entry gates rather than ad hoc feature additions.
