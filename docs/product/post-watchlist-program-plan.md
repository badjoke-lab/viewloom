# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.1
Last updated: 2026-07-10
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-2 compact intraday rollup design and migration
Exact next implementation branch: `work-analytics-12a2-intraday-rollup-design`
Next branch created: no

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A legal/support public-surface completion complete
R12B Stripe/support readiness complete through R12B-2
R12C-0 message inventory complete
R12C-1 launch copy and FAQ complete
R12C-2 launch/share asset package complete PR #486
R12C-3 candidate acceptance complete PR #487
R12C-3 exact production SHA closeout complete
Phase 12A Analytics Capture Foundation active
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 compact intraday rollup design and migration current
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved and gated by Phase 15
```

## Program sequence

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

## Active Phase 12A authorities

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/product/analytics-field-contract-v1.md
docs/operations/12a1-field-contract-acceptance-2026-07-10.md
docs/operations/12a1-closeout-2026-07-10.md
```

Phase 12A begins collecting and compacting evidence that current daily rollups cannot reconstruct later. It preserves Free Strong collection, retention, provider separation, public-route ownership, and evidence honesty.

## Completed 12A-0 baseline

```text
Twitch raw rows: 8,688
Twitch retained payload: 314.14 MB
Twitch estimated payload/day: 10.38 MB
Twitch rollup observed days: 74

Kick raw rows: 14,442
Kick retained payload: 232.96 MB
Kick estimated payload/day: 4.63 MB
Kick rollup observed days: 52

Latest 24h cadence: 287 / 288 for each provider
```

The baseline does not authorize migration, retention expansion, observed-window expansion, category capture, or provider combination.

## Completed 12A-1 field contract

12A-1 completed in PR #492.

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider identity equivalence: prohibited
```

The field contract defines migration inputs without performing migration or enabling new runtime capture.

## Active 12A-2 scope

12A-2 designs a bounded provider-separated compact intraday representation for 90-day baseline capability without retaining raw snapshots for 90 days.

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

Completion:

```text
schema design is provider-separated
row/day and byte/day budgets exist for both providers
retained-size and index-cost estimates exist
query plans and timing targets exist
refresh and failure behavior are explicit
raw retention is not extended
12A-1 field/source contract boundaries are preserved
migration is added only after budget acceptance
```

The design must be compared with the accepted 12A-0 raw payload baselines:

```text
Twitch 10.38 MB/day estimated raw payload
Kick    4.63 MB/day estimated raw payload
```

12A-2 must not assume exact session boundaries, Kick provider start-time availability, category capture approval, or cross-provider category identity equivalence.

## Phase 12A sequence

### 12A-2 compact intraday rollup design and migration

Design bounded per-stream/day evidence for 90-day baseline capability without retaining raw snapshots for 90 days. Accept provider-separated storage/query budgets before migration.

### 12A-3 bounded intraday rollup generation

Generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated collector/storage acceptance, verify retention/rollup behavior, record production evidence, freeze schema/output contracts, and hand off to localization while evidence accumulates.

## Phase 13-14 relationship to analytics

Localization follows Phase 12A. During localization, accepted intraday/category evidence may accumulate while Phase 16 feature work remains blocked until Phase 15.

## Phase 15 purpose

```text
sample support thresholds
baseline fallback hierarchy
baseline configuration v1
anomaly rule candidate v1
observed-run gap/confidence policy
category coverage policy
relationship candidate policy
replay execution policy
storage/query budget evidence
```

## Phase 16 purpose

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

Phase 16 implementation remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
