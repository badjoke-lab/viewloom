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
12A-4 provider-specific category storage design accepted PR #514
Production generation started yes
Current workstream 12A-4 category migration and disabled runtime implementation
Category runtime capture not started
```

## Accepted source and storage contracts

```text
Twitch category provider id: game_id
Twitch category name: game_name
Twitch source: Helix /streams

Kick category provider id: category.id
Kick category name: category.name
Kick source: public/v1/livestreams

selected category storage model: embedded_hourly
category contract version: category-source-v1
provider category identity equivalence: false
combined-provider category ranking: forbidden
```

## Current implementation boundary

A category migration and disabled-runtime PR must state:

```text
provider scope
migration objects and columns
migration idempotency strategy
raw category encoding
provider dictionary write contract
hourly category rollup contract
coverage and missing-field semantics
disabled-by-default runtime flag behavior
collector failure-containment behavior
statement and changed-row budget
local fixture and acceptance gates
remote apply and production enablement exclusions
```

It must:

```text
keep Twitch and Kick storage separate
preserve the existing */5 collector cadence
leave raw retention unchanged
avoid a new cron
perform no backfill
add no category analytics UI
retain explicit observed/missing/partial/unavailable states
keep category runtime capture disabled without an explicit later production-approved flag
preserve the existing collector result if category processing fails
add no extra intraday-generator statement
require a later production execution-cost probe
```

It must not:

```text
apply the migration to production
commit CATEGORY_CAPTURE_ENABLED=true to either wrangler.toml
write production category rows from the implementation PR
use direct wrangler d1 execute
add a public DDL route
claim exact category switch times or exact sessions
infer offline state from absence in the bounded window
merge category identity across providers
create combined-provider category totals or rankings
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
