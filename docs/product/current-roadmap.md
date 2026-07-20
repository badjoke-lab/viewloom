# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-20

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Provider-specific Kick and Twitch bounded canaries, rollback acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch-first and provider-separated.
- 12A-4-20 Twitch permanent implementation package acceptance.
- 12A-4-21 exact Twitch release package and initial production start acceptance.

### Current gate: 12A-4-22 Twitch permanent observation active

Twitch permanent category capture started at 2026-07-20 20:40 JST. Initial read-only verification accepted the permanent flag, two category-bearing snapshots, zero provider leakage, real non-empty fresh collection, and all storage gates.

The minimum 24-hour Twitch-only observation is active until no earlier than 2026-07-21 20:40 JST. A warning extends observation to 48 hours. A hard stop restores the normal category-disabled Twitch configuration automatically.

### Following gates

1. 12A-4-23 Twitch acceptance or rollback closeout and temporary-path retirement.
2. 12A-4-24 separate Kick decision.
3. 12A-5 seven stable days before provider-specific category UI.

## Hard boundaries

- Twitch permanent category capture is active; Kick permanent category capture is not authorized.
- Twitch and Kick remain separate data products and databases.
- The existing five-minute Worker cron remains unchanged; the hourly observer is a temporary GitHub Actions schedule only.
- Cross-provider category identity and combined category rankings are not allowed.
- No backfill or raw-retention expansion is authorized.
- Category analytics UI remains deferred until stable accumulation gates pass.
- Free-tier safety, read-only observation, and automatic restoration take precedence over feature breadth.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-start-acceptance.json`
- `docs/audits/12a4-twitch-permanent-category-observation-contract.json`
- `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
