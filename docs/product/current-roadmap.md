# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-19

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Kick provider-specific bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- Twitch dormant package, execution package, read-only storage preflight, start-order fix, and monitor parser fix.
- Twitch attempt 3 exact trigger, same-job start preflight, bounded observation, exact-expiry rollback, post-grace acceptance, and production-path retirement.

### Current gate: 12A-4-18 provider canaries accepted and retired

Both provider-separated bounded canaries completed. Twitch final acceptance records zero category payload rows after the ten-minute grace boundary, zero provider leakage, absent canary and permanent bindings, a fresh real non-empty normal snapshot, and passing provider/account storage gates.

Runtime category capture is inactive. Historical category rows remain as accepted evidence. Permanent category capture is not authorized.

### Next decision

Any permanent category-capture proposal must be a new explicit product and operational decision. It must not inherit authorization from the completed canaries.

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
- `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`
- `docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json`
- `docs/work-in-progress/phase12a4-twitch-category-capture-canary-post-rollback-acceptance.md`
