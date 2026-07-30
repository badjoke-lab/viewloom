# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Checkpoint run: 30478338654 failed
Checkpoint path: retired
Failure diagnosis query package: accepted PR #670 / #671
Failure diagnosis execution package: accepted PR #672 / #673
Current branch: work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger
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
6. `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
7. `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`
8. diagnosis query package contract/acceptance
9. diagnosis execution package contract/acceptance and trigger contract
10. the active WIP, affected feature specification/plan, and development policy.

Current-main documents override cached handoffs, chat summaries, and historical package states.

## Current execution order

1. Merge execution package acceptance PR #673.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`.
3. Add exactly one trigger file using package PR #672, merge `02ece37cc70de4faa5251600a465d4e68d058f29`, and acceptance PR #673.
4. Validate trigger identity on the PR; production diagnosis must remain skipped there.
5. Squash merge the exact trigger and run the accepted read-only diagnosis once.
6. Freeze sanitized evidence and retire trigger/workflow in a separate PR.
7. Make a separate recovery/no-recovery and stability-clock decision.
8. Keep final mode and public category UI blocked until that decision is accepted.

## Production safety

- `main` is production; no direct push.
- D1 diagnosis is `SELECT` / `WITH` only.
- Do not rerun the checkpoint.
- No threshold relaxation, interpolation, backfill, or clock reset.
- No Worker deployment, new cron, cadence change, D1 mutation, retention change, Kick mutation, final mode, cross-provider behavior, or public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```
