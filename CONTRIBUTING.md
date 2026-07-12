# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 repository migration accepted PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Remote schema gate pass
Account D1 databases measured 8 / 8
Generation storage gate pass
Current workstream 12A-3 production execution-cost measurement and bounded generation dry run
12A-3 generation authorized no
Remaining blocker generation_execution_cost_unmeasured
```

## Current permanent evidence

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

## Accepted production state

```text
Twitch schemaComplete true; objects 3 / 3
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true

Twitch current/projected storage 319.39 / 390.38 MB
Kick current/projected storage   268.99 / 292.56 MB
Account databases measured       8 / 8
Account current/projected        3551.70 / 3646.26 MB
Account operational ceiling      4608 MB
generationStorageGatePass        true
```

The permanent storage workflow uses D1 Read only, deletes raw Wrangler responses before artifact upload, and persists no database names, database IDs, Account ID, or secret values.

## Current 12A-3 boundary

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured true
generationStorageGatePass true
generationAuthorized false
runtimeGenerationStarted false
```

Passing storage does not authorize generation. The next branch must measure a bounded execution dry run and establish rows read, rows written, SQL duration, Worker duration, and failure behavior before production rollup writes are enabled.

Do not add:

```text
unbounded backfill
runtime rollup generation before execution-gate acceptance
raw-retention extension
new high-frequency cron
category capture activation
exact-session claims
cross-provider totals, rankings, baselines, categories, or relationships
```

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and gate check
  -> implementation
  -> targeted checks
  -> final latest-head evidence
  -> merge
  -> canonical state update
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain provider-separated.
