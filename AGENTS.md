# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design budget: accepted PR #494
12A-2 production size evidence: accepted PR #498
12A-2 repository migration: accepted PR #499
12A-2 controlled apply code: merged PRs #502-#503
12A-2 collector deployment and remote schema: accepted PR #506
Twitch remote schema objects: 3 / 3
Kick remote schema objects: 3 / 3
Worker deployment evidence: present
Remote schema gate: pass
Current workstream: 12A-3 generation storage and execution gate
12A-3 generation authorized: no
Remaining blocker: account_aggregate_storage_unmeasured
```

Permanent 12A-2 authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
```

Accepted production state:

```text
Twitch projected size with safety 391.95 MB
Kick projected size with safety   287.95 MB
schemaMigrationGatePass true

Twitch Worker deployment success
Twitch schema complete true; objects 3 / 3
Kick Worker deployment success
Kick schema complete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0
```

The permanent collector deploy workflow uses direct Wrangler 4 CLI, separate provider working directories, and GitHub repository secrets. Pull requests verify only. No direct D1 execute, public DDL endpoint, backfill, generation, retention extension, or new cron is included.

The blockers `remote_schema_not_applied` and `collector_worker_deployment_not_evidenced` are closed. Production generation remains prohibited until the account-wide storage and execution-cost gates pass.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
