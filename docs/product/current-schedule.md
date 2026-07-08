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
Phase 11 P11C monitoring contract complete; hosted closeout after merge
Phase 11 P11D escalation runbook complete
Phase 11 P11E maintenance cadence complete
Phase 11 P11F acceptance ownership complete
Phase 11 P11G candidate merged PR #473
Phase 11 hosted production monitoring closeout pending
Current workstream: Phase 11 hosted closeout and canonical synchronization
```

```text
P11A baseline: App 22 errors / 10 files; Functions clean
P11A remediation: App clean / Functions clean / overrides 0
P11B initial workflows: 85
P11B initial cancellation gaps: 7
P11B latest recorded workflows: 89
P11B current cancellation gaps: 0
P11B repeated named steps classified: 36
P11B workflows retired solely from named-step overlap: 0
P11C contract evidence: pass
P11C hosted production evidence: required after PR #473 merge
P11D escalation runbook: complete
P11E maintenance cadence: complete
P11F public routes owned: 20 / 20
P11F provider crossing failures: 0
P11F route duplicates: 0
P11G candidate: merged PR #473
```

## Forward execution order

```text
1. Phase 11 hosted production monitoring closeout
2. Phase 12 release readiness
3. Phase 12A Analytics Capture Foundation
4. Phase 13 localization
5. Phase 14 localization completion and acceptance
6. Phase 15 Analytics Capability and Calibration Audit
7. Phase 16A Baseline Engine
8. Phase 16B Anomaly Detection
9. Phase 16C Observed Run Intelligence
10. Phase 16D Category-relative Analysis
11. Phase 16E Co-movement and Relationship Analysis
12. Phase 16F Replay and Backtest
```

## Phase 12A schedule boundary

Phase 12A starts only after Phase 12 closes. It must complete the following before localization becomes the active implementation stream:

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

## Governing documents

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`

Do not create Phase 16 branches before Phase 15 closes. Do not bypass Phase 12A capture work with request-time long-window raw scans or unsupported session/category claims.
