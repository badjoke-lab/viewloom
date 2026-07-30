# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-31

```text
Phase 12A-5B-R2 replacement Twitch accumulation active
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired yes
Diagnosis query package accepted PR #670 / #671
Diagnosis execution package accepted PR #672 / #673
Diagnosis attempt 1 cancelled before runner yes
Diagnosis attempt 2 success yes
Diagnosis evidence frozen yes
Diagnosis execution path retired on merge
Current gate separate diagnosis decision
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision
Public Twitch category-filter exposure authorized no
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Frozen checkpoint result

- Run/job/artifact: `30478338654` / `90665697236` / `8734980337`.
- Missing slots: `07:20`, `07:25`, `07:30` UTC.
- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Category references: 45,039/45,287 = `0.994524`, with 248 null refs.
- Invalid refs and unresolved dictionary IDs: 0.

## Frozen diagnosis execution

- Query package/acceptance: PRs #670/#671.
- Execution package/acceptance: PRs #672/#673.
- Exact trigger PR/merge: #678 / `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Attempt 1 diagnose job `90867816146` was cancelled during the in-job wait; diagnosis runner did not execute and no artifact was created.
- Successful execution run/attempt/job: `30541697022` / `2` / `90942773349`.
- Artifact: `8767937513`.
- Artifact digest: `sha256:02cedcb6c23c6792b55c96bb4326bc24ba8d7a79880df634d8a1f98e29d02ac5`.
- Source evidence JSON SHA-256: `372dc6c434830ec1ce3630b4146b29510010f0602c1a49b1b0d2fc038842236c`.
- Trigger, execution workflow, and temporary reporter are retired by the evidence/retirement PR.

## Diagnosis findings frozen for decision

- The three missing snapshot rows and matching collector-run rows are absent from retained data.
- The preceding `07:15` and following `07:35` runs are both `ok`; the context contains no explicit failure row for the missing buckets.
- Checkpoint category-reference coverage: `0.994524`.
- Post-checkpoint coverage through `2026-07-30T16:55:00Z`: `0.994236`.
- Post-checkpoint coverage is slightly lower by `0.000288`; it did not recover above the `0.995` requirement.
- Null refs are channel-concentrated: top 3 account for 113/248 (`0.455645`), top 10 for 188/248 (`0.758065`).
- Current collector status at diagnosis time was `ok`.

## Immediate order

1. Merge the evidence/retirement PR after all gates pass.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
3. Decide recovery/no recovery and stability-clock treatment from frozen evidence only.
4. Do not mutate production or expose UI in the decision PR.
5. Package any required recovery separately.
6. Keep final audit and public cutover blocked until later accepted gates.

## Hard stops

- no checkpoint rerun or threshold relaxation;
- no automatic recovery or clock reset;
- no interpolation, backfill, or row invention;
- no Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, cross-provider behavior, or public category UI.

## Mandatory references

Read current-main roadmap, this schedule, canonical gate, audit specification, frozen checkpoint evidence/retirement, diagnosis query/execution contracts and acceptances, frozen diagnosis evidence/retirement, active WIP, affected feature specification/plan, and development policy before every branch and again before merge.
