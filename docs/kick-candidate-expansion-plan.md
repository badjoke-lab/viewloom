# Kick candidate expansion plan

This document defines how ViewLoom should expand Kick candidate coverage before relying on registry-backed collection as a product-quality surface.

## Purpose

Kick currently uses seed-list coverage. The next useful step is not only moving existing seeds into `kick_channels`, but increasing and improving the candidate universe.

The goal is to move from:

```text
small static seed list
```

to:

```text
larger curated candidates + registry feedback + future permitted discovery
```

This still does not claim Twitch parity. Directory coverage remains a separate future capability.

## Current limitation

The current Kick collector can only observe known channel slugs.

Current collector limits:

```text
MAX_CHANNEL_SLUGS = 220
COLLECT_ATTEMPT_SLUGS = 75
PINNED_ATTEMPT_SLUGS = 20
FETCH_BATCH_SIZE = 10
```

A larger registry helps only if it is fed by useful candidates and updated by observed results.

## Candidate source classes

### 1. Built-in seed list

Current source:

```text
workers/collector-kick/src/kick-seed-slugs.ts
```

Role:

- bootstrap source only;
- not the final Kick universe;
- should be imported into `kick_channels` with `source='seed'`.

### 2. Operator-provided import

A local CSV, JSON, or newline list can be used for curated imports.

Allowed shape:

```json
[
  { "slug": "example", "displayName": "Example", "source": "manual" }
]
```

Minimum validation:

- normalize slug to lowercase;
- trim whitespace;
- dedupe;
- reject empty values;
- reject invalid slug characters;
- do not overwrite useful live history;
- record source and notes.

Role:

- fastest zero-budget way to expand candidates;
- useful before discovery is implemented;
- should not be described as global discovery.

### 3. Previously observed slugs

Every successful collection should keep observed live slugs in the registry.

Role:

- preserve channels that were actually live;
- raise priority for recently-live channels;
- avoid losing good candidates when seed order changes.

### 4. Missed slug feedback

Every attempted but non-live slug should update registry metadata.

Role:

- increment failure count;
- update last checked time;
- reduce priority after repeated misses;
- move weak candidates to cooldown;
- prevent repeatedly wasting attempts on poor candidates.

### 5. Future permitted discovery sources

Possible future source classes:

- permitted public listing pages if allowed and stable;
- curated offline lists;
- operator-reviewed imports;
- links found from already observed channel metadata if permitted;
- other safe, documented sources.

No discovery source should be added until its permissions, stability, and rate behavior are documented.

## Disallowed source behavior

Do not add candidate sources that require:

- scraping private user data;
- bypassing access controls;
- using paid APIs;
- storing secrets in generated files;
- hiding source mode from Status;
- claiming directory coverage when only imports or seed lists exist.

## Registry field use

The `kick_channels` table should support candidate expansion through:

| Field | Use |
| --- | --- |
| `slug` | canonical candidate key |
| `display_name` | last known display name |
| `url` | public channel URL |
| `last_seen_at` | last time the candidate was found by any source |
| `last_live_at` | last successful live observation |
| `last_checked_at` | last collector attempt |
| `last_viewer_count` | last observed live viewer count |
| `priority` | target selection ranking |
| `failure_count` | consecutive weak/offline attempts |
| `success_count` | successful live observations |
| `source` | seed, manual, observed, discovery, import |
| `status` | candidate, active, cooldown, dead, blocked |
| `notes` | safe operator note, no secrets |

## Candidate lifecycle

```text
candidate -> active -> cooldown -> active
candidate -> cooldown -> dead
any state -> blocked by explicit operator decision
```

### candidate

Known slug that has not yet proved useful.

### active

Recently live or repeatedly useful.

### cooldown

Repeatedly missed or offline. Checked less often.

### dead

Invalid or long-term weak candidate. Should not be deleted silently.

### blocked

Manually excluded. Requires a note.

## Priority model

Initial priority can preserve seed order:

```text
priority = max(1, 1000 - index)
```

After registry-backed collection starts, priority should become dynamic:

```text
base by status
+ recent live bonus
+ viewer count bonus
+ success count bonus
- failure count penalty
- stale checked penalty when needed
```

Suggested first dynamic model:

```text
active: 1000
candidate: 500
cooldown: 100
dead: -1000
blocked: -9999

+ min(last_viewer_count / 100, 200)
+ 200 if live in last 24h
+ 100 if live in last 7d
+ min(success_count * 10, 100)
- min(failure_count * 25, 300)
```

The exact scoring can change. The key requirement is that selection must stop being static-list order only.

## Collector selection stages

### Stage A: current seed-list collector

Current state.

- Reads configured and built-in slugs.
- Attempts a limited rotating subset.
- Writes observed streams into `minute_snapshots`.
- Status says `coverageMode='seed-list'`.

### Stage B: registry import

- Create `kick_channels`.
- Import built-in seed slugs.
- Optionally import curated operator-provided candidates.
- Status still says `coverageMode='seed-list'` until collector reads registry.

### Stage C: registry-backed collector

- Select attempts from `kick_channels`.
- Update registry after each run.
- Write collector metadata with registry counts.
- Status can say `coverageMode='registry'` after production snapshot is written from registry-selected slugs.

### Stage D: candidate expansion

- Add import tooling for curated lists.
- Add previously observed feedback.
- Add safe discovery sources only after source review.

### Stage E: page QA

- Re-check Kick Heatmap, Day Flow, Battle Lines, and History after observed stream counts improve.

## Verification metrics

Track these metrics before and after expansion:

```text
registry total rows
active rows
candidate rows
cooldown rows
dead rows
blocked rows
attempted slugs per run
observed slugs per run
missed slugs per run
stream_count per snapshot
total_viewers per snapshot
source_mode distribution
coverageMode
```

Minimum useful improvement target for seed/registry phase:

- more configured candidates than current static cap;
- higher observed slug count across a full day;
- fewer repeated misses against the same weak candidates;
- Status clearly shows attempted, observed, and missed candidate counts.

This still does not equal directory coverage.

## Implementation order

```text
PR-175 candidate expansion plan
PR-176 migration and import runbook
PR-177 seed import verification
PR-178 registry-backed collector selection
PR-179 registry feedback loop
PR-180 curated candidate import tool
PR-181 Kick feature QA after expanded candidates
```

## Non-goals

This plan does not:

- run a D1 migration;
- execute import SQL;
- add a discovery source;
- change collector runtime;
- claim Kick parity;
- claim global coverage;
- add paid services.
