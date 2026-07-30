# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-30

```text
Phase 12A-5B-R2 replacement Twitch accumulation active
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired yes
Diagnosis query package accepted PR #670 / #671
Diagnosis execution package accepted PR #672 / #673
Diagnosis evidence frozen yes
Diagnosis execution path retired yes
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
- Execution run/job/artifact: `PENDING_DIAGNOSIS_IDENTIFIERS`.
- Artifact digest: `PENDING_DIAGNOSIS_ARTIFACT_DIGEST`.
- Evidence JSON SHA-256: `PENDING_DIAGNOSIS_EVIDENCE_SHA256`.
- Trigger, execution workflow, and temporary reporter retired: yes.

## Immediate order

1. Merge the evidence/retirement PR after pending values are replaced and verified.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
3. Decide recovery/no recovery and stability-clock treatment from the frozen evidence.
4. Do not mutate production or expose public UI in the decision PR.
5. Package any required recovery separately.
6. Keep final audit and public cutover blocked until later accepted gates.

## Hard stops

- no checkpoint rerun;
- no threshold relaxation;
- no automatic recovery or clock reset;
- no interpolation, backfill, or row invention;
- no Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, cross-provider behavior, or public category UI.

## Mandatory references

Read current-main roadmap, this schedule, canonical gate, audit specification, frozen checkpoint evidence/retirement, diagnosis query/execution contracts and acceptances, frozen diagnosis evidence/retirement, active WIP, affected feature specification/plan, and development policy before every branch and again before merge.
