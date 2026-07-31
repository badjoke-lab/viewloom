# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-31

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Diagnosis decision recovery required
Original stability clock valid no
Dormant package accepted PR #682 / #684
Observation execution package accepted PR #685 / #686
Current gate exact immediate Twitch category-source-v2 observation trigger
Current branch work-659-twitch-category-source-v2-observation-trigger
Public Twitch category-filter exposure authorized no
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Accepted observation execution package

- Package/acceptance: PR #685 / #686.
- Package candidate head / merge: `b0931fa5a22a825f599bb576b4507473f1dc6731` / `0a8f2931524d08dae42dee302df24a30da544949`.
- Validation run/job: `30570462889` / `90965620950`.
- Observation: maximum 16 minutes, two consecutive real/non-empty/fresh v2 snapshots.
- Timeout: 44-minute required maximum inside a 50-minute job.
- Start: immediate after exact trigger merge; `startAt` and pre-start sleep forbidden.
- Rollback: canonical v1 deploy required in `finally`.

## Immediate order

1. Create `work-659-twitch-category-source-v2-observation-trigger` from current `main`.
2. Add exactly one accepted trigger file with package PR #685, merge `0a8f2931524d08dae42dee302df24a30da544949`, and acceptance PR #686.
3. Keep `startAt` absent and merge the one-file PR to begin observation immediately.
4. Record run/job/artifact/digest and freeze sanitized evidence.
5. Retire the trigger and temporary execution path separately.
6. Keep semantic mapping, the new stability clock, final audit, and public UI blocked pending later decisions.

## Hard stops

- No production observation before the accepted exact one-file trigger is merged.
- No manual dispatch, schedule, pre-start sleep, or long in-job wait.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
