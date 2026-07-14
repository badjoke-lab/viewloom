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
Production generation started yes
Current workstream 12A-4 production category execution-cost probe
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
repository migration candidate: implemented
disabled runtime production acceptance: complete
production category schema: absent
```

## Current execution-cost planning boundary

A category execution-cost planning PR must state:

```text
provider scope
accepted starting PRs and evidence
database bindings
read-only preflight contract
controlled migration order
pre/post schema and size measurements
D1 rows read/written, changes, and SQL duration
Worker wall time and collector latency delta
dictionary first-pass and unchanged-name second-pass behavior
category generator query ceiling
failure containment
probe cleanup and temporary Worker deletion
acceptance thresholds and stop conditions
rollback and disable procedure
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
keep CATEGORY_CAPTURE_ENABLED absent during planning and schema preflight
preserve the existing collector result if category processing fails
retain the 12-query category intraday-generator ceiling
use reserved, fully removable probe rows for local or explicitly authorized probes
require a separate evidence-bearing production gate
```

It must not:

```text
deploy a production probe from the planning PR
apply the migration to production
commit CATEGORY_CAPTURE_ENABLED=true to either wrangler.toml
write production category rows from the planning PR
use direct wrangler d1 execute in the planning PR
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

Ordinary development uses `work-*` or an explicitly documented agent branch; deliberate runtime validation uses `preview-*`; `main` is production.
