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
R12A legal/support public-surface completion complete
R12B Stripe/support readiness complete through R12B-2
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete PR #485
R12C-2 launch/share asset package complete PR #486
R12C-3 candidate acceptance complete PR #487
R12C-3 exact production SHA closeout complete
Current phase: Phase 12A Analytics Capture Foundation
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-capacity-baseline
Next branch created: no
```

## Phase 12 accepted execution order

```text
R12A-0 current legal/support surface audit                 complete
R12A-1 shared legal/support page foundation                complete
R12A-2 Contact, Terms, Privacy                             complete
R12A-3 Refund Policy and Commercial Disclosure             complete
R12A-4 About/footer and route ownership integration        complete
R12A-5 candidate and hosted acceptance                     complete
R12B-0 evidence and configuration audit                    complete
R12B-1 Support page and payment transition                 complete
R12B-2 refund/disclosure consistency acceptance            complete
R12C-0 message inventory                                   complete
R12C-1 launch copy and FAQ                                 complete
R12C-2 launch/share asset package                          complete
R12C-3 release candidate acceptance                        complete
R12C-3 exact production SHA smoke                          complete
R12C permanent release evidence                            complete
R12C canonical closeout                                    complete
```

Permanent Phase 12 release evidence:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Accepted production baseline:

```text
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:      32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
HTML routes: 25
Status APIs: 2
Sitemap URLs: 21
Launch assets: 6
Blocking alerts: 0
Twitch capacity: at-or-over-window 300/300, hasMore true
Kick capacity: at-or-over-window 100/100
```

## Active Phase 12A schedule

```text
12A-0 current data and capacity baseline            active
12A-1 analytics field contract                      queued
12A-2 compact intraday rollup design and migration  queued
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

### 12A-0 — current data and capacity baseline

Exact branch:

```text
work-analytics-12a0-capacity-baseline
```

Required evidence:

```text
current D1 row counts
payload size
oldest/latest raw bucket
daily-rollup counts
collector duration
relevant query timings
Twitch/Kick source modes and coverage behavior
five-minute cadence behavior
rollup/retention schedule behavior
current field matrix against the prior capability audit
upstream fields fetched but discarded before storage
```

Completion rules:

```text
permanent machine-readable baseline evidence exists
storage/query budgets are recorded before migration
Twitch/Kick evidence remains provider-separated
no runtime change is included
```

## Phase 12A sequence after 12A-0

### 12A-1 — analytics field contract

Define minimum provider-specific fields for baseline, observed-run, and category work. Decide the evidence strength of Twitch `started_at`, verify a Kick category source before approving category capture, and document provider differences without claiming identity equivalence.

### 12A-2 — compact intraday rollup design and migration

Design a bounded per-stream/day compact intraday representation for 90-day baseline capability without extending raw retention. Add migration only after row/byte/query budgets are accepted.

### 12A-3 — bounded intraday rollup generation

Generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector duration plus D1 query/write cost.

### 12A-4 — category capture foundation

Add provider-specific category/game fields only after source verification, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 — foundation acceptance and accumulation handoff

Run provider-separated collector/storage acceptance, verify retention and rollup behavior, record production evidence, freeze schema/output contracts, and hand off to Phase 13–14 localization while evidence accumulates.

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
- Current production baseline input: `../audits/phase12-release-acceptance.json`

Do not bypass Phase 12A capture work with request-time long-window raw scans, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
