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
Phase 11 P11C monitoring contract      complete
Phase 11 P11D escalation runbook       complete
Phase 11 P11E maintenance cadence      complete
Phase 11 P11F acceptance ownership     complete
Phase 11 P11G candidate                merged PR #473
Phase 11 production closeout           complete
Phase 12 English release readiness     active
Current workstream                     R12A-5 candidate and hosted acceptance
Active implementation branch           work-release-r12a-legal-support
Candidate public HTML routes           25
Candidate browser scenarios            100
Hosted production acceptance           pending merge
```

Permanent Phase 11 evidence includes:

```text
docs/audits/phase11-strict-null-baseline.json
docs/audits/phase11-ci-ownership-baseline.json
docs/audits/phase11-ci-overlap-classification.json
docs/audits/phase11-monitoring-contract.json
docs/audits/phase11-public-acceptance-ownership.json
docs/operations/phase11-monitoring-and-escalation.md
docs/operations/phase11-maintenance-cadence.md
docs/operations/phase11-production-closeout-2026-07-08.md
```

## Active Phase 12

Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
docs/audits/phase12-r12a-legal-support-baseline.json
```

Sequence:

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

R12A candidate currently contains Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, provider-neutral About/Support runtime ownership, shared legal/support footer navigation, 25-route build/readiness/production ownership, and a 100-scenario current browser matrix across 1440, 820, 390, and 360px. The five policy surfaces remain candidate until exact post-merge production acceptance passes.

R12B verifies the actual support/Stripe/refund/disclosure flow with explicit external evidence. R12C completes the English launch package, FAQ, limitations, links, assets, and final release acceptance.

## Approved forward sequence

```text
Phase 12 English release readiness
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

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop. Phase 12A and later analytics work must not bypass their approved entry gates.
