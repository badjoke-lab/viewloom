# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate: viewloom-12a2-current-gate-state-v33
Checkpoint run: 30478338654 failed
Diagnosis run: 30541697022 attempt 2 succeeded
Diagnosis evidence path: retired
Diagnosis decision: recovery required
Original stability clock: invalid and retired
Current branch: work-659-twitch-category-source-v2-completeness-recovery-package
Twitch Heatmap public category-filter exposure: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory authorities

Read current-main versions of the docs index, roadmap, schedule, canonical runtime gate, diagnosis decision/evidence/retirement, audit specification, active WIP, affected feature plan, and development policy before every branch and merge.

## Current execution order

1. Build a dormant Twitch-only `category-source-v2-candidate` completeness recovery package.
2. Preserve `both_present`, `both_empty`, `provider_id_only`, and `category_name_only` before source fields are stripped.
3. Validate unit tests, storage/cost, provider separation, rollback, and public containment without production execution.
4. Accept and execute separately for Twitch only.
5. Freeze two consecutive real/nonempty/fresh snapshots.
6. Decide semantic handling and the new stability clock separately.

## Production safety

- `main` is production; no direct push.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No production execution on the dormant package PR.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
