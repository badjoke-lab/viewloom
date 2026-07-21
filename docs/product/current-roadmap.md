# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-21

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 Twitch implementation package and rollback path.
- 12A-4-21 exact Twitch release package and successful production start.
- 12A-4-22 minimum 24-hour Twitch observation with no warnings or hard stops.
- 12A-4-23 Twitch permanent category capture accepted.

### Current gate: 12A-4-23 Twitch accepted

Twitch permanent category capture remains active on the existing five-minute collector. Final evidence recorded 291 category-bearing snapshots against 290 expected, category coverage 100%, collector errors 0, provider leakage 0, and all storage, freshness, real/non-empty, schema, and binding gates passing.

Kick permanent category capture remains unauthorized and unchanged. Category UI remains unauthorized until seven stable Twitch days are accepted.

### Following gates

1. 12A-4-24 separate Kick permanent-category decision.
2. 12A-5 seven stable Twitch days before provider-specific category UI work.
3. Provider-specific Heatmap category filter, then Day Flow category view, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products and databases.
- Cross-provider category identity and combined category rankings are not allowed.
- Existing Worker cadence remains `*/5 * * * *`.
- No backfill or retention expansion is authorized.
- Kick is not authorized by Twitch acceptance.
- Category UI is not yet authorized.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
