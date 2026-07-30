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
- Sanitized diagnosis evidence is frozen and the temporary diagnosis path is retired.

## Checkpoint execution and result

- slot coverage 151/154 = `0.980519`, required `0.995`;
- three consecutive missing slots at `07:20`, `07:25`, `07:30` UTC;
- category-reference coverage 45,039/45,287 = `0.994524`, with 248 null references;
- invalid refs and unresolved dictionary IDs: 0.

## Frozen diagnosis evidence

Authority:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json`

Execution identity:

- run/job/artifact: `PENDING_DIAGNOSIS_IDENTIFIERS`;
- artifact digest: `PENDING_DIAGNOSIS_ARTIFACT_DIGEST`;
- evidence JSON SHA-256: `PENDING_DIAGNOSIS_EVIDENCE_SHA256`.

The evidence records exact missing-row presence, collector-run and snapshot context, null refs by bucket/channel, checkpoint and post-checkpoint summaries, current collector status, source-code attribution, and persistence limitations.

Diagnosis evidence does not decide recovery. It does not accept #659, authorize a checkpoint rerun, relax thresholds, reset the stability clock, enter final mode, or expose public UI.

## Current gate: separate diagnosis decision

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`

The decision PR must determine:

- whether the three missing rows were permanently absent;
- whether collector-run context identifies a bounded cause;
- whether null refs are expected upstream-empty values or a collector defect;
- whether post-checkpoint behavior is stable;
- whether recovery is required;
- whether the accepted start remains valid or a new clock rule is required.

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
