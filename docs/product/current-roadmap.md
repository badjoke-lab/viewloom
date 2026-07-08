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
Phase 11 P11A strict-null migration complete
Phase 11 P11B CI ownership complete
Phase 11 P11C monitoring contract complete; hosted closeout after merge
Phase 11 P11D escalation runbook complete
Phase 11 P11E maintenance cadence complete
Phase 11 P11F acceptance ownership complete
Phase 11 P11G candidate merged PR #473
Phase 11 hosted production monitoring closeout pending
Current execution boundary: finish Phase 11 hosted closeout before Phase 12
```

Current Phase 11 record: `../work-in-progress/phase11-acceptance-operations.md`.

## Approved forward sequence

```text
Phase 11 hosted production monitoring closeout
Phase 12 release readiness
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

Phase 12A is an evidence-capture and compact-rollup foundation, not an analytics UI launch. Phase 13-14 may proceed after Phase 12A while forward-only intraday/category evidence accumulates. Phase 16 is approved as the future major program but remains implementation-gated by Phase 15 evidence, calibration, storage cost, and query-cost acceptance.
