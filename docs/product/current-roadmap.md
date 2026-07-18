# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-18

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Kick provider-specific bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- Twitch dormant package, execution package, read-only storage preflight, start-order fix, and monitor parser fix.
- Twitch attempt 3 exact trigger and same-job start preflight.
- Twitch attempt 3 first scheduled checkpoint.

### Current gate: 12A-4-17 Twitch attempt 3 bounded observation

Attempt 3 is active from `2026-07-18T05:15:00.000Z` through `2026-07-19T05:15:00.000Z`. Start run `29631153598` and first monitor run `29634222309` passed. Provider leakage is zero, storage and account headroom gates pass, the permanent category flag is absent, and Kick is unchanged.

### Next gate: final Twitch rollback acceptance

Continue scheduled checkpoints. At or after exact expiry, restore the normal Twitch config and prove canary bindings are absent, no category payload appears after the grace boundary, provider leakage remains zero, normal Twitch collection is fresh/authenticated/non-empty, and the production execution path can be retired.

## Hard boundaries

- Permanent category capture is not authorized.
- Twitch and Kick remain separate data products.
- Cross-provider category identity and combined category rankings are not allowed.
- No new cron, backfill, or raw-retention expansion is authorized.
- Category analytics UI remains deferred.
- Free-tier safety takes precedence over feature breadth.

## Canonical evidence

- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json`
- `docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json`
- `docs/audits/12a4-twitch-category-capture-canary-execution-contract.json`
- `docs/work-in-progress/phase12a4-twitch-category-capture-canary-execution.md`
