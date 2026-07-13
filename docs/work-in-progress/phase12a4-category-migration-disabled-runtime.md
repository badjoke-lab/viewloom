# Phase 12A-4 category migration and disabled runtime implementation

Status: current  
Planned branch: `work-analytics-12a4-category-migration-disabled-runtime`

## Purpose

Implement the accepted provider-separated category storage design in repository code without applying it to production and without starting recurring category capture.

## Accepted inputs

```text
source contract: category-source-v1
Twitch fields: game_id / game_name
Kick fields: category.id / category.name
selected storage model: embedded_hourly
repository migration candidate: authorized
remote migration apply: unauthorized
runtime capture: unauthorized
```

## Required repository changes

```text
add a category migration candidate after db/d1/004_intraday_rollups.sql
add provider_category_dictionary
add category columns to streamer_intraday_rollups
add category coverage columns to intraday_rollup_status
add provider-separated snapshot encoding
add one set-based dictionary statement when explicitly enabled
extend the existing intraday upsert without adding generator statements
add disabled-by-default category runtime flag plumbing
add local schema, payload, rollup, coverage, idempotency, and provider-separation fixtures
```

## Runtime boundary

The implementation must remain inert unless an explicit later production-approved flag is present.

```text
no CATEGORY_CAPTURE_ENABLED value in either committed wrangler.toml
no production migration apply
no remote D1 writes from this branch
no new cron
no backfill
no raw-retention change
existing collector outcome remains authoritative
category failure may not replace a successful collector result
```

## Coverage semantics

```text
observed
missing_from_source
not_in_bounded_window
partial_source_coverage
stale
unavailable
```

The implementation must not infer offline state from absence in the bounded observation window.

## Completion gate

This workstream completes only when:

```text
migration applies locally and idempotent verification passes
disabled runtime performs zero category writes
Twitch and Kick payload contracts stay separate
category names are not repeated per raw item
existing intraday statement budget does not increase
hourly category JSON is deterministic and bounded
collector typecheck and contracts pass
production cost probe remains required
remote migration and runtime enablement remain unauthorized
```
