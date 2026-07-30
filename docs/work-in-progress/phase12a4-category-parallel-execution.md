# 12A-5B-R2 replacement Twitch checkpoint-failure diagnosis trigger

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Canonical runtime gate remains v33.
- Checkpoint run `30478338654` completed read-only and failed.
- Checkpoint trigger/workflow/reporter are retired.
- Diagnosis query package/acceptance: PRs #670/#671.
- Diagnosis execution package PR #672 merged as `02ece37cc70de4faa5251600a465d4e68d058f29`.
- Execution package validation run/job: `30539504888` / `90860798797`.
- Execution package acceptance PR: #673.
- Current branch: `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`.
- Public Twitch category-filter exposure remains unauthorized.

## Failed checkpoint gates

- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Three consecutive missing buckets: `07:20`, `07:25`, `07:30` UTC.
- Category-reference coverage: 45,039/45,287 = `0.994524`, with 248 null refs.
- Invalid refs and unresolved dictionary IDs: 0.

## Accepted diagnosis execution identity

- package PR #672;
- package candidate head `c496963f03611be4e9b957e6bf99d15f0d97bad4`;
- package merge `02ece37cc70de4faa5251600a465d4e68d058f29`;
- acceptance PR #673;
- D1 statements `SELECT` / `WITH` only;
- sanitized artifact required;
- package and acceptance PR production execution: none.

## Current work order

1. Merge execution package acceptance PR #673.
2. Add exactly one trigger file with package PR #672, package merge `02ece37cc70de4faa5251600a465d4e68d058f29`, acceptance PR #673, and a bounded exact `startAt`.
3. Validate the trigger on the PR; production diagnosis remains skipped.
4. Merge the trigger and execute the accepted diagnosis once.
5. Freeze sanitized diagnosis evidence and retire trigger/workflow.
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

Before every branch and merge, read current-main roadmap, schedule, canonical gate, audit specification, checkpoint evidence, retirement record, diagnosis query package contract/acceptance, diagnosis execution package contract/acceptance and trigger contract, active WIP, development policy, and affected feature specification/plan.
