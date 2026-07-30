# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active on five-minute collectors.
- Checkpoint and diagnosis evidence are frozen; the original replacement window is retired.
- Recovery decision PR #681 requires source-completeness observation before a new clock.
- Dormant candidate package accepted in PRs #682/#684.
- Bounded Twitch-only observation execution package accepted in PRs #685/#686.
- Execution-package validation run/job `30570462889` / `90965620950` passed exact-source generation, generated-worker compile, Wrangler dry-run, 44-minute maximum envelope under a 50-minute job timeout, rollback verification, collector/web typecheck, build, public containment, and production-job skip.

### Current gate: exact immediate Twitch category-source-v2 observation trigger

Current branch:

`work-659-twitch-category-source-v2-observation-trigger`

## Accepted execution package

- Candidate contract: `category-source-v2-candidate`.
- Execution package/acceptance: PRs #685/#686.
- Package merge: `0a8f2931524d08dae42dee302df24a30da544949`.
- Execution begins immediately after a later exact one-file trigger; `startAt` and pre-start sleep are forbidden.
- Observation is bounded to 16 minutes and requires two consecutive real, non-empty, fresh v2 snapshots.
- Canonical v1 rollback is mandatory in `finally`.
- Direct D1 statements are `SELECT` / `WITH` only.
- Package and acceptance PRs performed no production deployment or observation.

## Active deliverable

Add exactly one trigger file that:

- binds to package PR #685, merge `0a8f2931524d08dae42dee302df24a30da544949`, and acceptance PR #686;
- uses mode `category_source_v2_observation`;
- sets `executeImmediately: true`;
- contains no `startAt`;
- changes no other file.

The pull-request event validates identity only and skips production observation. The main-push event executes the accepted observation once.

## Following gates

1. exact one-file trigger and bounded execution;
2. sanitized evidence freeze and temporary-path retirement;
3. semantic and new-clock decision;
4. seven stable days from the accepted new start;
5. final audit and separate public cutover.

## Hard boundaries

- No long in-job wait or future `startAt`.
- No production execution before the exact accepted trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
