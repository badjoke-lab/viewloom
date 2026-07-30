# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on five-minute collectors.
- Twitch recovery and v33 canonical synchronization completed.
- Checkpoint run `30478338654` executed read-only and failed three data gates.
- Frozen result: slot coverage 151/154 = `0.980519`; missing buckets `07:20`, `07:25`, `07:30` UTC; category-reference coverage 45,039/45,287 = `0.994524`, with 248 null refs.
- Checkpoint evidence was frozen and the temporary checkpoint path retired.
- Diagnosis query package/acceptance completed in PRs #670/#671.
- Diagnosis execution package PR #672 merged as `02ece37cc70de4faa5251600a465d4e68d058f29`.
- Execution package validation run/job `30539504888` / `90860798797` passed trigger-absence, package, policy, typecheck, build, and public-containment gates.
- Execution package acceptance PR #673 freezes the exact package identity and trigger contract.

### Current gate: exact diagnosis trigger

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`

## Active deliverable

Add exactly one trigger file that:

- uses package PR #672;
- uses package merge `02ece37cc70de4faa5251600a465d4e68d058f29`;
- uses acceptance PR #673;
- sets a bounded exact `startAt`;
- passes trigger validation on the PR while production diagnosis remains skipped;
- performs no other file change.

After trigger merge, run the accepted diagnosis runner once, upload sanitized evidence, freeze run/job/artifact/digest, and retire trigger/workflow in a separate PR.

## Following gates

1. exact diagnosis trigger;
2. one-time read-only diagnosis execution;
3. evidence freeze and temporary-path retirement;
4. separate recovery/no-recovery and stability-clock decision;
5. final audit only after that decision and the calendar boundary;
6. separate public cutover only after accepted final evidence.

## Hard boundaries

- no checkpoint rerun or threshold relaxation;
- no interpolation, backfill, row invention, or automatic clock reset;
- no Worker deployment, new cron, cadence, D1 schema, retention, Kick, final mode, cross-provider behavior, or public category UI;
- existing unfiltered Heatmap remains the fallback.

## Source of truth

- current schedule and audit specification;
- canonical v33 gate;
- frozen checkpoint evidence and retirement;
- diagnosis query package contract/acceptance;
- diagnosis execution package contract/acceptance and trigger contract;
- active WIP and development policy.
