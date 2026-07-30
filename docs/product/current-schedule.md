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
Current gate exact one-file diagnosis trigger
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger
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
- Runtime safety, permanent bindings, cadence, storage, public containment, latest real/fresh snapshot, zero leakage, and Kick baseline passed.

## Accepted diagnosis execution package

- Query package/acceptance: PRs #670/#671.
- Execution package PR: #672.
- Package candidate head: `c496963f03611be4e9b957e6bf99d15f0d97bad4`.
- Package merge: `02ece37cc70de4faa5251600a465d4e68d058f29`.
- Validation run/job: `30539504888` / `90860798797`.
- Acceptance PR: #673.
- Trigger was absent and production diagnosis was skipped during package validation.
- D1 execution after exact trigger is `SELECT` / `WITH` only.

## Immediate order

1. Merge PR #673.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`.
3. Add exactly one trigger file with package PR #672, merge `02ece37cc70de4faa5251600a465d4e68d058f29`, acceptance PR #673, and a bounded exact `startAt`.
4. Validate trigger identity on the PR while production diagnosis remains skipped.
5. Squash merge the trigger and execute the accepted read-only diagnosis once.
6. Freeze sanitized evidence and retire trigger/workflow in a separate PR.
7. Make a separate recovery/no-recovery and stability-clock decision.
8. Keep final mode and public cutover blocked until that decision is accepted.

## Hard stops

- no checkpoint rerun;
- no threshold relaxation;
- no interpolation, backfill, row invention, or automatic clock reset;
- no Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, cross-provider behavior, or public category UI;
- the trigger PR changes only the exact trigger file and does not execute production diagnosis.

## Mandatory references

Read current-main roadmap, this schedule, canonical gate, audit specification, frozen checkpoint evidence, retirement record, diagnosis query package contract/acceptance, diagnosis execution package contract/acceptance and trigger contract, active WIP, affected feature specification/plan, and development policy before every branch and again before merge.
