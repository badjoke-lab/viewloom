# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate: viewloom-12a2-current-gate-state-v33
Diagnosis decision: recovery required
Original stability clock: invalid and retired
Dormant package accepted: PR #682 / #684
Observation execution package accepted: PR #685 / #686
Current gate: exact immediate Twitch category-source-v2 observation trigger
Current branch: work-659-twitch-category-source-v2-observation-trigger
Twitch Heatmap public category-filter exposure: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory authorities

Read current-main docs index, roadmap, schedule, canonical runtime gate, diagnosis decision/evidence/retirement, accepted dormant v2 package contract/acceptance, accepted observation execution package contract/acceptance, accepted trigger contract, audit specification, active WIP, affected feature plan, and development policy before every branch and merge.

## Current execution order

1. Add exactly one accepted immediate trigger file for the Twitch category-source-v2 observation.
2. The trigger must contain no `startAt`; merging it to `main` runs the bounded observation immediately.
3. Require two consecutive real, non-empty, fresh v2 snapshots and canonical v1 rollback in `finally`.
4. Freeze run/job/artifact/digest evidence and retire the trigger and temporary execution path separately.
5. Decide semantic handling and the new stability clock separately.

## Production safety

- `main` is production; no direct push.
- No production observation before the accepted exact one-file trigger is merged.
- No manual dispatch, schedule, pre-start sleep, or long in-job wait.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
