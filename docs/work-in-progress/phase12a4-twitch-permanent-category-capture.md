# 12A-4-20 Twitch permanent category capture implementation package

## Status

PR #625 prepares the Twitch-only permanent category capture package. The package is validation-only: Twitch permanent runtime capture is not deployed or active, and Kick remains unauthorized. It does not deploy a Worker.

## Package contents

- Explicit Twitch permanent configuration: `workers/collector-twitch/wrangler.category-permanent.toml`.
- Existing category-disabled normal configuration retained as rollback target: `workers/collector-twitch/wrangler.toml`.
- Existing `game_id` / `game_name` extraction, `category-source-v1` payload, dictionary upsert, and category intraday rollups reused without changing stream coverage.
- Standalone read-only preflight/observation/rollback probe using Cloudflare `GET` and D1 `SELECT` only.
- Storage, binding, provider leakage, freshness, real/non-empty snapshot, and category continuity gates.
- Exact package scope enforcement, fixtures, verifier, dry-run Worker bundling, and category rollout policy validation.

## Pull request boundary

PR #625 does not:

- deploy a Worker;
- mutate remote D1;
- change the production Twitch configuration or bindings;
- change Kick;
- change the five-minute Worker cron;
- add a new Worker cron;
- backfill data or expand retention;
- add category UI;
- add cross-provider identity, totals, or rankings;
- include the exact production deployment trigger.

## Required acceptance

The latest package HEAD must pass:

1. exact scope verification;
2. permanent configuration and source-contract fixtures;
3. package contract verification;
4. category rollout policy verification;
5. Twitch collector typecheck;
6. normal Twitch Worker dry-run bundle;
7. permanent-category Twitch Worker dry-run bundle.

## Next gate

After this package is accepted and merged, advance the canonical gate to record 12A-4-20 accepted. Then prepare a separate 12A-4-21 exact deployment package that runs a fresh read-only production preflight before any deployment and retains the normal configuration as rollback.

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/operations/development-and-deployment-policy.md`

## Current authorization

Twitch implementation authorized: yes.  
Twitch runtime active: no.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
