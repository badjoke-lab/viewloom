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
Phase 12A Analytics Capture Foundation active
12A-0 baseline                         complete PR #490
12A-1 field contract                   complete PR #492
12A-2 design budget                    accepted PR #494
12A-2 repository migration             accepted PR #499
12A-2 collector deployment/schema      accepted PR #506
12A-3 account storage gate             accepted PR #507
Twitch remote schema objects           3 / 3
Kick remote schema objects             3 / 3
Remote schema gate                     pass
Account D1 databases measured          8 / 8
Generation storage gate                pass
12A-3 generation                       blocked
Remaining blocker                      generation_execution_cost_unmeasured
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
docs/audits/12a3-account-storage-gate-contract.json
docs/audits/12a3-account-storage-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
docs/operations/12a3-account-storage-acceptance-2026-07-12.md
```

## Accepted design and storage evidence

```text
grain: provider x day x streamer
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no

Twitch current/projected: 319.39 / 390.38 MB
Twitch provider storage gate: true

Kick current/projected: 268.99 / 292.56 MB
Kick provider storage gate: true

Account D1 databases measured: 8 / 8
Account current/projected: 3551.70 / 3646.26 MB
Account operational ceiling: 4608 MB
Account projected headroom: 1473.74 MB
Account storage gate: true

generationStorageGatePass: true
```

Cloudflare Workers Free limits used by the gate are 500 MB per database and 5 GB per account. ViewLoom applies 90% operational ceilings of 450 MB and 4608 MB.

## Accepted migration and remote deployment

Repository migration:

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Production deployment evidence:

```text
method: Wrangler 4 CLI
Twitch schemaComplete: true; objects 3 / 3
Kick schemaComplete: true; objects 3 / 3
read-only probe rowsWritten: 0
remoteSchemaGatePass: true
```

The permanent deployment workflow uses the accepted direct Wrangler CLI path. Pull requests verify only; main pushes and manual dispatch may deploy. No direct D1 execute, public DDL endpoint, backfill, or generation is included.

## Current boundary

```text
workerDeploymentEvidencePresent: true
remoteSchemaGatePass: true
accountAggregateMeasured: true
generationStorageGatePass: true
generationAuthorized: false
runtimeGenerationStarted: false
```

The storage blocker `account_aggregate_storage_unmeasured` is closed. Passing storage does not authorize generation. The next workstream is production execution-cost measurement and a bounded dry run.

No backfill, retention extension, new high-frequency cron, category capture activation, exact-session claim, or cross-provider analytics is authorized.

## Forward sequence

```text
12A-3 production execution-cost measurement and bounded dry run
  -> bounded intraday rollup generation
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
