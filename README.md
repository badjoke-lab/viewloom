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
12A-0 data and capacity baseline       active
Exact next branch                      work-analytics-12a0-capacity-baseline
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

## Active Phase 12A

Permanent analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Current workstream:

```text
12A-0 current data and capacity baseline
branch: work-analytics-12a0-capacity-baseline
```

12A-0 is evidence-only and must not include runtime changes. It records:

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
current field matrix
upstream fields discarded before storage
```

Current production capacity inputs:

```text
Twitch: at-or-over-window, 300 / 300, hasMore true
Kick:   at-or-over-window, 100 / 100
```

These are baseline inputs, not authorization to expand observed windows.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
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
