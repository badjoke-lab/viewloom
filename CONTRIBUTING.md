# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical runtime gate, diagnosis decision/evidence, accepted dormant v2 package contract/acceptance, accepted observation execution package contract/acceptance, accepted trigger contract, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Diagnosis decision recovery required
Original stability clock invalid
Dormant package accepted PR #682 / #684
Observation execution package accepted PR #685 / #686
Current gate exact immediate Twitch category-source-v2 observation trigger
Current branch work-659-twitch-category-source-v2-observation-trigger
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Add exactly one accepted immediate trigger file.
2. Keep the trigger free of `startAt` and merge it to `main` to start the bounded observation immediately.
3. Require two consecutive real, non-empty, fresh v2 snapshots and canonical v1 rollback in `finally`.
4. Freeze observation evidence and retire the trigger and temporary execution path separately.
5. Decide semantic handling and the new stability clock separately.

## Current boundaries

- No production observation before the accepted exact one-file trigger is merged.
- No manual dispatch, schedule, pre-start sleep, or long in-job wait.
- No checkpoint rerun, backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: decision, dormant package, package acceptance, execution package, execution acceptance, exact trigger, evidence freeze and temporary-path retirement, semantic/clock decision, final audit, or public cutover.
