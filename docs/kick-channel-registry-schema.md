# Kick channel registry schema

This document defines the planned `kick_channels` registry layer for ViewLoom Kick collection.

Kick currently uses seed-list coverage. That is not Twitch parity. The registry layer is the next required step before Kick can move beyond static seed attempts.

## Purpose

The registry exists to stop treating a fixed seed list as the whole Kick universe.

It should:

- store known Kick channel slugs discovered from permitted sources;
- remember which channels were recently live;
- prioritize channels that are more likely to be live or high-impact;
- down-rank channels that repeatedly fail or remain offline;
- provide the hot collector with a better target list than a hand-written seed list;
- expose enough metadata for `/api/kick-status` to explain current coverage.

## Coverage model

Current state:

```text
seed-list coverage
```

Target near-term state:

```text
registry coverage
```

Not yet available:

```text
directory coverage
```

Twitch currently uses directory-style coverage through the Twitch streams API. Kick must not be described as Twitch parity while it depends on seed-list or registry coverage.

## Table: kick_channels

Planned D1 table name:

```sql
kick_channels
```

### Columns

| Column | Type | Required | Purpose |
| --- | --- | --- | --- |
| `slug` | TEXT PRIMARY KEY | yes | Canonical Kick channel slug. Lowercase, trimmed. |
| `display_name` | TEXT | no | Last known display name. |
| `url` | TEXT | no | `https://kick.com/{slug}`. |
| `last_seen_at` | TEXT | no | Last time the channel profile was observed by any permitted source. ISO timestamp. |
| `last_live_at` | TEXT | no | Last time the collector confirmed the channel was live. ISO timestamp. |
| `last_checked_at` | TEXT | no | Last time the hot collector attempted this slug. ISO timestamp. |
| `last_viewer_count` | INTEGER | no | Last observed live viewer count. |
| `last_title` | TEXT | no | Last observed livestream title. |
| `priority` | INTEGER | yes | Collector priority. Higher means check sooner. |
| `failure_count` | INTEGER | yes | Consecutive failed/offline checks. |
| `success_count` | INTEGER | yes | Successful live observations. |
| `source` | TEXT | yes | Where the slug came from: `seed`, `observed`, `manual`, `discovery`, or `import`. |
| `status` | TEXT | yes | `candidate`, `active`, `cooldown`, `dead`, or `blocked`. |
| `notes` | TEXT | no | Human-readable operational note. No secrets. |
| `created_at` | TEXT | yes | First insertion time. ISO timestamp. |
| `updated_at` | TEXT | yes | Last registry update time. ISO timestamp. |

### Draft SQL

Do not run this until the implementation PR explicitly asks for a migration.

```sql
CREATE TABLE IF NOT EXISTS kick_channels (
  slug TEXT PRIMARY KEY,
  display_name TEXT,
  url TEXT,
  last_seen_at TEXT,
  last_live_at TEXT,
  last_checked_at TEXT,
  last_viewer_count INTEGER,
  last_title TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'seed',
  status TEXT NOT NULL DEFAULT 'candidate',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kick_channels_status_priority
ON kick_channels (status, priority DESC, last_live_at DESC, last_checked_at ASC);

CREATE INDEX IF NOT EXISTS idx_kick_channels_last_live
ON kick_channels (last_live_at DESC);

CREATE INDEX IF NOT EXISTS idx_kick_channels_last_checked
ON kick_channels (last_checked_at ASC);
```

## Status meanings

| Status | Meaning |
| --- | --- |
| `candidate` | Known slug, not yet confirmed as useful. |
| `active` | Recently live or repeatedly useful. |
| `cooldown` | Too many misses recently; check less often. |
| `dead` | Long-term no signal or invalid candidate. |
| `blocked` | Must not be fetched. Reserved for policy, abuse, or manual exclusion. |

## Source meanings

| Source | Meaning |
| --- | --- |
| `seed` | Imported from built-in seed list or `KICK_CHANNEL_SLUGS`. |
| `observed` | Found inside a successful collected payload or linked result. |
| `manual` | Added by repository/operator action. |
| `discovery` | Found by a future discovery job from a permitted source. |
| `import` | Added from a curated offline import. |

## Priority rules

Initial rule set:

```text
base priority:
active: 100
candidate: 50
cooldown: 10
dead: -100
blocked: -9999
```

Adjustments:

```text
+ min(last_viewer_count / 1000, 50)
+ 20 if live in last 24h
+ 10 if live in last 7d
- failure_count * 5
```

The exact scoring can change later. The important rule is that registry selection must be data-driven and not only static-list order.

## Collector selection plan

The future hot collector should choose targets like this:

```sql
SELECT slug
FROM kick_channels
WHERE status IN ('active', 'candidate', 'cooldown')
ORDER BY priority DESC, last_checked_at ASC
LIMIT ?;
```

Then, after each run:

- live channel found:
  - set `status='active'`;
  - update `last_live_at`, `last_seen_at`, `last_checked_at`, `last_viewer_count`, `last_title`;
  - increment `success_count`;
  - reset or reduce `failure_count`;
  - recalculate `priority`.
- offline or no usable livestream:
  - update `last_checked_at`;
  - increment `failure_count`;
  - move to `cooldown` if failure threshold is reached;
  - recalculate `priority`.
- invalid or blocked:
  - move to `dead` or `blocked` only with an explicit reason.

## Bootstrap plan

Phase 1: seed import only

- Import existing built-in seed list into `kick_channels` with `source='seed'`.
- Preserve current collector behavior as fallback.
- Status API says `coverageMode='registry'` only after collector actually reads from registry.

Phase 2: registry-backed collector

- Select targets from `kick_channels`.
- Keep built-in seed list only as a bootstrap fallback.
- Write collector metadata:
  - `coverageMode='registry'`;
  - `registryCandidates`;
  - `attemptedChannels`;
  - `observedSlugs`;
  - `missedSlugs`.

Phase 3: discovery job

- Add permitted discovery sources.
- Insert or update registry candidates.
- Never claim directory coverage unless a real live directory/listing source is used.

## Status API requirements

`/api/kick-status` must expose:

```json
{
  "coverageMode": "seed-list | registry | directory",
  "coverageModel": {
    "isTwitchParity": false,
    "isDirectoryCoverage": false
  }
}
```

Rules:

- `seed-list`: current state. Fixed/bootstrap slug candidates only.
- `registry`: registry-backed target selection exists.
- `directory`: real live directory/listing source exists.

Until directory coverage exists, `isTwitchParity` must remain `false`.

## Non-goals for this schema PR

This document does not:

- run a D1 migration;
- change the collector runtime;
- add a discovery source;
- claim Kick is complete;
- claim Kick is Twitch parity.
