# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-10

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
12A-0 current data and capacity baseline: complete PR #490
12A-1 analytics field contract: complete PR #492
Current workstream: 12A-2 compact intraday rollup design and migration
Exact next implementation branch: work-analytics-12a2-intraday-rollup-design
Next branch created: no
```

## Active Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 compact intraday rollup design and migration  active
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

### 12A-0 — current data and capacity baseline

Status: complete PR #490

Permanent evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md
docs/operations/12a0-closeout-2026-07-10.md
```

Accepted baseline highlights:

```text
Twitch raw rows 8,688; retained payload 314.14 MB; estimated 10.38 MB/day; rollup observed days 74
Kick raw rows 14,442; retained payload 232.96 MB; estimated 4.63 MB/day; rollup observed days 52
Latest 24h cadence 287 / 288 for each provider
```

### 12A-1 — analytics field contract

Status: complete PR #492

Permanent evidence:

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/product/analytics-field-contract-v1.md
docs/operations/12a1-field-contract-acceptance-2026-07-10.md
docs/operations/12a1-closeout-2026-07-10.md
```

Accepted decisions:

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider identity equivalence: prohibited
```

### 12A-2 — compact intraday rollup design and migration

Exact branch:

```text
work-analytics-12a2-intraday-rollup-design
```

Purpose: design a bounded per-stream/day compact intraday representation for 90-day baseline capability without extending raw retention.

Required provider-specific design evidence:

```text
rows/day
bytes/row
bytes/day
retained rows
retained size
index cost
query plan and timing target
refresh scope
retention policy
failure visibility
```

Completion rules:

```text
schema design is provider-separated
row/day and byte/day budgets exist for Twitch and Kick
retained-size and index-cost estimates exist
query plans and timing targets exist
refresh and failure behavior are explicit
raw retention is not extended
12A-1 field/source contract boundaries are preserved
migration is added only after budget acceptance
```

The 12A-0 raw payload baselines are comparison inputs, not direct compact-rollup budgets:

```text
Twitch estimated raw payload: 10.38 MB/day
Kick estimated raw payload:    4.63 MB/day
```

12A-2 must not assume exact session boundaries, Kick provider start time, category capture approval, or cross-provider category identity.

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
- Accepted 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `../audits/12a1-source-evidence.json`
- 12A-1 closeout: `../audits/12a1-closeout.json`

Do not bypass Phase 12A capture work with request-time long-window raw scans, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
