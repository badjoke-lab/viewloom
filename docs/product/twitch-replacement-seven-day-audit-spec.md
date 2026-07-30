# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

The original replacement window is invalid and retired. No new stability start or earliest final-audit time is authorized.

- Diagnosis decision: recovery required.
- Dormant candidate package accepted in PRs #682/#684.
- Bounded observation execution package accepted in PRs #685/#686.
- Execution package merge: `0a8f2931524d08dae42dee302df24a30da544949`.
- Validation run/job: `30570462889` / `90965620950`.

## Accepted execution contract

- Twitch-only candidate deployment after an exact accepted trigger.
- Immediate start; `startAt` and pre-start sleep are forbidden.
- Maximum observation: 16 minutes.
- Static execution maximum: 44 minutes; job timeout: 50 minutes.
- Two consecutive real/non-empty/fresh `category-source-v2-candidate` snapshots required.
- Canonical v1 rollback required in `finally`.
- Direct D1 statements limited to `SELECT` / `WITH`.
- No production execution occurred on package or acceptance PRs.

## Current gate: exact immediate Twitch category-source-v2 observation trigger

Current branch:

`work-659-twitch-category-source-v2-observation-trigger`

The trigger PR must change exactly one file, bind to PRs #685/#686 and merge `0a8f2931524d08dae42dee302df24a30da544949`, set `executeImmediately: true`, and contain no `startAt`.

The pull-request event validates trigger identity only. Production observation runs only on the trigger merge push to main.

## Following gates

1. exact trigger and bounded observation execution;
2. sanitized evidence freeze and temporary-path retirement;
3. semantic and new-clock decision;
4. seven stable days from the accepted new start;
5. final audit and separate public cutover.

## Prohibited responses

- future `startAt` or long in-job wait;
- execution before accepted package identity and exact trigger;
- checkpoint rerun, historical backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset;
- Kick, cadence, retention, cross-provider, final-mode, or public category-filter change.
