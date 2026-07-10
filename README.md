# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, storage, rankings, exports, baselines, relationships, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry and repeated temporal relationships
- History = Trends and retained analytical evidence
- Channel = one retained channel footprint and future personal baseline/run interpretation
- Local Watchlist = browser-local saved evidence

## Current state

```text
Local Watchlist v1                     complete PR #425
Phase 8 inventory/browser audit        complete PR #428
Phase 9 History P1 repair              complete
Phase 10 quality program               complete through U10H
Phase 11 P11A-P11G                     complete
Phase 11 production closeout           complete
Phase 12 English release readiness     complete
R12A legal/support public surface      complete
R12B Stripe/support readiness          complete through R12B-2
R12C-0 message inventory               complete PR #484
R12C-1 launch copy and FAQ             complete PR #485
R12C-2 launch/share asset package      complete PR #486
R12C-3 candidate acceptance            complete PR #487
R12C-3 production closeout             complete
Phase 12A Analytics Capture Foundation active
12A-0 data and capacity baseline       complete PR #490
12A-1 analytics field contract         complete PR #492
12A-2 compact intraday rollup design   current
Exact next branch                      work-analytics-12a2-intraday-rollup-design
Next branch created                    no
```

## Phase 12 permanent release acceptance

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Accepted hosted production identity:

```text
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:      32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
HTML routes: 25
Status APIs: 2
Sitemap URLs: 21
Launch assets: 6
Blocking alerts: 0
```

The R12B external-state evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository or public-browser evidence alone.

## Phase 12A analytics foundation

Permanent analytics authorities:

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

12A-0 established the measured provider-separated storage/query baseline. 12A-1 then froze provider-specific field semantics before migration design.

Accepted 12A-1 decisions:

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider category identity equivalence: prohibited
```

## Current workstream: 12A-2

```text
12A-2 compact intraday rollup design and migration
branch: work-analytics-12a2-intraday-rollup-design
```

12A-2 must design a bounded provider-separated compact intraday representation for 90-day baseline capability without extending raw retention.

Before migration is approved, it must record separately for Twitch and Kick:

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

The design must be compared against the accepted 12A-0 baseline. Migration is not authorized until row, byte, retention, index, and query budgets are accepted.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
  12A-0 current data and capacity baseline            complete PR #490
  12A-1 analytics field contract                      complete PR #492
  12A-2 compact intraday rollup design and migration  current
  12A-3 bounded intraday rollup generation            queued
  12A-4 provider-specific category capture foundation queued
  12A-5 foundation acceptance and accumulation handoff queued
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16A Baseline Engine
Phase 16B Anomaly Detection
Phase 16C Observed Run Intelligence
Phase 16D Category-relative Analysis
Phase 16E Co-movement and Relationship Analysis
Phase 16F Replay and Backtest
```

The analytics target is:

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate runtime validation uses `preview-*` only when necessary. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
