# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-09

```text
Phase 8 P8B complete PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete PR #451
P9H7 canonical closeout complete PR #453
Phase 10 U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12A implementation PR: #477
R12A production acceptance: pass
R12B-0 evidence and configuration audit complete PR #481
R12B-1 Support page and payment transition acceptance complete PR #482
R12B-2 refund/disclosure consistency acceptance complete PR #483
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete
Current workstream: R12C-2 launch/share asset package
Exact next implementation branch: work-release-r12c2-launch-assets
Next branch created: no
```

## Active Phase 12 authorities

- Specification: `release-readiness-spec.md`
- Implementation plan: `release-readiness-plan.md`
- Active working record: `../work-in-progress/phase12-release-readiness.md`
- R12A production evidence: `../audits/r12a-production-acceptance.json`
- R12B-0 audit: `../audits/r12b-evidence-and-configuration-audit.json`
- R12B-1 acceptance: `../operations/r12b1-support-transition-acceptance-2026-07-09.md`
- R12B-2 acceptance: `../operations/r12b2-refund-disclosure-acceptance-2026-07-09.md`
- R12C-0 inventory: `../audits/r12c0-message-inventory.json`
- R12C-1 English source package: `english-launch-copy.md`
- R12C-1 structured package: `../audits/r12c1-launch-copy-package.json`
- R12C-1 acceptance: `../operations/r12c1-launch-copy-acceptance-2026-07-09.md`

Phase 12 sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  active
R12C-3 release candidate acceptance                queued
```

## R12C-2 boundary

R12C-2 owns a curated launch/share asset package: current desktop and mobile product screenshots, representative feature screenshots, an asset manifest recording source route, viewport, capture date, and intended use, plus captions that remain within the R12C-1 evidence boundaries.

CI browser screenshots may be used as capture evidence, but they are not automatically approved launch assets. The generic `apps/web/public/og/viewloom.svg` remains an identity card rather than a representative product screenshot.

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

Phase 12A remains blocked until R12C-3 and the full Phase 12 release acceptance close. Phase 16 implementation remains gated by Phase 15 evidence, calibration, storage cost, and query-cost acceptance.
