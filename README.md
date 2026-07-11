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
12A-2 remote schema evidence           observed PR #501
12A-2 controlled apply code            merged PR #502
12A-2 immediate bootstrap refinement   merged PR #503
12A-2 post-bootstrap recheck           observed PR #504
Remote Twitch schema objects           0 / 3
Remote Kick schema objects             0 / 3
Worker deployment evidence             absent
Remote schema gate                     blocked
12A-3 generation                       blocked
Generation blockers                    remote_schema_not_applied
                                       collector_worker_deployment_not_evidenced
                                       account_aggregate_storage_unmeasured
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
docs/audits/12a2-remote-schema-production-evidence.json
docs/audits/12a2-remote-schema-post-bootstrap-recheck.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md
docs/operations/12a2-remote-schema-production-recheck-2026-07-11.md
```

## Accepted 12A-2 design and size evidence

```text
grain: provider x day x streamer
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no

Twitch current/projected: 320.96 / 391.95 MB
Kick current/projected:   264.38 / 287.95 MB
schemaMigrationGatePass: true
```

## Accepted repository migration

```text
db/d1/004_intraday_rollups.sql

streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Verified locally:

```text
scope guard pass
local apply pass
second apply idempotency pass
exact table / PK / index shape pass
empty after apply
forbidden DML absent
```

## Controlled apply code

PR #502 added a provider-separated bootstrap path through the existing collector D1 bindings. PR #503 added one immediate startup attempt per Worker isolate, a warm-isolate presence cache, and bounded maintenance retries.

```text
public DDL endpoint: no
new cron: no
backfill: no
generation: no
retention change: no
Twitch binding: DB_TWITCH_HOT
Kick binding: DB_KICK_HOT
```

Repository merge does not prove Worker deployment.

## Observed production remote schema state

The initial read-only production probe and the post-bootstrap code-merge recheck both observed:

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

The recheck occurred after PRs #502 and #503 were merged. Controlled apply code is therefore present in the repository, but Worker deployment evidence is not present and remote schema remains absent.

## Current boundary

```text
controlledApplyCodeMerged: true
workerDeploymentEvidencePresent: false
remoteSchemaGatePass: false
accountAggregateMeasured: false
generationStorageGatePass: false
generationAuthorized: false
```

The next workstream is collector Worker deployment evidence and remote schema verification. Deploy the collector code through an authorized Cloudflare-side process or produce independent deployment evidence, then rerun the read-only schema probe and require 3 / 3 matching objects for both providers.

No backfill, retention extension, new high-frequency cron, category capture activation, exact-session claim, or cross-provider analytics is authorized.

## Forward sequence

```text
collector Worker deployment evidence
  -> controlled bootstrap execution
  -> read-only remote schema verification
  -> 12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only latest-head evidence counts. Twitch and Kick remain provider-separated.
