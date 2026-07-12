# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design and migration: accepted through PR #499
12A-2 collector deployment and remote schema: accepted PR #506
12A-3 account storage gate: accepted PR #507
12A-3 execution-cost gate: accepted PR #508
Twitch remote schema objects: 3 / 3
Kick remote schema objects: 3 / 3
Account D1 databases measured: 8 / 8
Generation storage gate: pass
Generation execution-cost gate: pass
Current workstream: 12A-3 bounded production generator implementation
Production generation started: no
Remaining implementation boundary: bounded_generator_not_implemented
```

Permanent authorities:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a3-account-storage-gate-contract.json
docs/audits/12a3-account-storage-evidence.json
docs/audits/12a3-execution-cost-probe-contract.json
docs/audits/12a3-execution-cost-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a3-account-storage-acceptance-2026-07-12.md
docs/operations/12a3-execution-cost-acceptance-2026-07-12.md
```

Accepted gates:

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true

Twitch aggregate D1 duration / wall 790.730 / 1368 ms
Twitch full-cap write wall projection 5040 ms
Kick aggregate D1 duration / wall 426.097 / 788 ms
Kick full-cap write wall projection 1848 ms

idempotent second pass true for both providers
probe rows retained 0
temporary Workers retained no
```

The blockers `remote_schema_not_applied`, `collector_worker_deployment_not_evidenced`, `account_aggregate_storage_unmeasured`, and `generation_execution_cost_unmeasured` are closed.

The next change may implement bounded provider-specific generation behind existing maintenance windows, but must keep runtime generation disabled until implementation acceptance. It must use idempotent upserts, preserve provider separation, expose cost observations, contain failures after collector execution, and add no backfill or new high-frequency cron.

No direct D1 execute, public DDL endpoint, retention extension, category capture activation, exact-session claims, or cross-provider analytics is authorized.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.
