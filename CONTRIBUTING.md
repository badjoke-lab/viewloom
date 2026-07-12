# Contributing to ViewLoom

## Required reading

Read the development policy, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and accepted evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and accumulation complete through PR #511
12A-4 provider-specific category source audit accepted PR #513
Production generation started yes
Current workstream 12A-4 category storage design and budget gate
Category capture runtime not started
```

## Accepted source contracts

```text
Twitch category provider id: game_id
Twitch category name: game_name
Twitch source: Helix /streams

Kick category provider id: category.id
Kick category name: category.name
Kick source: public/v1/livestreams

provider category identity equivalence: false
combined-provider category ranking: forbidden
```

## Current implementation boundary

A category storage-design PR must state:

```text
provider scope
input fields and source contract
candidate storage models
projected bytes per snapshot/day/90 days
D1 query and write estimate
retention policy
coverage and missing-field semantics
migration impact
cron impact
acceptance gate
```

It must:

```text
keep Twitch and Kick storage separate
preserve the existing */5 collector cadence
leave raw retention unchanged
avoid new high-frequency cron
perform no backfill
leave category runtime capture disabled
add no category analytics UI
retain explicit partial/missing coverage states
```

Do not infer cross-provider category identity from names. Do not add cross-provider totals, rankings, baselines, categories, or relationships.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and gate check
  -> implementation
  -> targeted checks
  -> latest-head evidence
  -> merge
  -> canonical state update
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production.
