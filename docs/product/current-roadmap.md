# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on five-minute collectors.
- Twitch recovery and canonical v33 synchronization completed.
- Read-only checkpoint run `30478338654` failed three data gates.
- Checkpoint evidence and temporary checkpoint path retirement completed in PR #669.
- Diagnosis query package/acceptance completed in PRs #670/#671.
- Diagnosis execution package/acceptance completed in PRs #672/#673.
- Exact trigger PR #678 merged as `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Diagnosis attempt 1 was cancelled before the runner executed because the job timeout expired during the in-job wait; no artifact was produced.
- Diagnosis attempt 2 completed successfully as run/job/artifact `30541697022` / `90942773349` / `8767937513`.
- Sanitized diagnosis evidence summary, artifact digest, and source evidence SHA-256 are frozen.
- Exact trigger, one-time execution workflow, and temporary reporter are retired by the evidence/retirement PR.

### Current gate: checkpoint-failure diagnosis decision

Current branch after evidence retirement:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`

## Frozen diagnosis summary

- The three historical snapshot rows and matching collector-run rows are absent from retained data.
- Surrounding `07:15` and `07:35` runs are successful and no explicit failure row exists for the missing interval.
- Checkpoint category-reference coverage was `0.994524`.
- Post-checkpoint coverage was `0.994236`, lower by `0.000288` and still below the `0.995` requirement.
- Null refs are concentrated in a bounded channel set: top 3 account for 113/248; top 10 for 188/248.
- Current collector status at diagnosis time was `ok`.
- Persistence strips category source fields, so stored null refs cannot identify whether Helix `game_id` or `game_name` was empty.

## Active deliverable

Create a decision-only PR that determines:

- whether the permanently absent rows require recovery, a stability-clock restart, or a separately bounded exception rule;
- whether null category refs are expected upstream-empty observations or a collector defect;
- whether continued coverage below `0.995` requires recovery before final mode;
- whether the stability clock stays at `2026-07-29T05:30:00.000Z`, restarts, or needs a different accepted boundary.

The decision PR performs no production mutation and does not authorize public UI.

## Following gates

1. separate diagnosis decision;
2. separately packaged recovery if required, or accepted no-recovery/clock boundary;
3. final audit only after the accepted clock rule and calendar boundary;
4. separate public cutover only after accepted final evidence.

## Hard boundaries

- Diagnosis evidence does not decide recovery automatically.
- No checkpoint rerun or threshold relaxation.
- No interpolation, backfill, row invention, or automatic clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, final mode, cross-provider behavior, or public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Source of truth

- current schedule and audit specification;
- canonical v33 gate;
- frozen checkpoint evidence and retirement;
- diagnosis query/execution contracts and acceptances;
- frozen diagnosis summary and retirement;
- active WIP and development policy.
