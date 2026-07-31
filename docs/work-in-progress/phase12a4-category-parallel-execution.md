# 12A-5B-R2 exact Twitch category-source-v2 observation trigger

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Diagnosis decision: recovery required; original stability window retired.
- Dormant package accepted: PR #682 / #684.
- Observation execution package accepted: PR #685 / #686.
- Execution-package validation run/job: `30570462889` / `90965620950`.
- Current branch: `work-659-twitch-category-source-v2-observation-trigger`.
- Public Twitch category-filter exposure remains unauthorized.

## Accepted execution package

- Temporary Worker source is generated from exact active/candidate blobs.
- Candidate config keeps the canonical Worker name, Twitch D1 binding, category capture, intraday generation, and five-minute cron.
- Observation requires two consecutive real, non-empty, fresh v2 snapshots within 16 minutes.
- Canonical v1 rollback runs in `finally`.
- Job timeout 50 minutes exceeds the 44-minute static maximum envelope.
- `startAt`, pre-start sleep, manual dispatch, and schedules are forbidden.

## Current work order

1. Add exactly one accepted trigger file.
2. Bind it to package PR #685, merge `0a8f2931524d08dae42dee302df24a30da544949`, and acceptance PR #686.
3. Keep `executeImmediately: true` and omit `startAt`.
4. Merge the exact one-file PR to start the bounded observation.
5. Freeze evidence and retire the trigger and temporary execution path separately.
6. Decide semantic handling and the new stability clock separately.

## Boundaries

- No production observation before the exact accepted trigger is merged.
- No Kick import or binding.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
