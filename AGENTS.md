# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design budget: accepted PR #494
12A-2 production size evidence: accepted PR #498
12A-2 repository migration: accepted PR #499
12A-2 remote schema evidence: observed PR #501
12A-2 controlled apply code: merged PR #502
12A-2 immediate bootstrap refinement: merged PR #503
12A-2 post-bootstrap recheck: observed PR #504
Twitch remote schema objects: 0 / 3
Kick remote schema objects: 0 / 3
Worker deployment evidence: absent
Remote schema gate: blocked
Current workstream: collector Worker deployment evidence and remote schema verification
12A-3 generation authorized: no
Generation blockers: remote_schema_not_applied, collector_worker_deployment_not_evidenced, account_aggregate_storage_unmeasured
```

Permanent 12A-2 authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-remote-schema-production-evidence.json
docs/audits/12a2-remote-schema-post-bootstrap-recheck.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md
docs/operations/12a2-remote-schema-production-recheck-2026-07-11.md
```

Observed provider evidence:

```text
Twitch current/projected size 320.96 / 391.95 MB
Kick current/projected size   264.38 / 287.95 MB
schemaMigrationGatePass true

Twitch remote schema complete false; objects 0 / 3
Kick remote schema complete   false; objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

Accepted repository migration:

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Controlled apply code is merged and uses separate provider D1 bindings, one immediate bootstrap attempt per Worker isolate, warm-isolate presence caching, and bounded maintenance retries. Repository merge does not prove Worker deployment.

The post-bootstrap production recheck still observed 0 / 3 schema objects for both providers. Current work must establish collector Worker deployment through an authorized Cloudflare-side process or independent deployment evidence, then rerun the read-only schema probe.

Do not add backfill, runtime generation, retention extension, a new high-frequency cron, category capture activation, exact-session claims, or cross-provider analytics before the relevant gates close.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
