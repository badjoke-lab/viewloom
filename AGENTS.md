# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Checkpoint run: 30478338654 failed
Checkpoint path: retired
Failure diagnosis package: accepted PR #670 / #671
Current branch: work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package
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
8. `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json`
9. `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json`
10. the active WIP, affected feature specification/plan, and development policy.

Current-main documents override cached handoffs, chat summaries, and historical package states.

## Current execution order

1. Merge diagnosis package acceptance PR #671.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package`.
3. Add a bounded one-time diagnosis workflow and exact trigger contract; do not execute production queries on the package PR.
4. Accept the execution package separately.
5. Add an exact one-file trigger in another PR and run the read-only diagnosis once.
6. Freeze sanitized diagnosis evidence and retire the temporary path.
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
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```
