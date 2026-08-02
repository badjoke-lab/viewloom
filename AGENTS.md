# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 Twitch category seven-day stability accumulation
Canonical runtime gate: viewloom-12a2-current-gate-state-v33
Semantic handling accepted: PR #699 / merge ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e
Revised stability clock accepted: PR #700 / merge d2316f10ba970818a47605a76a9ee9f235c517a4
Accepted window: [2026-07-31T17:00:00.000Z, 2026-08-07T17:00:00.000Z)
JST window: 2026-08-01 02:00 to 2026-08-08 02:00
Expected five-minute slots: 2016
Current gate: accumulate with the existing Twitch collector until the end boundary
Manual action at start: none
Twitch Heatmap public category-filter exposure: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory authorities

Read current-main docs index, roadmap, schedule, canonical runtime gate, semantic decision, revised stability-clock acceptance, seven-day audit contract, successful observation evidence, execution-path retirement, affected feature plan, active WIP, and development policy before every branch and merge.

## Accepted decisions

- Provider-scoped category identity is `(provider, categoryProviderId)`.
- Only source pairs with both provider ID and category name create a category reference.
- Incomplete source pairs remain null coverage; no synthetic, name-only, or cross-provider mapping is allowed.
- PR #700 accepted the half-open seven-day window beginning `2026-07-31T17:00:00.000Z` and ending exclusively at `2026-08-07T17:00:00.000Z`.
- The existing five-minute Twitch collector starts the clock automatically by continuing normal collection; no start workflow, new cron, deployment, checkpoint, D1 mutation, binding change, or operator action is required.

## Current execution order

1. Leave the accepted collector, D1 schema, cadence, retention, bindings, and category semantics unchanged during accumulation.
2. Do not run final read-only mode before `2026-08-07T17:00:00.000Z`.
3. At or after the end boundary, run the separately governed final read-only audit for all 2016 expected slots.
4. Freeze and separately accept the final evidence before any final-mode or public category-filter decision.

## Production safety

- `main` is production; no direct push.
- No observation rerun or recreation of retired production paths without a new accepted package and trigger sequence.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change during the active window.
- Existing unfiltered Heatmap remains the fallback.
