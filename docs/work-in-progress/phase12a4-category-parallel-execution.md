# 12A-5B-R2 Twitch category-source-v2 completeness recovery package

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Diagnosis evidence is frozen; one-time diagnosis paths are retired.
- Diagnosis decision: recovery required.
- Original stability start `2026-07-29T05:30:00.000Z` and earliest audit `2026-08-05T05:30:00.000Z` are retired.
- Current branch after decision: `work-659-twitch-category-source-v2-completeness-recovery-package`.
- Public Twitch category-filter exposure remains unauthorized.

## Why recovery is required

- Three consecutive missing rows exceed the accepted maximum of two and cannot be reconstructed.
- Category-reference coverage remained below `0.995`: `0.994524` at checkpoint and `0.994236` afterward.
- v1 persistence removes `game_id` and `game_name`, so the precise missing-source cause cannot be recovered historically.

## Current work order

1. Implement a dormant `category-source-v2-candidate` for Twitch only.
2. Preserve per-item source state before stripping fields: `both_present`, `both_empty`, `provider_id_only`, `category_name_only`.
3. Add compact payload encoding, counters, unit tests, storage/cost checks, provider separation, and rollback-safe configuration.
4. Package PR performs no production execution.
5. Accept and execute separately, then freeze two consecutive real/nonempty/fresh snapshots.
6. Decide semantic handling and a new stability start separately.

## Boundaries

- No checkpoint rerun, backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, or cross-provider change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.
