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
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12A implementation PR: #477
R12A production acceptance: pass
Current workstream: R12B-0 evidence and configuration audit
Exact next implementation branch: work-release-r12b-stripe-support-flow
Next branch created: no
```

## R12A production acceptance

```text
Implementation merge SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Production workflow run: 28941169278
Expected/deployed SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Repository-owned HTML routes: 25
Provider status APIs: 2
Provider crossing failures: 0
Blocking monitoring alerts: 0
Watch alerts: 2
Explicit 404: pass
Result: pass
```

Permanent evidence:

- `../audits/r12a-production-acceptance.json`
- `../operations/r12a-production-acceptance-2026-07-08.md`

## Active Phase 12 execution order

```text
R12A-0 current legal/support surface audit                 complete
R12A-1 shared legal/support page foundation                complete
R12A-2 Contact, Terms, Privacy                             complete
R12A-3 Refund Policy and Commercial Disclosure             complete
R12A-4 About/footer and route ownership integration        complete
R12A-5 candidate and hosted acceptance                     complete
R12B-0 evidence and configuration audit                    active
R12B-1 Support page and payment transition                 queued
R12B-2 refund/disclosure consistency acceptance            queued
R12C-0 message inventory                                   queued
R12C-1 launch copy and FAQ                                 queued
R12C-2 launch/share asset package                          queued
R12C-3 release candidate acceptance                        queued
```

## R12B-0 execution boundary

Audit separately:

```text
repository facts
hosted public behavior
external Stripe dashboard/account facts
```

Required R12B-0 checks:

```text
actual public Payment Link destination
Support CTA wording consistency
one-time versus recurring behavior visible to users
Refund Policy consistency
Commercial Disclosure consistency
desktop external transition flow
mobile external transition flow
registered business website/domain evidence
external configuration evidence source and date
explicit list of unresolved external evidence
```

Repository content alone must not be used to claim Stripe registered website state, account approval/state, Payment Link dashboard settings, or refund configuration.

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

The R12A closeout carried forward these non-blocking capacity observations:

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

They are Phase 12A baseline inputs, not authorization to expand limits.

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
