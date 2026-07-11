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
Phase 12 English release readiness     complete
Phase 12A Analytics Capture Foundation active
12A-0 data and capacity baseline       complete PR #490
12A-1 analytics field contract         complete PR #492
12A-2 rollup design budget             accepted PR #494
12A-2 control-plane gate tooling       installed PR #495
12A-2 binding size source              merged PR #497
12A-2 production size evidence         accepted PR #498
12A-2 schema migration                 authorized, not started
12A-3 generation                       blocked
Generation blocker                    account_aggregate_storage_unmeasured
```

## Phase 12A permanent authorities

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/analytics-field-contract-v1.md
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
```

## Accepted 12A-2 design and production size evidence

```text
grain: provider x day x streamer
hour encoding: sparse compact JSON cells
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no
```

Production D1 size evidence from `D1Result.meta.size_after`:

```text
Twitch current size:                  320.96 MB
Twitch safe rollup projection:         70.99 MB
Twitch projected size:                391.95 MB
Twitch provider migration gate:       pass

Kick current size:                    264.38 MB
Kick safe rollup projection:           23.57 MB
Kick projected size:                  287.95 MB
Kick provider migration gate:         pass

schemaMigrationGatePass: true
```

The legacy control-plane workflow remains blocked by missing Cloudflare repository credentials, but that blocker is superseded for the provider-specific schema migration gate by accepted binding-based production evidence.

## Current boundary

The next allowed branch is:

```text
work-analytics-12a2-migration
```

That branch may add only the accepted empty tables and indexes. It must not backfill rows or start compact-rollup generation.

The remaining generation state is:

```text
accountAggregateMeasured: false
generationStorageGatePass: false
generation authorized: false
12A-3 status: blocked
```

No runtime generation, retention extension, new high-frequency cron, category capture activation, exact-session claim, or cross-provider analytics is authorized by the schema migration gate.

## Approved forward sequence

```text
12A-2 empty schema migration
  -> migration acceptance
  -> 12A-3 generation gate and bounded generation
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
