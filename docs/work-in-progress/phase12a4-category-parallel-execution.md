# 12A-5B-R2 exact immediate Twitch category-source-v2 observation trigger

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Diagnosis decision: recovery required; original stability window retired.
- Dormant candidate package accepted in PRs #682/#684.
- Bounded execution package accepted in PRs #685/#686.
- Execution-package validation run/job: `30570462889` / `90965620950`.
- Current branch: `work-659-twitch-category-source-v2-observation-trigger`.
- Public Twitch category-filter exposure remains unauthorized.

## Accepted execution package

- Immediate start after exact trigger merge; no `startAt` and no pre-start sleep.
- Maximum observation: 16 minutes.
- Job timeout: 50 minutes; static maximum envelope: 44 minutes.
- Two consecutive real/non-empty/fresh v2 snapshots required.
- Canonical v1 rollback required in `finally`.
- Direct D1 statements: `SELECT` / `WITH` only.
- Package and acceptance PRs performed no production execution.

## Current work order

1. Add exactly one immediate trigger JSON bound to PRs #685/#686 and merge `0a8f2931524d08dae42dee302df24a30da544949`.
2. Confirm trigger validation succeeds and production observation is skipped on the pull-request event.
3. Merge the trigger and execute the accepted observation once.
4. Freeze sanitized evidence and retire the trigger, execution workflow, and temporary package path.
5. Decide semantic handling and the new stability clock separately.

## Boundaries

- No future `startAt` or long in-job wait.
- No production execution before the exact accepted trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, or final-mode change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.
