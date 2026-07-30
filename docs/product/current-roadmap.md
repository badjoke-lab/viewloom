# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on five-minute collectors.
- Twitch recovery and canonical v33 synchronization completed.
- Read-only checkpoint run `30478338654` failed three data gates.
- Checkpoint evidence and temporary checkpoint path retirement completed in PR #669.
- Diagnosis query package/acceptance completed in PRs #670/#671.
- Diagnosis execution package/acceptance completed in PRs #672/#673.
- Exact trigger PR #678 merged as `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- One-time read-only diagnosis evidence is frozen.
- Exact trigger, one-time execution workflow, and temporary reporter are retired.

### Current gate: checkpoint-failure diagnosis decision

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`

## Active deliverable

Create a decision-only PR that reads the frozen diagnosis evidence and decides:

- whether the three historical missing bucket rows were permanently absent;
- whether collector-run context proves a bounded cause;
- whether null category refs are expected upstream-empty observations or a collector defect;
- whether post-checkpoint behavior is stable;
- whether recovery is required;
- whether the stability clock stays at `2026-07-29T05:30:00.000Z`, restarts, or needs a separately defined bounded rule.

The decision PR performs no production mutation and does not authorize public UI.

## Following gates

1. separate diagnosis decision;
2. separately packaged recovery if required, or accepted no-recovery boundary;
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
- frozen diagnosis evidence and retirement;
- active WIP and development policy.
