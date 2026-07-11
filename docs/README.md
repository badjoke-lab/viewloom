# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-11

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 rollup design budget accepted PR #494
12A-2 remote D1 size gate tooling installed PR #495
Current workstream 12A-2 remote D1 size gate blocked before migration
Current blocker cloudflare_credentials_missing
Migration started no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior capability audit: `product/next-feature-data-capability-audit.md`
- 12A-0 baseline: `audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `audits/12a1-source-evidence.json`
- 12A-2 design contract: `audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 design acceptance: `operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md`
- 12A-2 remote-size evidence: `audits/12a2-remote-d1-size-evidence.json`
- 12A-2 current gate state: `audits/12a2-current-gate-state.json`
- 12A-2 blocked record: `operations/12a2-remote-d1-size-gate-blocked-2026-07-11.md`
- Phase 12 release acceptance: `audits/phase12-release-acceptance.json`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12A

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design budget                                 accepted PR #494
12A-2 remote D1 size gate tooling                   installed PR #495
12A-2 migration                                     blocked before start
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

### Accepted 12A-2 design

```text
grain provider x day x streamer
Twitch cap 600 streamers/day
Kick cap 200 streamers/day
intraday retention 90 days
new cron no
raw retention extension no
Twitch safe projection 70.99 MB
Kick safe projection 23.57 MB
combined safe projection 94.56 MB
```

### Current remote-size blocker

The remote-size workflow is installed, privacy-bounded, and verified. The current GitHub workflow environment does not expose:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Therefore:

```text
remote evidence status blocked
blocker cloudflare_credentials_missing
migrationStorageGatePass false
migration authorized false
migration started no
```

No current remote D1 size or storage headroom claim is made.

Resume condition:

```text
make both repository secrets available
rerun Analytics 12A2 Remote D1 Size Gate on main
require observed evidence and migrationStorageGatePass=true
only then create work-analytics-12a2-migration
```

## Approved analytics program order

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
