# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and accepted evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design and migration accepted through PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
12A-3 execution-cost gate accepted PR #508
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Account D1 databases measured 8 / 8
Generation storage gate pass
Generation execution-cost gate pass
Current workstream 12A-3 bounded production generator implementation
Production generation started no
Remaining implementation boundary bounded_generator_not_implemented
```

## Permanent evidence

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

## Accepted execution boundary

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true
implementationAuthorized true
generationAuthorized false
runtimeGenerationStarted false

Twitch aggregate D1 duration / wall 790.730 / 1368 ms
Twitch full-cap write wall projection 5040 ms
Kick aggregate D1 duration / wall 426.097 / 788 ms
Kick full-cap write wall projection 1848 ms

idempotent second pass true
probe rows retained 0
temporary Workers retained no
```

A new branch may implement bounded provider-specific generation behind the two existing maintenance windows. The implementation must:

```text
preserve Twitch/Kick binding separation
run after the existing collector handler
use idempotent upserts
contain analytics failure without changing collector outcome
record rows_read, rows_written, SQL duration, Worker duration, generated rows, and source support
add no new cron
perform no backfill
leave runtime generation disabled until implementation acceptance
```

Do not add raw-retention extension, category capture activation, exact-session claims, direct D1 execute, public DDL routes, or cross-provider totals, rankings, baselines, categories, or relationships.

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
