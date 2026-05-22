# Kick registry seed import plan

This document defines how the existing Kick seed candidates should be imported into the future `kick_channels` registry.

This is a planning document only. It does not run a migration, write to D1, or change collector runtime behavior.

## Purpose

The current Kick collector is seed-list coverage only. The next step is to move those seed candidates into a D1-backed registry so the collector can eventually select targets from data instead of static array order.

The goal is not to claim Twitch parity. The goal is to create the first controlled bridge from:

```text
seed-list coverage
```

to:

```text
registry coverage
```

## Source inputs

Initial import sources:

1. `DEFAULT_KICK_SEED_SLUGS` from `workers/collector-kick/src/kick-seed-slugs.ts`.
2. Optional `KICK_CHANNEL_SLUGS` environment candidates, if an explicit import command is later given access to them.

For the first repository script, use only the built-in seed list unless the script is explicitly designed to accept an additional comma-separated input.

## Target table

Target D1 table:

```text
kick_channels
```

The table is defined in:

```text
docs/kick-channel-registry-schema.md
workers/collector-kick/migrations/0001_create_kick_channels.sql
```

## Import row defaults

Each seed slug should be inserted with these defaults:

| Column | Initial value |
| --- | --- |
| `slug` | normalized lowercase slug |
| `display_name` | `NULL` initially |
| `url` | `https://kick.com/{slug}` |
| `last_seen_at` | import timestamp |
| `last_live_at` | `NULL` initially |
| `last_checked_at` | `NULL` initially |
| `last_viewer_count` | `NULL` initially |
| `last_title` | `NULL` initially |
| `priority` | calculated initial priority |
| `failure_count` | `0` |
| `success_count` | `0` |
| `source` | `seed` |
| `status` | `candidate` |
| `notes` | `imported from built-in seed list` |
| `created_at` | import timestamp |
| `updated_at` | import timestamp |

## Slug normalization

Normalize before insert:

```text
trim
lowercase
remove empty values
dedupe while preserving first occurrence
```

Invalid slugs should be skipped rather than inserted.

Initial validation rule:

```text
^[a-z0-9_][a-z0-9_.-]{1,63}$
```

This rule can be relaxed later if real Kick slugs require it.

## Initial priority

Use a simple deterministic priority so the first registry-backed collector behaves predictably.

Recommended initial priority:

```text
priority = max(1, 1000 - index)
```

Where `index` is the slug position after normalization and dedupe.

This preserves the curated seed order while still storing priority in the registry.

Do not use random priority for the first import.

## Upsert behavior

The import script should be idempotent.

For an existing `slug`:

- do not overwrite `last_live_at`;
- do not overwrite `last_checked_at`;
- do not reset `failure_count`;
- do not reset `success_count`;
- do update `url` if missing;
- do update `source` only if empty;
- do update `priority` only if current priority is `NULL` or `0`;
- do update `updated_at`;
- keep `status` unless it is empty.

For a new `slug`:

- insert the default row values above.

## Expected script behavior

The future seed import script should:

1. read `DEFAULT_KICK_SEED_SLUGS`;
2. optionally merge additional slugs passed through a CLI argument;
3. normalize and dedupe;
4. validate slugs;
5. generate SQL insert/upsert statements or execute directly through D1;
6. print a summary:
   - raw count;
   - normalized count;
   - skipped count;
   - inserted count;
   - updated count;
   - duplicate count.

## Verification queries

After the real import is implemented and run, verify with:

```sql
SELECT source, status, COUNT(*) AS rows
FROM kick_channels
GROUP BY source, status
ORDER BY source, status;
```

```sql
SELECT slug, priority, status, source, created_at, updated_at
FROM kick_channels
ORDER BY priority DESC
LIMIT 20;
```

```sql
SELECT COUNT(*) AS total_candidates
FROM kick_channels
WHERE status IN ('candidate', 'active', 'cooldown');
```

## Collector transition rule

Do not change `/api/kick-status` from:

```text
coverageMode = seed-list
```

to:

```text
coverageMode = registry
```

until all of the following are true:

1. `kick_channels` exists in production D1.
2. Seed import has inserted candidates.
3. The collector selects attempted slugs from `kick_channels`.
4. Collector metadata includes registry counts.
5. A production run writes a valid snapshot from registry-selected slugs.

## Non-goals

This plan does not:

- run the migration;
- import seed rows;
- change collector target selection;
- add discovery;
- claim directory coverage;
- claim Kick is Twitch parity.

## Next PRs

Recommended next sequence:

```text
#171 add seed import script
#172 run kick_channels migration under explicit operator command
#173 run seed import and verify registry rows
#174 update collector to read targets from kick_channels
```