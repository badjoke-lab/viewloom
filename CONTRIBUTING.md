# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, the docs index, current roadmap, current schedule, canonical runtime gate, semantic decision, revised stability-clock acceptance, seven-day audit contract, successful observation evidence, execution-path retirement, affected specification/plan, active WIP, and development policy. Record the current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category seven-day stability accumulation
Semantic handling accepted PR #699 / merge ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e
Revised stability clock accepted PR #700 / merge d2316f10ba970818a47605a76a9ee9f235c517a4
Window [2026-07-31T17:00:00.000Z, 2026-08-07T17:00:00.000Z)
JST 2026-08-01 02:00 to 2026-08-08 02:00
Expected slots 2016
Current gate active accumulation on the unchanged five-minute Twitch collector
Public Twitch category-filter exposure unauthorized
```

## Accepted result

Provider-scoped semantic handling is accepted. Only complete provider-ID/name pairs create references; incomplete pairs remain null coverage. The revised seven-day clock began automatically at the accepted boundary through normal collector operation. No start-time workflow or operator action was required.

## Current work order

1. Preserve the collector, D1 schema, bindings, cadence, retention, and category semantics during accumulation.
2. Do not run final mode before `2026-08-07T17:00:00.000Z`.
3. At or after the boundary, run the governed final read-only audit for 2016 expected slots.
4. Freeze and separately accept evidence before final-mode or public category UI decisions.

## Current boundaries

- No observation rerun, checkpoint rerun, backfill, threshold relaxation, synthetic mapping, or clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change during the active window.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: stability-window source-of-truth synchronization, final audit package, final evidence freeze, final acceptance, final-mode decision, or public cutover.
