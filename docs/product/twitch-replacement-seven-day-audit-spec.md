# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

The original replacement window is invalid and retired. No new stability start or earliest final-audit time is authorized.

- Diagnosis decision: recovery required.
- Dormant completeness package accepted in PR #682 / #684.
- Bounded observation execution package accepted in PR #685 / #686.
- Execution package merge: `0a8f2931524d08dae42dee302df24a30da544949`.
- Execution-package validation run/job: `30570462889` / `90965620950`.

## Accepted observation contract

The accepted package:

- generates an exact-source Twitch-only temporary Worker;
- preserves v1 as the canonical default and rollback path;
- enables `category-source-v2-candidate` only in the temporary observation config;
- requires two consecutive real, non-empty, fresh snapshots;
- polls for at most 16 minutes;
- requires canonical rollback in `finally`;
- limits direct D1 statements to `SELECT` / `WITH`;
- uses a 50-minute job for a statically bounded 44-minute maximum envelope;
- forbids `startAt`, pre-start sleep, manual dispatch, and schedules.

## Current gate: exact immediate Twitch category-source-v2 observation trigger

Current branch:

`work-659-twitch-category-source-v2-observation-trigger`

The trigger PR must:

- change exactly `docs/audits/12a5-twitch-category-source-v2-observation-trigger.json`;
- use schema `viewloom-12a5-twitch-category-source-v2-observation-trigger-v1`;
- set `status: armed`, `provider: twitch`, `mode: category_source_v2_observation`, `oneTime: true`, and `executeImmediately: true`;
- use confirmation `RUN_TWITCH_CATEGORY_SOURCE_V2_OBSERVATION`;
- bind package PR #685, package merge `0a8f2931524d08dae42dee302df24a30da544949`, and acceptance PR #686;
- contain no `startAt`;
- perform no production observation on the pull-request event;
- start observation only after merge to `main`.

## Following gates

1. exact Twitch-only trigger and bounded execution;
2. two consecutive v2 snapshot evidence;
3. freeze run/job/artifact/digest and retire the trigger and temporary execution path;
4. semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and separate public cutover.

## Prohibited responses

- production observation before the accepted exact trigger merge;
- manual dispatch, schedule, pre-start sleep, or long in-job wait;
- checkpoint rerun, historical backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset;
- Kick, cadence, retention, cross-provider, final-mode, or public category-filter change.
