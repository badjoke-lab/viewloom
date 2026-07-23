# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-23

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

### Current gate: 12A-4-24 parallel execution

Twitch permanent category capture remains active and accepted on the existing five-minute collector.

Two separate tracks are now authorized:

1. Kick permanent category capture: implementation, fresh preflight, exact release, 24–48 hour observation, and acceptance or rollback under Issue #634.
2. Twitch Heatmap category filter: hidden implementation and testing under Issue #635. Public exposure remains unauthorized until the seven-day Twitch accumulation audit and a separate public cutover PR.

The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z` / 2026-07-27 20:40 JST.

### Active deliverables

#### Track A — Kick

1. Formal Kick-only decision contract and canonical authorization.
2. Fresh read-only production preflight.
3. Kick permanent-category implementation package with rollback.
4. Accepted dormant release package and exact trigger.
5. Two consecutive category-bearing snapshots.
6. Minimum 24-hour observation, extending to 48 hours on warning.
7. Final acceptance or verified rollback and temporary-path retirement.

#### Track B — Twitch hidden filter

1. Twitch Heatmap API category contract.
2. Hidden or feature-flagged category control with `All categories` default.
3. Filtering before Top 20 / 50 / 100 selection.
4. URL-state, empty/partial/stale/demo/unknown/unavailable states.
5. Desktop, mobile, keyboard, accessibility, browser, and data-truth tests.
6. No public navigation or normal-route exposure before the seven-day gate.
7. Separate public cutover after accumulation and implementation acceptance.

### Following gates

1. 12A-4-24 Kick package, deployment, observation, and acceptance or rollback.
2. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.
3. 12A-5C public Twitch Heatmap category-filter cutover.
4. Kick category UI only after separate Kick acceptance and Kick stable accumulation evidence.
5. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron is authorized.
- No backfill or retention expansion is authorized.
- Kick rollout must not mutate Twitch.
- Hidden Twitch UI implementation must not expose a public category filter before the public gate.
- Twitch accumulation evidence must not be reused as Kick UI evidence.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-kick-permanent-category-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`