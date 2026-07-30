# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Checkpoint run: 30478338654 failed
Checkpoint path: retired
Diagnosis query package: accepted PR #670 / #671
Diagnosis execution package: accepted PR #672 / #673
Diagnosis trigger: PR #678 / ccb05bce0622a23e211c2c1eadc23052377d302e
Diagnosis attempt 1: cancelled before runner, no artifact
Diagnosis attempt 2: success run 30541697022 / job 90942773349 / artifact 8767937513
Diagnosis evidence: frozen
Diagnosis execution path: retired on evidence PR merge
Current branch: work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision
Twitch Heatmap public category-filter exposure: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory current authorities

Before starting a branch and again before merge, read current-main versions of:

1. `docs/README.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/product/twitch-replacement-seven-day-audit-spec.md`
6. frozen checkpoint evidence and retirement
7. diagnosis query/execution package contracts and acceptances
8. diagnosis evidence summary and retirement
9. the active WIP, affected feature specification/plan, and development policy.

Current-main documents override cached handoffs, chat summaries, and historical package states.

## Current execution order

1. Merge the diagnosis evidence/retirement PR after all frozen identifiers and evidence gates pass.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
3. Decide separately whether the evidence requires recovery, no recovery, a stability-clock restart, or another bounded rule.
4. Do not mutate production in the decision PR.
5. If recovery is required, package and accept it separately before execution.
6. If no recovery is required, fix the accepted final-audit boundary separately.
7. Keep final mode and public category UI blocked until accepted final evidence and a separate cutover PR.

## Production safety

- `main` is production; no direct push.
- Diagnosis evidence does not decide recovery.
- Do not rerun the checkpoint.
- No automatic recovery or stability-clock reset.
- No threshold relaxation, interpolation, backfill, or row invention.
- No Worker deployment, new cron, cadence change, D1 mutation, retention change, Kick mutation, final mode, cross-provider behavior, or public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence-retirement.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```
