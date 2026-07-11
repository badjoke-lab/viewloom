# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design budget: accepted PR #494
12A-2 production size evidence: accepted PR #498
12A-2 repository migration: accepted PR #499
Remote D1 schema apply: unverified
Current workstream: remote schema apply / verification gate before 12A-3 generation
12A-3 generation authorized: no
Generation blockers: account_aggregate_storage_unmeasured, remote_schema_apply_unverified
```

Permanent 12A-2 authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
```

Accepted provider evidence:

```text
Twitch current/projected 320.96 / 391.95 MB
Kick current/projected   264.38 / 287.95 MB
schemaMigrationGatePass true
```

Accepted repository migration:

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Do not infer remote schema application from repository migration acceptance. No production generator may write until remote schema existence is separately evidenced and generation storage/execution gates pass.

Do not add backfill, runtime generation, retention extension, a new high-frequency cron, category capture activation, exact-session claims, or cross-provider analytics before the relevant gates close.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
