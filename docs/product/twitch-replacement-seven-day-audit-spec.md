# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

The original replacement window is invalid and retired. No new stability start or earliest final-audit time is authorized.

- Diagnosis decision: recovery required.
- Dormant completeness package accepted in package PR #682 and package acceptance PR #684.
- Package merge: `2ae91cbf6b07616dcadc60894a832ace089c39fa`.
- Validation run/job: `30567807300` / `90956596848`.

## Accepted dormant contract

`category-source-v2-candidate` distinguishes:

- `both_present`;
- `both_empty`;
- `provider_id_only`;
- `category_name_only`.

Only `both_present` receives a category reference. The accepted package is dormant, adds no production binding, and accepts no semantic mapping.

## Current gate: Twitch-only category-source-v2 execution package

Current branch:

`work-659-twitch-category-source-v2-completeness-execution-package`

The execution package must:

- integrate the accepted candidate behind a Twitch-only disabled-by-default flag;
- preserve current v1 as default and exact rollback path;
- add no Kick import or configuration;
- define an exact one-time trigger and prohibit in-job long sleeps;
- set job timeout greater than the bounded execution, evidence, upload, and rollback envelope;
- require two consecutive real/nonempty/fresh v2 snapshots;
- collect source-state counts, provider separation, leakage, storage, and execution-cost evidence;
- use no production credentials or execution on the execution-package PR;
- require package acceptance before an exact trigger.

## Following gates

1. execution package and separate acceptance;
2. exact Twitch-only trigger and bounded execution;
3. two consecutive v2 snapshot evidence and temporary-path retirement;
4. semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and separate public cutover.

## Prohibited responses

- production execution before package acceptance and exact trigger;
- checkpoint rerun, historical backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset;
- Kick, cadence, retention, cross-provider, final-mode, or public category-filter change.
