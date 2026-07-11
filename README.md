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
12A-2 production size evidence         accepted PR #498
12A-2 repository migration             accepted PR #499
12A-2 controlled apply code            merged PRs #502-#503
12A-2 collector deployment/schema      accepted PR #506
Twitch remote schema objects           3 / 3
Kick remote schema objects             3 / 3
Worker deployment evidence             present
Remote schema gate                     pass
12A-3 generation                       blocked
Remaining blocker                      account_aggregate_storage_unmeasured
```

## Phase 12A permanent authorities

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
```

## Accepted design and size evidence

```text
grain: provider x day x streamer
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no

Twitch projected with safety: 391.95 MB
Kick projected with safety:   287.95 MB
schemaMigrationGatePass: true
```

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
Twitch Worker: viewloom-collector-twitch
Twitch binding: DB_TWITCH_HOT -> vl_twitch_hot
Twitch schemaComplete: true; objects 3 / 3

Kick Worker: viewloom-collector-kick
Kick binding: DB_KICK_HOT -> vl_kick_hot
Kick schemaComplete: true; objects 3 / 3

read-only probe rowsWritten: 0
remoteSchemaGatePass: true
```

The permanent deployment workflow uses the accepted direct Wrangler CLI path. Pull requests verify only; main pushes and manual dispatch may deploy. No direct D1 execute, public DDL endpoint, backfill, or generation is included.

## Current boundary

```text
workerDeploymentEvidencePresent: true
remoteSchemaGatePass: true
accountAggregateMeasured: false
generationStorageGatePass: false
generationAuthorized: false
```

The blockers `remote_schema_not_applied` and `collector_worker_deployment_not_evidenced` are closed. The next workstream is the 12A-3 generation storage and execution gate.

No backfill, retention extension, new high-frequency cron, category capture activation, exact-session claim, or cross-provider analytics is authorized.

## Forward sequence

```text
12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
