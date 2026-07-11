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
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Remote schema gate blocked
Current workstream controlled remote schema apply and verification
12A-3 generation authorized no
Generation blockers remote_schema_not_applied, account_aggregate_storage_unmeasured
```

## Current permanent evidence

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

## Observed remote schema state

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

The schema is observed absent in both provider databases. Do not describe it as merely unverified.

## Allowed remote apply scope

A remote apply implementation may only:

```text
use the accepted db/d1/004_intraday_rollups.sql schema contract
apply idempotently to Twitch and Kick separately
keep generation disabled during apply
perform no backfill
perform no retention change
perform no category capture
record provider-separated apply evidence
rerun the read-only schema probe after apply
```

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
