# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, bindings, storage, rankings, exports, baselines, relationships, categories, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry and repeated temporal relationships
- History = Trends and retained analytical evidence
- Channel = one retained channel footprint and future personal baseline/run interpretation
- Local Watchlist = browser-local saved evidence

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline                         complete PR #490
12A-1 field contract                   complete PR #492
12A-2 design and migration             accepted through PR #499
12A-2 collector deployment/schema      accepted PR #506
12A-3 account storage gate             accepted PR #507
12A-3 execution-cost gate              accepted PR #508
12A-3 bounded generator                enabled PR #510
12A-3 production accumulation          accepted PR #511
12A-4 category source audit            accepted PR #513
12A-4 category storage design          accepted PR #514
Production intraday generation         enabled and accumulating
Current workstream                     12A-4 category migration and disabled runtime implementation
Category capture runtime               not started
```

## Phase 12A permanent authorities

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a3-account-storage-evidence.json
docs/audits/12a3-execution-cost-evidence.json
docs/audits/12a3-generator-enablement-evidence.json
docs/audits/12a3-postmerge-acceptance-evidence.json
docs/audits/12a4-category-source-audit-contract.json
docs/audits/12a4-category-source-audit-evidence.json
docs/audits/12a4-category-storage-design-contract.json
docs/audits/12a4-category-storage-budget-evidence.json
docs/audits/12a2-current-gate-state.json
```

## Accepted category source contracts

```text
Twitch endpoint: https://api.twitch.tv/helix/streams
Twitch provider id / name: game_id / game_name
Twitch live field presence: 1.0 across two 100-row probes

Kick endpoint: https://api.kick.com/public/v1/livestreams
Kick provider id / name: category.id / category.name
Kick live field presence: 1.0 across two 100-row probes

provider category identity equivalence: false
combined-provider category ranking: forbidden
runtime category capture: disabled
```

## Accepted category storage design

```text
selected model: embedded_hourly
category contract: category-source-v1
raw encoding: categoryIds + item-order-aligned categoryRefs
category names: one set-based provider_category_dictionary write
long-term encoding: category_hourly_json in existing streamer/day rows
new category index: no
raw-retention extension: no
new cron: no
backfill: no
```

```text
Twitch projected total/headroom: 438.70 / 11.30 MB
Kick projected total/headroom: 314.57 / 135.43 MB
Account projected total/headroom: 3716.59 / 891.41 MB
```

## Current boundary

```text
intraday generation authorized: true
intraday generation running: true
category source contract accepted: true
category storage design accepted: true
repository migration candidate authorized: true
remote production migration authorized: false
production cost probe required: true
category runtime capture authorized: false
category runtime capture started: false
raw retention unchanged: true
new cron authorized: false
backfill authorized: false
category analytics UI authorized: false
```

The next change adds the provider-separated repository migration candidate and disabled-by-default runtime implementation. It must add no production flag, perform no remote migration, write no production category rows, and preserve the existing collector outcome, cadence, retention, and provider separation.

## Forward sequence

```text
12A-4 migration and disabled runtime implementation
  -> production execution-cost probe and remote migration decision
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only accepted evidence and latest-head verification count.
