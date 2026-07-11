# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 current data and capacity baseline: complete PR #490
12A-1 analytics field contract: complete PR #492
12A-2 rollup design budget: accepted PR #494
12A-2 binding size source: merged PR #497
12A-2 production size evidence: accepted PR #498
Current workstream: 12A-2 empty schema migration
Schema migration authorized: yes
Schema migration started: no
Exact next branch: work-analytics-12a2-migration
12A-3 generation authorized: no
Generation blocker: account_aggregate_storage_unmeasured
```

Permanent 12A-2 authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
```

Accepted provider size evidence:

```text
Twitch current/projected: 320.96 / 391.95 MB
Kick current/projected:   264.38 / 287.95 MB
schemaMigrationGatePass: true
accountAggregateMeasured: false
generationStorageGatePass: false
```

`work-analytics-12a2-migration` may add only the accepted empty schema and indexes. It must not backfill rows, start compact-rollup generation, extend raw retention, add a new high-frequency cron, activate category capture, claim exact sessions, or combine providers.

The legacy Wrangler control-plane gate remains blocked by missing repository credentials but is superseded for provider schema-migration authorization by accepted production binding evidence. It is not superseded for account-wide aggregate storage evidence.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
