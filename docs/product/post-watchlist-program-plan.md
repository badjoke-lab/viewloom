# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.0
Last updated: 2026-07-10
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-1 analytics field contract
Exact next implementation branch: `work-analytics-12a1-field-contract`
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
12A-1 analytics field contract current
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

The Phase 12 English package remains the Phase 13–14 localization source after Phase 12A.

## Active Phase 12A authorities

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md
docs/operations/12a0-closeout-2026-07-10.md
```

Phase 12A begins collecting and compacting evidence that current daily rollups cannot reconstruct later. It preserves Free Strong collection, retention, provider separation, public-route ownership, and evidence honesty.

## Completed 12A-0 baseline

12A-0 completed as provider-separated, evidence-only work in PR #490.

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

The baseline records storage/query budgets, source and coverage behavior, schedule and retention behavior, field loss, and the current collector-duration measurement limitation. It does not authorize migration, retention expansion, observed-window expansion, category capture, or provider combination.

## Active 12A-1 scope

12A-1 defines versioned provider-specific analytics field contracts before migration design.

Required decisions:

```text
minimum Twitch baseline fields
minimum Kick baseline fields
minimum provider-specific observed-run fields
minimum provider-specific category fields
Twitch started_at evidence strength and retention policy
verified Kick category source before category capture approval
field provenance and evidence-strength labels
source contract versioning
provider differences without identity-equivalence claims
```

Completion:

```text
provider-specific field contracts exist
field provenance is explicit
Twitch started_at policy is decided
Kick category source is verified or capture remains explicitly unapproved
source contracts are versioned
12A-2 migration inputs are defined without performing migration
no analytics UI or cross-provider analytics is included
```

12A-1 must not add a D1 migration, compact-rollup generation, raw-retention extension, new high-frequency cron, unverified category capture, exact-session claims, or cross-provider totals/rankings/baselines/relationships.

## Phase 12A sequence

### 12A-1 analytics field contract

Define provider-specific minimum fields for baseline, observed-run, and category work. Decide Twitch `started_at` evidence strength, verify a Kick category source before capture approval, and version analytics source contracts.

### 12A-2 compact intraday rollup design and migration

Design bounded per-stream/day evidence for 90-day baseline capability without retaining raw snapshots for 90 days. Accept storage/query budgets against the 12A-0 baseline before migration.

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
