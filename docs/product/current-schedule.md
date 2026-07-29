# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-30

```text
Phase 12A-5B-R2 replacement Twitch accumulation active
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired yes
Failure diagnosis package accepted PR #670 / #671
Current gate one-time diagnosis execution package
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package
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

## Accepted diagnosis package

- Package PR: #670.
- Package candidate head: `4cb52b9cb11eb5b27a7f93eaa0e14838ab686039`.
- Package merge: `7f8e2d5adeec187a194aefc8fb2b239d05c5318a`.
- Validation run/job: `30481973791` / `90678071929`.
- Acceptance PR: #671.
- Queries are D1 `SELECT` / `WITH` only.
- Package and acceptance PRs perform no production diagnosis.

## Immediate order

1. Merge PR #671.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package`.
3. Add a one-time execution workflow and exact trigger contract; package PR uses no production credentials or access.
4. Accept the execution package separately.
5. Add an exact trigger in another PR and run diagnosis once.
6. Freeze sanitized evidence and retire the temporary path.
7. Make a separate recovery/no-recovery and stability-clock decision.
8. Keep final mode and public cutover blocked until that decision is accepted.

## Hard stops

- no checkpoint rerun or threshold relaxation;
- no interpolation, backfill, row invention, or automatic clock reset;
- no Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, cross-provider behavior, or public category UI;
- no production diagnosis before separate execution-package acceptance and exact trigger.

## Mandatory references

Read current-main roadmap, this schedule, canonical gate, audit specification, frozen checkpoint evidence, retirement record, diagnosis package contract/acceptance, active WIP, affected feature specification/plan, and development policy before every branch and again before merge.
