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
12A-1 analytics field contract         current
Exact next branch                      work-analytics-12a1-field-contract
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

Phase 12 completed legal/support surfaces, Stripe/support-flow readiness, the English launch-copy package, a 12-question FAQ, a repo-owned six-image launch/share asset package, premerge 100-scenario browser acceptance, and exact-SHA hosted production closeout.

The R12B external-state evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository or public-browser evidence alone.

## Phase 12A analytics foundation

Permanent analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md
docs/operations/12a0-closeout-2026-07-10.md
```

12A-0 completed the provider-separated production baseline without runtime or data-path changes. Accepted baseline highlights:

```text
Twitch raw rows:              8,688
Twitch retained payload:      314.14 MB
Twitch estimated payload/day: 10.38 MB
Twitch rollup observed days:  74

Kick raw rows:                14,442
Kick retained payload:        232.96 MB
Kick estimated payload/day:   4.63 MB
Kick rollup observed days:    52

Latest 24h cadence:           287 / 288 for each provider
```

These are measured baseline inputs. They do not authorize migration, observed-window expansion, raw-retention extension, or provider combination.

Current workstream:

```text
12A-1 analytics field contract
branch: work-analytics-12a1-field-contract
```

12A-1 must define minimum provider-specific fields for baseline, observed-run, and category work; classify Twitch `started_at` evidence strength; verify a Kick category source before category capture approval; version analytics source contracts; and document provider differences without identity-equivalence claims.

12A-1 does not authorize the 12A-2 migration. It must not add analytics UI, extend raw retention, add a new high-frequency cron, combine providers, or make exact-session claims.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
  12A-0 current data and capacity baseline            complete
  12A-1 analytics field contract                      current
  12A-2 compact intraday rollup design and migration  queued
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
