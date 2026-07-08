# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-08

```text
Phase 8 complete PR #428
Phase 9 complete
U10A complete PR #454
U10B complete PR #456
U10C complete PR #458
U10D complete PR #462
U10E complete PR #465
U10F complete PR #468
U10G complete PR #470
U10H production acceptance complete PR #471
U10H canonical closeout complete PR #472
Phase 11 P11A strict-null migration complete
Phase 11 P11B CI ownership complete
Phase 11 P11C monitoring contract complete
Phase 11 P11D escalation runbook complete
Phase 11 P11E maintenance cadence complete
Phase 11 P11F acceptance ownership complete
Phase 11 P11G candidate merged PR #473
Phase 11 production closeout complete
Phase 12 English release readiness active
Current workstream: R12A-5 candidate and hosted acceptance
Active implementation branch: work-release-r12a-legal-support
Branch created: yes
Hosted production acceptance: pending merge
```

## Phase 11 closeout evidence

```text
Hosted workflow run: 28932232525
Artifact id: 8163904094
Artifact digest: sha256:29469a860baa8da27d9155fd5fd79a162fa39467e58bc5ee2b2b4c143f8349be
Expected/deployed main SHA: 90fb2714137cc83e6f20e44415574a5e35a98439
Repository-owned HTML routes checked: 20
Provider status APIs checked: 2
Provider crossing failures: 0
Blocking monitoring alerts: 0
Twitch capacity watch: at-or-over-window 300/300
Kick capacity watch: at-or-over-window 100/100
Result: pass
```

Permanent record: `../operations/phase11-production-closeout-2026-07-08.md`.

## Active Phase 12 execution order

```text
R12A-0 current legal/support surface audit                 complete
R12A-1 shared legal/support page foundation                complete
R12A-2 Contact, Terms, Privacy                             complete
R12A-3 Refund Policy and Commercial Disclosure             complete
R12A-4 About/footer and route ownership integration        complete
R12A-5 R12A candidate and hosted acceptance                active
R12B-0 evidence and configuration audit                    queued
R12B-1 Support page and payment transition                 queued
R12B-2 refund/disclosure consistency acceptance            queued
R12C-0 message inventory                                   queued
R12C-1 launch copy and FAQ                                 queued
R12C-2 launch/share asset package                          queued
R12C-3 release candidate acceptance                        queued
```

## R12A candidate acceptance matrix

```text
Candidate Vite HTML inputs: 25
Explicit not-found pages: 1
Candidate inventory entries: 26
Indexable routes: 21
Noindex routes: 4
Sitemap routes: 21
Public Readiness routes: 25
Production Smoke routes after merge: 25
Current candidate browser matrix: 25 routes x 4 widths = 100 scenarios
Historical P8B evidence: 21 routes / 84 production scenarios / 5 missing probes / 10 History scenarios
```

Required before merge:

```text
Development policy latest-head pass
R12A legal/support contract gate pass
Public Surface Inventory pass
Public Readiness pass
Current Browser matrix 100/100 pass
Typecheck and build pass
```

Required after merge:

```text
Production deployment SHA matches merged main SHA
25 repository-owned HTML routes return 200
Twitch/Kick status and provider separation remain healthy
monitoring evidence has no blocking alerts
explicit 404 behavior remains correct
five candidate surfaces move to resolved only after this hosted evidence passes
```

Phase 12 authority:

- `release-readiness-spec.md`
- `release-readiness-plan.md`
- `../work-in-progress/phase12-release-readiness.md`

External Stripe dashboard/account state must not be claimed from repository content alone. R12B requires explicit external evidence.

## Forward execution order after Phase 12

```text
1. Phase 12A Analytics Capture Foundation
2. Phase 13 localization
3. Phase 14 localization completion and acceptance
4. Phase 15 Analytics Capability and Calibration Audit
5. Phase 16A Baseline Engine
6. Phase 16B Anomaly Detection
7. Phase 16C Observed Run Intelligence
8. Phase 16D Category-relative Analysis
9. Phase 16E Co-movement and Relationship Analysis
10. Phase 16F Replay and Backtest
```

## Phase 12A schedule boundary

Phase 12A starts only after Phase 12 closes. It must complete:

```text
12A-0 current data and capacity baseline
12A-1 analytics field contract
12A-2 compact intraday rollup design and migration
12A-3 bounded intraday rollup generation
12A-4 provider-specific category capture foundation
12A-5 production acceptance and accumulation handoff
```

Phase 12A does not launch analytics UI. Its purpose is to begin forward-only evidence accumulation that cannot be reconstructed from existing 180-day daily rollups.

## Phase 15 schedule boundary

Phase 15 is mandatory before Phase 16 implementation. It must accept or reject:

```text
sample support thresholds
baseline fallback thresholds
7d / 30d / 90d availability by provider
anomaly rule candidate v1
observed-run gap and confidence policy
category coverage policy
relationship candidate restriction policy
replay execution policy
storage and query budgets
```

## Governing analytics documents

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`

Do not create Phase 12A or Phase 16 branches before their entry gates close. Do not bypass Phase 12A capture work with request-time long-window raw scans or unsupported session/category claims.
