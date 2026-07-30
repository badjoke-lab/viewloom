# 12A-5B-R2 replacement Twitch checkpoint-failure diagnosis decision

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Canonical runtime gate remains v33.
- Checkpoint run `30478338654` completed read-only and failed.
- Checkpoint path is retired.
- Diagnosis query package/acceptance: PRs #670/#671.
- Diagnosis execution package/acceptance: PRs #672/#673.
- Exact trigger PR #678 merged as `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Attempt 1 diagnose job `90867816146` was cancelled during the in-job wait before the runner executed; no artifact was created.
- Attempt 2 run/job/artifact `30541697022` / `90942773349` / `8767937513` completed successfully.
- Sanitized diagnosis evidence summary is frozen with artifact digest and source evidence SHA-256.
- Exact trigger, one-time execution workflow, and temporary reporter are retired by this PR.
- Current branch after merge: `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
- Public Twitch category-filter exposure remains unauthorized.

## Frozen checkpoint gates

- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Three consecutive missing buckets: `07:20`, `07:25`, `07:30` UTC.
- Category-reference coverage: 45,039/45,287 = `0.994524`, with 248 null refs.
- Invalid refs and unresolved dictionary IDs: 0.

## Frozen diagnosis execution

- run/attempt/job/artifact: `30541697022` / `2` / `90942773349` / `8767937513`;
- artifact digest: `sha256:02cedcb6c23c6792b55c96bb4326bc24ba8d7a79880df634d8a1f98e29d02ac5`;
- source evidence JSON SHA-256: `372dc6c434830ec1ce3630b4146b29510010f0602c1a49b1b0d2fc038842236c`;
- evidence path: `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json`.

## Frozen diagnosis findings

- The three missing rows are absent from both snapshot and collector-run retained data.
- The immediately preceding `07:15` run and following `07:35` run are `ok`.
- No explicit failure row exists for the three missing buckets.
- Post-checkpoint category-reference coverage is `0.994236`, lower than checkpoint coverage by `0.000288`.
- Null refs remain channel-concentrated; the top 10 channels account for 188/248 checkpoint null occurrences.
- Current collector status at diagnosis time is `ok`.
- Persisted data cannot distinguish whether Helix `game_id` or `game_name` was empty.

## Current work order

1. Merge the evidence/retirement PR after its dedicated policy, typecheck, build, and public-containment gates pass.
2. Create a separate diagnosis-decision PR.
3. Decide whether recovery is required and how the stability clock must be treated.
4. Do not mutate production in the decision PR.
5. Package any required recovery separately.
6. Keep final mode and public UI blocked until later accepted gates.

## Decision questions

- Do the permanently absent rows require recovery, a restart, or a bounded exception rule?
- Are null category refs expected upstream-empty values or a collector defect?
- Does continued coverage below `0.995` require recovery before final mode?
- Can the original replacement clock remain valid?

## Shared boundaries

- No checkpoint rerun.
- No threshold relaxation, interpolation, backfill, or row invention.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, or cross-provider change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

Before every branch and merge, read current-main roadmap, schedule, canonical gate, audit specification, checkpoint evidence/retirement, diagnosis query/execution contracts and acceptances, diagnosis evidence/retirement, active WIP, development policy, and affected feature specification/plan.
