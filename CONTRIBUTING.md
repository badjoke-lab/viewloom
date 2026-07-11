# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 binding size source merged PR #497
12A-2 production size evidence accepted PR #498
Current workstream 12A-2 empty schema migration
Schema migration authorized yes
Schema migration started no
Exact next branch work-analytics-12a2-migration
12A-3 generation authorized no
Generation blocker account_aggregate_storage_unmeasured
```

## Current permanent evidence

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
```

Accepted size evidence:

```text
Twitch current size 320.96 MB
Twitch projected size 391.95 MB
Twitch provider migration gate true

Kick current size 264.38 MB
Kick projected size 287.95 MB
Kick provider migration gate true

schemaMigrationGatePass true
accountAggregateMeasured false
generationStorageGatePass false
```

## Allowed 12A-2 migration scope

`work-analytics-12a2-migration` may add only the accepted empty provider-separated schema and indexes.

Allowed:

```text
CREATE TABLE streamer_intraday_rollups
CREATE INDEX idx_intraday_streamer_day
CREATE TABLE intraday_rollup_status
schema verification
local migration verification
provider-separated migration acceptance evidence
```

Not allowed in that branch:

```text
backfill
compact-rollup runtime generation
raw-retention extension
new high-frequency cron
category capture activation
exact-session fields or claims
cross-provider totals, rankings, baselines, categories, or relationships
```

12A-3 generation remains blocked until its storage and execution gates are accepted. The provider schema migration gate does not authorize data accumulation.

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
