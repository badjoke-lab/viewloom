# Kick registry feedback loop

This document describes the first feedback loop for `kick_channels` after registry-backed target selection.

## Summary

When `collector-kick` uses registry-selected targets, it now writes feedback back to `kick_channels`.

This feedback only runs when the target source is:

```text
registry
```

If the collector falls back to seed-list mode, registry rows are not updated.

## Observed live slugs

For observed live streams, the collector updates:

- `display_name`
- `url`
- `last_seen_at`
- `last_live_at`
- `last_checked_at`
- `last_viewer_count`
- `last_title`
- `status`
- `success_count`
- `failure_count`
- `priority`
- `updated_at`

Observed live candidates move to:

```text
active
```

unless already marked:

```text
blocked
dead
```

## Missed slugs

For attempted slugs that are not observed live, the collector updates:

- `last_checked_at`
- `failure_count`
- `status`
- `priority`
- `updated_at`

After repeated misses, candidates can move to:

```text
cooldown
```

Blocked and dead rows remain unchanged by status promotion/demotion logic.

## Metadata

Collector metadata includes:

```text
registryFeedback.applied
registryFeedback.observedUpdated
registryFeedback.missedUpdated
registryFeedback.error
```

This lets status/debug surfaces confirm whether feedback ran.

## Safety

Feedback is best-effort.

If feedback update fails:

- collection still completes;
- snapshot writing still proceeds when streams exist;
- error is reported in collector metadata;
- no secret values are included in the error text.

## Non-goals

This feedback loop does not:

- add discovery;
- add curated import tooling;
- remove seed-list fallback;
- claim Kick parity;
- claim directory coverage;
- optimize final scoring permanently.

## Next work

Next work should verify deployed collector metadata and then surface registry feedback clearly in `/api/kick-status` and `/kick/status/`.
