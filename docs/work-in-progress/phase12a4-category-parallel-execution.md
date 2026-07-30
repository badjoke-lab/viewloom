# 12A-5B-R2 replacement Twitch checkpoint-failure diagnosis execution

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Canonical runtime gate remains v33.
- Checkpoint run `30478338654` completed read-only and failed.
- Trigger, checkpoint workflow, and reporter are retired.
- Failure diagnosis package PR #670 merged as `7f8e2d5adeec187a194aefc8fb2b239d05c5318a`.
- Diagnosis package validation run/job: `30481973791` / `90678071929`.
- Diagnosis package acceptance PR: #671.
- Current branch: `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package`.
- Public Twitch category-filter exposure remains unauthorized.

## Failed checkpoint gates

- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Three consecutive missing buckets: `07:20`, `07:25`, `07:30` UTC.
- Category-reference coverage: 45,039/45,287 = `0.994524`, with 248 null refs.
- Invalid refs and unresolved dictionary IDs: 0.

## Accepted diagnosis scope

- exact presence of missing bucket rows;
- collector-run and snapshot context around the gap;
- null refs by bucket and channel;
- checkpoint and post-checkpoint null-ref summaries;
- current collector status;
- static attribution from Helix `game_id` / `game_name` through the encoder;
- persisted-data limitation recorded explicitly.

## Current work order

1. Merge package acceptance PR #671.
2. Create and separately validate a one-time diagnosis execution package.
3. Accept that execution package before any production query.
4. Add an exact trigger in a separate PR and run diagnosis once.
5. Freeze sanitized diagnosis evidence and retire the temporary path.
6. Make a separate recovery/no-recovery and stability-clock decision.
7. Keep final mode and public UI blocked until the decision is accepted.

## Shared boundaries

- D1 queries are `SELECT` / `WITH` only.
- No checkpoint rerun.
- No threshold relaxation, interpolation, backfill, or row invention.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, or cross-provider change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

Before every branch and merge, read current-main roadmap, schedule, canonical gate, audit specification, checkpoint evidence, retirement record, diagnosis package contract/acceptance, active WIP, development policy, and affected feature specification/plan.
