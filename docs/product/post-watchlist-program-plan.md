# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.2
Last updated: 2026-07-11
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: 12A-2 compact intraday rollup design and migration
Current state: blocked before migration
Current blocker: `cloudflare_credentials_missing`

```text
Phase 10 complete through U10H
Phase 11 complete and production-closed
Phase 12 English release readiness complete
Phase 12A Analytics Capture Foundation active
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 remote D1 size gate tooling installed PR #495
12A-2 migration blocked before start
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System gated by Phase 15
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
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-remote-d1-size-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/analytics-field-contract-v1.md
docs/product/intraday-rollup-design-v1.md
```

## Completed 12A-0 baseline

```text
Twitch raw rows 8,688; estimated payload/day 10.38 MB; rollup observed days 74
Kick raw rows 14,442; estimated payload/day 4.63 MB; rollup observed days 52
Latest 24h cadence 287 / 288 for each provider
```

## Completed 12A-1 field contract

```text
Twitch provider_started_at approved for future capture as provider_reported_start_time
Kick provider_started_at unavailable until source verification
Twitch category capture unapproved
Kick category capture unapproved pending accepted live primary-path evidence
cross-provider identity equivalence prohibited
```

## Accepted 12A-2 design budget

PR #494 accepted:

```text
grain provider x day x streamer
Twitch cap 600/day
Kick cap 200/day
intraday retention 90 days
new cron no
raw retention extension no
Twitch safe rollup projection 70.99 MB
Kick safe rollup projection 23.57 MB
combined safe projection 94.56 MB
```

The design budget passed conservative local SQLite measurement and query-plan verification.

## Current blocked gate

PR #495 installed the remote D1 size gate. Current permanent evidence records:

```text
status blocked
blocker cloudflare_credentials_missing
Twitch gate false
Kick gate false
account gate false
migrationStorageGatePass false
migration authorized false
migration started no
```

The workflow environment currently lacks:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

No current remote D1 size, utilization, or headroom claim is made. The false gate values mean not measured / blocked, not capacity failure.

## Resume condition

```text
1. make both repository secrets available
2. rerun Analytics 12A2 Remote D1 Size Gate on main
3. require observed-mode evidence
4. require migrationStorageGatePass=true
5. only then create work-analytics-12a2-migration
6. add and verify the migration
7. proceed to 12A-3 generation only after migration acceptance
```

## Remaining Phase 12A sequence

### 12A-2 migration

Blocked. Do not create or merge migration work until the remote-size gate passes.

### 12A-3 bounded intraday rollup generation

Queued. Generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Queued. Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Queued. Run provider-separated collector/storage acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

## Phase 13-14 relationship to analytics

Localization follows Phase 12A. Accepted intraday/category evidence may accumulate while Phase 16 feature work remains blocked until Phase 15.

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

Phase 16 implementation remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
