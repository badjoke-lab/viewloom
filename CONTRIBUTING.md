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
12A-4 category migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
Production generation started yes
Current workstream 12A-4 controlled category schema apply design
Category runtime capture not started
```

## Accepted source, storage, and preflight contracts

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
repository migration candidate: implemented
disabled runtime production acceptance: complete
read-only production preflight acceptance: complete PR #523
production category schema: absent
```

## Current controlled schema apply design boundary

A controlled category schema apply design PR must state:

```text
provider scope and execution order
accepted read-only preflight PR and evidence
exact main SHA requirement for later execution
database bindings and temporary Worker names
migration parity with db/d1/005_category_capture.sql
completely absent pre-schema requirement
partial-schema stop behavior
first apply and second-pass no-op behavior
pre/post schema and database-size evidence requirements
D1 rows read/written, changes, and SQL duration
Worker wall time and collector latency delta
provider leakage threshold
temporary Worker deletion and post-delete HTTP 404
failure policy for partial provider completion
remote apply and production enablement exclusions
```

It must:

```text
keep Twitch and Kick storage separate
execute Twitch before Kick and stop after the first provider failure
preserve the existing */5 collector cadence
leave raw retention unchanged
avoid a new cron
perform no backfill
add no category analytics UI
keep CATEGORY_CAPTURE_ENABLED absent during schema apply
preserve existing rollup rows and collector state
require a second apply to execute zero schema statements
require category dictionary and reserved probe rows to remain zero during schema-only apply
require a separate evidence-bearing one-time production trigger
retain the 12-query category intraday-generator ceiling for the later bounded probe
```

It must not:

```text
deploy a production schema Worker from the design PR
apply the migration to production from the design PR
commit CATEGORY_CAPTURE_ENABLED=true to either wrangler.toml
write production category rows from the design PR
use direct wrangler d1 execute in the design PR
add an unauthenticated public DDL route
drop applied columns during incident response
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

Ordinary development uses `work-*` or an explicitly documented agent branch; deliberate runtime validation uses `preview-*`; `main` is production.
