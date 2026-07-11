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
Remote D1 schema apply unverified
Current workstream remote schema apply / verification gate before 12A-3 generation
12A-3 generation authorized no
Generation blockers account_aggregate_storage_unmeasured, remote_schema_apply_unverified
```

## Current permanent evidence

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
```

## Accepted migration boundary

Repository migration acceptance proves:

```text
schema SQL accepted
scope guard passed
local SQLite apply passed
second apply idempotency passed
exact table / PK / index shape passed
no rows inserted
forbidden DML absent
```

It does not prove:

```text
remote Twitch D1 schema applied
remote Kick D1 schema applied
runtime generation authorized
account-wide storage measured
```

Before production generation, require remote schema evidence plus accepted storage and execution-cost gates.

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
