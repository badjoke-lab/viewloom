# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.9
Last updated: 2026-07-09
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: `work-analytics-12a0-capacity-baseline`
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
12A-0 current data and capacity baseline active
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

## Phase 12 permanent closeout

Permanent release evidence:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
docs/audits/r12c3-candidate-acceptance.json
docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

Accepted production identity:

```text
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:      32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Environment: production
Branch: main
HTML routes: 25
Status APIs: 2
Sitemap URLs: 21
Launch assets: 6
Blocking alerts: 0
```

Completed Phase 12 sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 candidate acceptance                        complete
R12C-3 exact production SHA closeout                complete
```

The Phase 12 English package remains the Phase 13–14 localization source after Phase 12A.

## Active Phase 12A authorities

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/phase12-release-acceptance.json
```

Phase 12A begins collecting and compacting evidence that current daily rollups cannot reconstruct later. It preserves Free Strong collection, retention, provider separation, public-route ownership, and evidence honesty.

## 12A-0 active scope

12A-0 is a baseline and evidence workstream. No runtime change is allowed.

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

Completion:

```text
permanent machine-readable baseline evidence exists
storage/query budgets are recorded before migration
provider differences are explicit
no runtime change is included
```

Current production capacity observations carried into 12A-0:

```text
Twitch: at-or-over-window, 300 / 300, hasMore true
Kick:   at-or-over-window, 100 / 100
```

These observations are baseline inputs, not authorization to expand observed windows.

## Phase 12A sequence

### 12A-1 analytics field contract

Define provider-specific minimum fields for baseline, observed-run, and category work. Decide Twitch `started_at` evidence strength, verify a Kick category source before capture approval, and version analytics source contracts.

### 12A-2 compact intraday rollup design and migration

Design bounded per-stream/day evidence for 90-day baseline capability without retaining raw snapshots for 90 days. Accept storage/query budgets before migration.

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

The program does not authorize raw-retention expansion, high-frequency cron growth, all-pairs continuous computation, unsupported causal attribution, provider mixing, or constant LLM inference.
