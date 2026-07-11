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
Twitch remote schema objects: 0 / 3
Kick remote schema objects: 0 / 3
Remote schema gate: blocked
Current workstream: controlled remote schema apply and verification
12A-3 generation authorized: no
Generation blockers: remote_schema_not_applied, account_aggregate_storage_unmeasured
```

Permanent 12A-2 authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-remote-schema-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md
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

The remote schema is observed absent, not merely unverified. Use only a controlled, idempotent, provider-separated remote apply path for the accepted schema. Keep generation disabled during apply, then rerun the read-only schema probe and require 3 / 3 matching objects for both providers.

Do not add backfill, runtime generation, retention extension, a new high-frequency cron, category capture activation, exact-session claims, or cross-provider analytics before the relevant gates close.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
