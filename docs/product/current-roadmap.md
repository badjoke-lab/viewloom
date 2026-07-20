# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-20

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Kick provider-specific bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- Twitch bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- 12A-4-19 permanent category product and operational decision: Twitch-first, provider-separated rollout.

### Current gate: 12A-4-19 Twitch permanent capture authorized, implementation pending

Twitch permanent category capture is authorized for a separate implementation package. Runtime capture remains inactive until that package passes and a separate exact deployment trigger completes a fresh read-only preflight.

Kick remains unauthorized. Twitch and Kick remain separate data products. The existing five-minute Worker cron must remain unchanged.

### Next gate: 12A-4-20 Twitch implementation package

Prepare the Twitch-only package, tests, rollback configuration, fresh preflight, temporary read-only observation path, and exact production-deployment contract. The implementation PR must not deploy or mutate production.

### Following gates

1. 12A-4-21 exact Twitch production deployment after fresh preflight.
2. 12A-4-22 minimum 24-hour observation, extended to 48 hours on warning.
3. 12A-4-23 Twitch acceptance or rollback closeout.
4. 12A-4-24 separate Kick decision.
5. 12A-5 seven-day stable accumulation followed by provider-specific category UI.

## Hard boundaries

- Twitch permanent implementation is authorized; Twitch runtime capture is not active yet.
- Kick permanent category capture is not authorized.
- Twitch and Kick remain separate data products and databases.
- Cross-provider category identity and combined category rankings are not allowed.
- No new Worker cron, backfill, or raw-retention expansion is authorized.
- Category analytics UI remains deferred until stable accumulation gates pass.
- Free-tier safety and tested rollback take precedence over feature breadth.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
