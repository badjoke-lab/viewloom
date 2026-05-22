# Kick coverage audit

This document fixes the current ViewLoom Kick data problem statement before additional registry work continues.

## Summary

Kick's current issue is coverage quality, not only storage structure.

- Twitch collection uses directory-style live stream collection.
- Kick collection currently uses known channel slug candidates.
- Kick does not yet have Twitch-parity discovery.
- A `kick_channels` registry is required, but it is only a candidate-management layer.

## Twitch coverage model

Twitch is not limited to a hand-written channel list.

The Twitch status surface exposes coverage concepts such as:

- latest snapshot stream count;
- covered pages;
- `hasMore`;
- partial coverage notes when more streams may exist beyond the current collection window.

## Kick coverage model

Kick currently uses seed-list coverage.

Current collector constants:

```text
MAX_CHANNEL_SLUGS = 220
COLLECT_ATTEMPT_SLUGS = 75
PINNED_ATTEMPT_SLUGS = 20
FETCH_BATCH_SIZE = 10
```

Meaning:

- at most 220 configured or built-in channel slugs are considered;
- each run attempts only 75 slugs;
- the first 20 are pinned;
- the remaining 55 rotate through the rest of the seed pool;
- a run can observe only channels from that attempted set.

This is not equivalent to Twitch live directory coverage.

## Why Kick pages can look thin

The Kick feature pages can only show rows that the collector has observed.

If the latest collector run attempts 75 known slugs and only a small number are live, then:

- Heatmap has too few tiles;
- Day Flow has sparse bands;
- Battle Lines has too few rival candidates;
- History has weak daily or weekly trend data;
- Status can be healthy while product value is still limited.

This is expected behavior under seed-list coverage, not a UI-only issue.

## Coverage labels

Use these labels consistently:

```text
seed-list coverage
registry coverage
directory coverage
```

Current Kick state:

```text
seed-list coverage
```

Near-term target:

```text
registry coverage
```

Not implemented:

```text
directory coverage
```

Do not describe Kick as complete, globally discovered, fully representative, or Twitch parity while it is seed-list or registry-only coverage.

## Registry is necessary but insufficient

The `kick_channels` registry can improve:

- target persistence;
- priority scoring;
- cooldown of weak candidates;
- promotion of recently-live slugs;
- visibility into attempted, observed, and missed slugs;
- future discovery inserts.

It does not automatically solve:

- discovering the Kick live universe;
- matching Twitch directory coverage;
- finding unknown live channels;
- making all feature pages dense enough.

## Required next work

### 1. Measure the current gap

Record:

- configured channel count;
- attempted channel count;
- latest observed channel count;
- latest stream count;
- latest total viewers;
- source mode;
- coverage mode;
- default seed count;
- max channel slugs;
- max attempted slugs;
- observed slugs;
- missed slugs.

### 2. Compare Twitch and Kick honestly

| Area | Twitch | Kick current |
| --- | --- | --- |
| Input universe | live directory-style API | known slug candidates |
| Coverage mode | directory-like | seed-list |
| Per-run target set | API page coverage | 75 attempted slugs |
| Unknown live channels | can appear through directory | invisible unless in seed or registry |
| UI density risk | lower | high |

### 3. Expand Kick candidates

Candidate expansion must be planned separately from seed import.

Possible future source classes:

- curated manual imports;
- previously observed slugs;
- permitted public listing sources;
- offline curated lists;
- operator-provided candidate CSV or JSON;
- future discovery job outputs.

### 4. Add registry feedback loop

After registry selection exists, collector runs should update registry state:

- observed live: update `active`, `last_live_at`, `last_viewer_count`, and `success_count`;
- missed or offline: update `last_checked_at`, increment `failure_count`, and possibly move to `cooldown`;
- invalid or blocked: mark status with notes instead of deleting silently.

### 5. Re-evaluate feature pages after coverage improves

Check:

- Kick Heatmap tile count and distribution;
- Kick Day Flow band density;
- Kick Battle Lines rival candidates;
- Kick History daily archive usefulness.

## Immediate development order

```text
PR-173 Kick coverage audit
PR-174 Twitch vs Kick coverage comparison and status copy alignment
PR-175 Kick candidate expansion plan
PR-176 kick_channels migration and import runbook
PR-177 seed import and registry row verification
PR-178 registry-backed collector selection
PR-179 registry feedback loop
PR-180 feature-page QA after improved Kick coverage
```

## Non-goals

This audit does not:

- run D1 migrations;
- execute seed import SQL;
- change collector runtime;
- claim Kick is fixed;
- claim Kick is Twitch parity;
- add discovery;
- change UI behavior.

## Acceptance criteria

This audit is accepted when the repository clearly states:

- current Kick coverage is seed-list coverage;
- current Kick per-run attempts are limited;
- the current candidate universe can be too small for product-quality pages;
- registry is a candidate-management layer, not discovery by itself;
- discovery or candidate expansion is required before Kick can approach Twitch parity.
