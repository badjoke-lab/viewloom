# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659  
Canonical start under decision: `2026-07-29T05:30:00.000Z`  
Earliest calendar final boundary before decision: `2026-08-05T05:30:00.000Z`

## Purpose

Govern the replacement Twitch category accumulation audit without exposing public category controls or mutating production data.

## Accepted history

- Recovery accepted in PR #657; canonical v33 synchronized in PR #658.
- Runner, repair, checkpoint package, and exact checkpoint trigger completed through PRs #661–#667.
- Checkpoint run `30478338654` failed; evidence/retirement merged in PR #669.
- Diagnosis query package/acceptance completed through PRs #670/#671.
- Diagnosis execution package/acceptance completed through PRs #672/#673.
- Exact diagnosis trigger PR #678 merged as `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Diagnosis attempt 1 was cancelled before the runner executed because the 60-minute job timeout expired during the in-job wait.
- The same accepted diagnosis job was retried as run attempt 2 after `startAt` had passed; the wait became zero, the read-only runner completed, and sanitized evidence was uploaded.
- The evidence/retirement PR freezes the result and removes the trigger, execution workflow, and temporary reporter.

## Checkpoint execution and result

- slot coverage 151/154 = `0.980519`, required `0.995`;
- three consecutive missing slots at `07:20`, `07:25`, `07:30` UTC;
- category-reference coverage 45,039/45,287 = `0.994524`, with 248 null references;
- invalid refs and unresolved dictionary IDs: 0.

## Frozen diagnosis evidence

Authorities:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json`

Execution identity:

- run/attempt/job/artifact: `30541697022` / `2` / `90942773349` / `8767937513`;
- artifact digest: `sha256:02cedcb6c23c6792b55c96bb4326bc24ba8d7a79880df634d8a1f98e29d02ac5`;
- source evidence JSON SHA-256: `372dc6c434830ec1ce3630b4146b29510010f0602c1a49b1b0d2fc038842236c`.

Attempt 1 identity:

- diagnose job `90867816146`;
- cancelled before the diagnosis runner;
- no evidence artifact.

Decision-relevant findings:

- the three missing snapshot rows and collector-run rows are absent from retained data;
- `07:15` and `07:35` collector runs are both `ok` and no explicit failure row exists for the three missing buckets;
- checkpoint coverage was `0.994524` and post-checkpoint coverage was `0.994236` through `2026-07-30T16:55:00Z`;
- post-checkpoint coverage was lower by `0.000288`, not improved above the `0.995` requirement;
- null refs are concentrated by channel: top 3 account for 113/248 and top 10 for 188/248;
- persisted payloads prove a required category source field was empty but cannot distinguish empty Helix `game_id` from empty `game_name`;
- current collector status at diagnosis time was `ok`.

Diagnosis evidence is non-authorizing. It does not accept #659, authorize a checkpoint rerun, relax thresholds, reset the stability clock, enter final mode, or expose public UI.

## Current gate: separate diagnosis decision

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`

The decision PR must determine:

- whether the missing rows require a recovery action or only a bounded clock rule;
- whether null refs represent expected upstream-empty category values or a collector defect;
- whether continued coverage below `0.995` requires recovery before a final audit;
- whether the accepted start remains valid, must restart, or needs another bounded rule.

The decision PR is evidence-only and performs no production mutation.

## Prohibited responses

- checkpoint rerun or threshold relaxation;
- automatic recovery or stability-clock reset;
- interpolation, backfill, or invented rows;
- Worker/config/D1/Kick/cadence/retention mutation in the decision PR;
- final mode before an accepted decision and valid boundary;
- public category-filter exposure.

## Final mode

`2026-08-05T05:30:00Z` is not sufficient by itself. Final mode additionally requires an accepted diagnosis decision and any separately accepted recovery or clock rule. A final audit never exposes UI by itself; a later separate cutover PR remains required.
