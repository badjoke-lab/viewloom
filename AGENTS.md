# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design budget: accepted PR #494
12A-2 repository migration: accepted PR #499
12A-2 collector deployment and remote schema: accepted PR #506
12A-3 account storage gate: accepted PR #507
Twitch remote schema objects: 3 / 3
Kick remote schema objects: 3 / 3
Remote schema gate: pass
Account D1 databases measured: 8 / 8
Generation storage gate: pass
Current workstream: 12A-3 production execution-cost measurement and bounded generation dry run
12A-3 generation authorized: no
Remaining blocker: generation_execution_cost_unmeasured
```

Permanent authorities:

```text
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

Accepted production state:

```text
Twitch schema complete true; objects 3 / 3
Kick schema complete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0

Twitch current/projected storage 319.39 / 390.38 MB
Kick current/projected storage   268.99 / 292.56 MB
Account databases measured       8 / 8
Account current/projected        3551.70 / 3646.26 MB
Account operational ceiling      4608 MB
generationStorageGatePass        true
```

The permanent collector deploy workflow uses direct Wrangler 4 CLI and separate provider working directories. The permanent account storage workflow uses D1 Read only, deletes raw control-plane responses, and runs manually and weekly after merge.

Passing storage does not authorize production generation. Do not add runtime rollup generation until a bounded execution-cost measurement and dry run pass. No direct D1 execute, public DDL endpoint, backfill, retention extension, category capture activation, exact-session claims, or cross-provider analytics is authorized.

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
