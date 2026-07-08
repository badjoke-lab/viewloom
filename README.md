# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, storage, rankings, exports, baselines, relationships, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry and repeated temporal relationships
- History = Trends and retained analytical evidence
- Channel = one retained channel footprint and future personal baseline/run interpretation
- Local Watchlist = browser-local saved evidence

## Current state

```text
Local Watchlist v1                     complete PR #425
Phase 8 inventory/browser audit        complete PR #428
Phase 9 History P1 repair              complete
P9H7 production acceptance             complete PR #451
P9H7 canonical closeout                complete PR #453
Phase 10 U10A quality baseline         complete PR #454
U10A canonical closeout                complete PR #455
Phase 10 U10B shared shell             complete PR #456
U10B canonical closeout                complete PR #457
Phase 10 U10C visualization            complete PR #458
U10C canonical closeout                complete PR #459
Phase 10 U10D analysis coherence       complete PR #462
U10D canonical closeout                complete PR #464
Phase 10 U10E responsive repair        complete PR #465
U10E canonical closeout                complete PR #466
Phase 10 U10F readiness                complete PR #468
U10F canonical closeout                complete PR #469
Phase 10 U10G architecture             complete PR #470
Phase 10 U10H production acceptance    complete PR #471
U10H canonical closeout                complete PR #472
Phase 11 P11A strict-null migration    complete
Phase 11 P11B CI ownership             complete
Phase 11 P11C monitoring contract      complete; hosted closeout required after merge
Phase 11 P11D escalation runbook       complete
Phase 11 P11E maintenance cadence      complete
Phase 11 P11F acceptance ownership     complete
Phase 11 P11G candidate                merged PR #473
Phase 11 hosted production closeout    pending
Current workstream                     Phase 11 hosted closeout and canonical synchronization
```

Permanent Phase 11 evidence:

```text
docs/audits/phase11-strict-null-baseline.json
docs/audits/phase11-ci-ownership-baseline.json
docs/audits/phase11-ci-overlap-classification.json
docs/audits/phase11-monitoring-contract.json
docs/audits/phase11-public-acceptance-ownership.json
docs/operations/phase11-monitoring-and-escalation.md
docs/operations/phase11-maintenance-cadence.md
```

Phase 11 working/closeout record: `docs/work-in-progress/phase11-acceptance-operations.md`.

## Approved forward sequence

```text
Phase 11 hosted closeout
Phase 12 release readiness
Phase 12A Analytics Capture Foundation
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16A Baseline Engine
Phase 16B Anomaly Detection
Phase 16C Observed Run Intelligence
Phase 16D Category-relative Analysis
Phase 16E Co-movement and Relationship Analysis
Phase 16F Replay and Backtest
```

The analytics target is:

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

Permanent analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop. Future analytics work must follow the approved capture, calibration, and phase-entry gates rather than ad hoc feature additions.
