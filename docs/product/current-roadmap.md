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
- 12A-4-20 Twitch permanent-category implementation package, rollback config, read-only observer, fixtures, typecheck, and dry-run bundle acceptance.

### Current gate: 12A-4-20 Twitch permanent package accepted, deployment pending

The Twitch permanent-category package is accepted. It preserves the existing Twitch Worker, Twitch D1 database, and five-minute cron; the current category-disabled configuration remains the rollback target.

Runtime category capture is still inactive. No permanent production binding has been deployed. Kick remains unauthorized and unchanged.

### Next gate: 12A-4-21 exact Twitch production deployment

Prepare a separate exact deployment package. Its production job must run a fresh Cloudflare GET / D1 SELECT preflight, stop on any failed storage, schema, leakage, freshness, identity, or binding gate, deploy only the accepted Twitch configuration, verify two consecutive real non-empty category-bearing snapshots, and retain immediate rollback to the normal config.

### Following gates

1. 12A-4-22 minimum 24-hour observation, extended to 48 hours on warning.
2. 12A-4-23 Twitch acceptance or rollback closeout.
3. 12A-4-24 separate Kick decision.
4. 12A-5 seven-day stable accumulation followed by provider-specific category UI.

## Hard boundaries

- Twitch permanent implementation is accepted; Twitch runtime capture is not active yet.
- Kick permanent category capture is not authorized.
- Twitch and Kick remain separate data products and databases.
- Cross-provider category identity and combined category rankings are not allowed.
- No new Worker cron, backfill, or raw-retention expansion is authorized.
- Category analytics UI remains deferred until stable accumulation gates pass.
- Free-tier safety, fresh preflight, and tested rollback take precedence over feature breadth.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json`
- `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
