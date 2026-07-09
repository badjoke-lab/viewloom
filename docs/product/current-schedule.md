# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-09

```text
Phase 8 complete PR #428
Phase 9 complete
U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A complete PR #477
R12B complete through R12B-2 PR #481-#483
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline
Next branch created: no
```

## Phase 12 closeout

```text
Phase 12 acceptance: complete
R12C-3 merge SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Production Smoke run: 28993206779
Production Smoke artifact: 8188712759
Independent closeout probe run: 28993547481
Result: pass
```

Permanent evidence:

```text
docs/audits/phase12-release-acceptance.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

## Current Phase 12A execution order

```text
12A-0 current data and capacity baseline                  current
12A-1 analytics field contract                            queued
12A-2 compact intraday rollup design and migration        queued
12A-3 bounded intraday rollup generation                  queued
12A-4 provider-specific category capture foundation       queued
12A-5 production acceptance and accumulation handoff      queued
```

### 12A-0 current scope

12A-0 is evidence-only. It records current facts before schema or runtime changes:

```text
D1 database and table footprint
current raw and rollup retention
current row counts and growth rate evidence
current query patterns and expensive paths
current 5-minute cadence ownership
current scheduled work ownership
current Twitch/Kick capacity observations
current provider-specific category availability
free-tier and operational constraints
```

Closeout observations carried forward:

```text
Twitch: 300/300  at-or-over-window
Kick:   100/100  at-or-over-window
```

These are baseline inputs only. They do not authorize observed-window expansion, raw-retention extension, provider mixing, or unsupported session/category claims.

### 12A-0 completion gate

Before 12A-1 begins, 12A-0 must produce a permanent baseline record covering:

```text
storage footprint
row-count evidence
retention contract
collection cadence
current query inventory
capacity observations
known data gaps
free-tier constraints
no-change runtime statement
```

No migration is allowed in 12A-0.

## Forward execution order

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

## Governing analytics documents

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`

Do not create Phase 16 branches before Phase 15 entry gates close. Do not bypass Phase 12A capture work with request-time long-window raw scans or unsupported session/category claims.
