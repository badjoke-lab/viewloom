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
12A-2 remote schema evidence observed PR #501
12A-2 controlled apply code merged PR #502
12A-2 immediate bootstrap refinement merged PR #503
12A-2 post-bootstrap recheck observed PR #504
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Worker deployment evidence absent
Remote schema gate blocked
Current workstream collector Worker deployment evidence and remote schema verification
12A-3 generation authorized no
Generation blockers remote_schema_not_applied, collector_worker_deployment_not_evidenced, account_aggregate_storage_unmeasured
```

## Current permanent evidence

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

## Controlled apply status

Repository code now contains:

```text
provider-separated controlled bootstrap through collector D1 bindings
one immediate startup attempt per Worker isolate
warm-isolate presence cache
bounded maintenance retries at 00:20 and 12:20 UTC windows
exact accepted migration parity
public DDL endpoint absent
new cron absent
backfill absent
generation absent
```

Repository merge does not prove Worker deployment. The post-bootstrap production recheck still observed:

```text
Twitch schemaComplete false; objects 0 / 3
Kick schemaComplete false; objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

## Current deployment boundary

Current code/evidence state:

```text
controlledApplyCodeMerged true
workerDeploymentEvidencePresent false
remoteSchemaGatePass false
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
```

Current work must either deploy the collector Worker code through an authorized Cloudflare-side process or provide independent deployment evidence, then rerun the read-only schema probe.

Do not claim that repository merge equals deployment. Do not claim automatic deployment failure from the recheck alone.

Do not add:

```text
backfill
runtime rollup generation
raw-retention extension
new high-frequency cron
category capture activation
exact-session claims
cross-provider totals, rankings, baselines, categories, or relationships
```

12A-3 production generation remains blocked until remote schema verification passes and storage/execution-cost gates are accepted.

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
