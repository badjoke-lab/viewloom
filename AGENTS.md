# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate: viewloom-12a2-current-gate-state-v33
Diagnosis decision: recovery required
Original stability clock: invalid and retired
Package accepted: PR #682 / #684
Current branch: work-659-twitch-category-source-v2-completeness-execution-package
Twitch Heatmap public category-filter exposure: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory authorities

Read current-main docs index, roadmap, schedule, canonical runtime gate, diagnosis decision/evidence/retirement, accepted v2 package contract/acceptance, audit specification, active WIP, affected feature plan, and development policy before every branch and merge.

## Current execution order

1. Build a bounded Twitch-only execution package for the accepted `category-source-v2-candidate`.
2. Keep v1 as default/rollback and the v2 flag disabled by default.
3. Define exact trigger, bounded timeout envelope, two-consecutive-snapshot evidence, rollback, storage, and provider-separation gates.
4. Accept the execution package separately before an exact trigger.
5. Freeze evidence and decide semantic handling/new clock separately.

## Production safety

- `main` is production; no direct push.
- No production execution before a separately accepted execution package and exact trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
