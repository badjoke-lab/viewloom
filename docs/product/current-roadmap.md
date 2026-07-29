# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on five-minute collectors.
- Twitch recovery and v33 canonical synchronization completed.
- Dormant replacement runner, SQL-scope repair, checkpoint package, and checkpoint execution path accepted.
- Checkpoint run `30478338654` executed read-only and failed three data gates.
- Checkpoint evidence was frozen and the temporary path retired.
- Failure diagnosis package PR #670 merged as `7f8e2d5adeec187a194aefc8fb2b239d05c5318a`.
- Package validation run/job `30481973791` / `90678071929` passed all static, policy, build, and public-containment checks.
- Failure diagnosis package acceptance PR #671 freezes the read-only query set and limitations.

### Current gate: one-time diagnosis execution package

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package`

The accepted diagnosis runner can determine missing-bucket presence, collector-run and snapshot context, null references by bucket/channel, post-checkpoint trends, and current collector status. It cannot distinguish empty Helix `game_id` from empty `game_name` after persistence because both source fields are stripped after categoryRef encoding.

## Active deliverable

Create and separately accept a bounded diagnosis execution package that:

- runs the accepted diagnosis runner once;
- uses D1 `SELECT` / `WITH` only;
- uses no production credentials on the package PR;
- requires a later exact one-file trigger;
- uploads sanitized evidence;
- performs no checkpoint rerun, mutation, threshold change, recovery decision, clock reset, final mode, Kick change, or public UI change.

## Following gates

1. execution-package acceptance;
2. exact diagnosis trigger;
3. one-time read-only diagnosis execution;
4. evidence freeze and temporary-path retirement;
5. separate recovery/no-recovery and stability-clock decision;
6. final audit only after that decision and the calendar boundary;
7. separate public cutover only after accepted final evidence.

## Hard boundaries

- no checkpoint rerun or threshold relaxation;
- no interpolation, backfill, row invention, or automatic clock reset;
- no Worker deployment, new cron, cadence, D1 schema, retention, Kick, final mode, cross-provider behavior, or public category UI;
- existing unfiltered Heatmap remains the fallback.

## Source of truth

- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
- `docs/operations/development-and-deployment-policy.md`
