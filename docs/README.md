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
Phase 11 P11C monitoring contract                complete; hosted closeout required after merge
Phase 11 P11D escalation runbook                 complete
Phase 11 P11E maintenance cadence                complete
Phase 11 P11F acceptance ownership               complete
Phase 11 P11G candidate                          merged PR #473
Phase 11 hosted production monitoring closeout   pending
Current workstream                               Phase 11 hosted closeout and canonical synchronization
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- Phase 11 record: `work-in-progress/phase11-acceptance-operations.md`
- P11A strict-null evidence: `audits/phase11-strict-null-baseline.json`
- P11B CI ownership evidence: `audits/phase11-ci-ownership-baseline.json`
- P11B overlap classification: `audits/phase11-ci-overlap-classification.json`
- P11C monitoring contract: `audits/phase11-monitoring-contract.json`
- P11D runbook: `operations/phase11-monitoring-and-escalation.md`
- P11E cadence: `operations/phase11-maintenance-cadence.md`
- P11F ownership evidence: `audits/phase11-public-acceptance-ownership.json`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Approved analytics program authorities

- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior next-feature capability audit: `product/next-feature-data-capability-audit.md`

Approved forward order:

```text
Phase 11 hosted closeout
  -> Phase 12 release readiness
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

The immediate repository priority remains Phase 11 hosted production monitoring closeout. Future analytics work must follow the new specification and plan instead of ad hoc feature additions.
