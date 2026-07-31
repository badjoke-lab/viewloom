# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active on five-minute collectors.
- Checkpoint and diagnosis evidence are frozen; the old replacement window is retired.
- Recovery decision PR #681 requires source-completeness observation before a new clock.
- Dormant `category-source-v2-candidate` package accepted PR #682 / #684.
- Bounded Twitch-only observation execution package accepted PR #685 / #686.
- Execution-package validation run/job `30570462889` / `90965620950` passed exact-source generation, compile, Wrangler dry-run, package/policy verification, collector/web typecheck, build, deployment skip, and public containment.
- The accepted timeout envelope is 44 minutes maximum inside a 50-minute job; no `startAt` or pre-start sleep is allowed.

### Current gate: exact immediate Twitch category-source-v2 observation trigger

Current branch:

`work-659-twitch-category-source-v2-observation-trigger`

## Accepted execution package

- Package PR / acceptance PR: #685 / #686.
- Package merge: `0a8f2931524d08dae42dee302df24a30da544949`.
- Exact trigger must be a one-file PR and must execute immediately after merge.
- Two consecutive real, non-empty, fresh v2 snapshots are required.
- Canonical v1 rollback is mandatory in `finally`.
- Direct D1 statements are limited to `SELECT` / `WITH`.
- No semantic mapping, new stability clock, final mode, or public category UI is accepted.

## Active deliverable

Create the exact trigger PR that:

- changes only `docs/audits/12a5-twitch-category-source-v2-observation-trigger.json`;
- uses the accepted trigger schema, confirmation, package PR, package merge SHA, and acceptance PR;
- sets `status` to `armed`, `oneTime` to `true`, and `executeImmediately` to `true`;
- contains no `startAt`;
- performs no production execution on the pull-request event;
- starts the bounded observation only after merge to `main`.

## Following gates

1. exact Twitch-only trigger and bounded observation;
2. two consecutive v2 snapshot evidence;
3. freeze run/job/artifact/digest and retire the trigger and temporary execution path;
4. semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and separate public cutover.

## Hard boundaries

- No production observation before the accepted exact one-file trigger is merged.
- No manual dispatch, schedule, pre-start sleep, or long in-job wait.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
