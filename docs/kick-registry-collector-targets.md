# Kick registry collector target selection

This document describes the first runtime step toward registry-backed Kick collection.

## Summary

`collector-kick` can now select channel slugs from `kick_channels` when the table exists and has usable candidate rows.

If registry selection fails or returns no rows, the collector falls back to the existing seed-list behavior.

## Selection order

```text
1. Try kick_channels registry candidates.
2. If registry returns usable slugs, use registry source.
3. If registry is missing, empty, or errors, fall back to seed-list source.
```

## Registry query

The collector reads:

```sql
SELECT slug
FROM kick_channels
WHERE status IN ('active', 'candidate', 'cooldown')
ORDER BY priority DESC, last_live_at DESC, last_checked_at ASC, slug ASC
LIMIT ?;
```

The limit uses the existing configured cap:

```text
MAX_CHANNEL_SLUGS = 220
```

The run attempt limiter remains:

```text
COLLECT_ATTEMPT_SLUGS = 75
PINNED_ATTEMPT_SLUGS = 20
FETCH_BATCH_SIZE = 10
```

## Fallback behavior

Fallback is required because production may not have `kick_channels` yet.

Fallback cases:

- table missing;
- migration not applied;
- registry empty;
- D1 query error;
- no usable slug rows.

In those cases, the collector uses the existing seed-list source.

## Metadata

Collector metadata now includes:

```text
targetSource
coverageMode
registryCandidateCount
registryError
configuredChannels
attemptedChannels
configuredChannelSlugs
attemptedChannelSlugs
```

`coverageMode` inside collector metadata can be:

```text
seed-list
registry
```

This metadata describes the collector target source for that run.

## Product status caution

Registry target selection does not mean Twitch parity.

Even with registry selection active:

- Kick is not directory coverage;
- Kick is not globally discovered;
- Kick feature density still depends on candidate quality;
- future feedback and candidate expansion are still required.

## Next required work

After this PR:

```text
1. Verify deployed collector status payload.
2. Confirm registryCandidateCount when kick_channels exists.
3. Confirm seed-list fallback when kick_channels is absent.
4. Add registry feedback updates for observed and missed slugs.
5. Update /api/kick-status to surface registry-backed collector metadata from latest snapshots.
```

## Non-goals

This change does not:

- run migration;
- import seed rows;
- add discovery;
- add curated import tooling;
- update registry feedback fields;
- claim Kick parity;
- remove seed-list fallback.
