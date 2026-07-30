# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

The original replacement window beginning `2026-07-29T05:30:00.000Z` is invalid and retired. No new stability start or earliest final-audit time is authorized yet.

Decision authority:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json`

## Evidence chain

- Checkpoint run `30478338654` failed: slot coverage 151/154, three consecutive missing buckets, category-reference coverage `0.994524`.
- Diagnosis run `30541697022` attempt 2, job `90942773349`, artifact `8767937513` succeeded read-only.
- Post-checkpoint category-reference coverage was `0.994236`, still below the accepted `0.995` requirement.
- Diagnosis evidence and temporary-path retirement merged in PR #680.

## Accepted decision

- The three historical missing rows are permanently absent and may not be recreated.
- The original seven-day window cannot pass the accepted maximum-consecutive-gap rule.
- Continued category-reference coverage below `0.995` prevents final mode.
- Persisted v1 rows cannot distinguish empty Twitch `game_id` from empty `game_name`.
- Recovery is required; backfill, threshold relaxation, synthetic category mapping, and automatic clock reset are not authorized.

## Current gate: Twitch category-source-v2 completeness recovery package

Current branch:

`work-659-twitch-category-source-v2-completeness-recovery-package`

The dormant package must preserve exact pre-strip source completeness for each Twitch item using:

- `both_present`;
- `both_empty`;
- `provider_id_only`;
- `category_name_only`.

It must emit compact state evidence, source-state counts, valid refs, partial-pair counts, both-empty counts, provider leakage, storage impact, and execution cost. It must not execute production changes on the package PR and must not alter Kick or public UI.

## Following gates

1. dormant implementation and package validation;
2. separate acceptance and Twitch-only execution;
3. two consecutive real/nonempty/fresh post-activation snapshots;
4. separate semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and separate public cutover.

## Prohibited responses

- checkpoint rerun, historical backfill, row invention, threshold relaxation, or automatic clock reset;
- mapping missing source fields to a synthetic category without separate acceptance;
- Worker/D1/binding/cadence/retention/Kick mutation on the dormant package PR;
- final mode or public category-filter exposure.
