# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 controlled apply code merged PRs #502-#503
12A-2 collector deployment and remote schema accepted PR #506
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Worker deployment evidence present
Remote schema gate pass
Current workstream 12A-3 generation storage and execution gate
12A-3 generation authorized no
Remaining blocker account_aggregate_storage_unmeasured
```

## Current permanent evidence

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
```

## Accepted deployment state

```text
method Wrangler 4 CLI
Twitch Worker deploy success
Twitch binding DB_TWITCH_HOT -> vl_twitch_hot
Twitch schemaComplete true; objects 3 / 3

Kick Worker deploy success
Kick binding DB_KICK_HOT -> vl_kick_hot
Kick schemaComplete true; objects 3 / 3

remoteSchemaGatePass true
probe rowsWritten 0
```

The permanent deploy workflow runs verification only on pull requests. Main pushes and manual dispatch may deploy using GitHub repository secrets. No direct D1 execute, public DDL endpoint, backfill, generation, retention extension, new cron, category capture, exact-session claim, or cross-provider analytics is included.

## Current 12A-3 boundary

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
```

The blockers `remote_schema_not_applied` and `collector_worker_deployment_not_evidenced` are closed. Do not start production rollup writes until the remaining account-wide storage and execution-cost gates pass.

Do not add:

```text
backfill
runtime rollup generation before gate acceptance
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
