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
12A-2 rollup design budget             accepted PR #494
12A-2 remote D1 size gate              installed PR #495
12A-2 migration                        blocked before start
Blocker                                cloudflare_credentials_missing
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

Permanent analytics authorities now include:

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

### Accepted 12A-0 baseline

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

### Accepted 12A-1 contract

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider category identity equivalence: prohibited
```

### Accepted 12A-2 design budget

```text
grain: provider x day x streamer
hour encoding: sparse compact JSON cells
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
retention: 90 days
new cron: no
raw retention extension: no

Twitch safe projected rollup storage: 70.99 MB
Kick safe projected rollup storage:   23.57 MB
Combined safe projection:             94.56 MB
```

## Current blocker

The remote D1 size gate tooling is installed and verified, but the current GitHub workflow environment does not expose:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Therefore the permanent gate state is:

```text
remote size evidence status: blocked
blocker: cloudflare_credentials_missing
Twitch storage gate: false
Kick storage gate: false
account storage gate: false
migration storage gate: false
migration authorized: false
migration started: no
```

False means not measured / blocked, not capacity failure. No current remote D1 size or headroom claim is made.

Resume condition:

```text
1. make the two repository secrets available
2. rerun Analytics 12A2 Remote D1 Size Gate on main
3. require observed-mode evidence and migrationStorageGatePass=true
4. only then create work-analytics-12a2-migration
```

No migration, runtime generation, retention extension, cron change, category capture activation, exact-session claim, or cross-provider analytics is authorized while the blocker remains current.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
  12A-0 current data and capacity baseline            complete PR #490
  12A-1 analytics field contract                      complete PR #492
  12A-2 design budget                                 accepted PR #494
  12A-2 remote size gate tooling                      installed PR #495
  12A-2 migration                                     blocked
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

Canonical reading starts at `docs/README.md`. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
