# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-23

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 through 12A-4-23: Twitch permanent implementation, release, observation, and final acceptance.
- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.
- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.

### Current gate: 12A-4-24 parallel execution

Twitch permanent category capture remains active and accepted on the existing five-minute collector.

The first package in each parallel track is accepted:

1. Kick: explicit permanent config, rollback config, read-only observer, fixture, contract, typecheck, and normal/permanent dry-run are accepted. Runtime is still inactive.
2. Twitch hidden filter: provider-specific category metadata, category options, category-before-Top-N API filtering, and explicit category states are accepted. Public control exposure is still disabled.

The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z` / 2026-07-27 20:40 JST.

### Active deliverables

#### Track A — Kick

1. Prepare and accept a dormant release package using the accepted PR #637 implementation identity.
2. Run a fresh read-only production preflight.
3. Create a separate exact one-file trigger only after the preflight passes.
4. Publish the accepted Kick permanent config.
5. Verify two consecutive category-bearing snapshots.
6. Observe for at least 24 hours, extending to 48 hours on warning.
7. Final acceptance or verified rollback and temporary-path retirement.

#### Track B — Twitch hidden filter

1. Implement hidden or feature-flagged category controls using the accepted PR #638 API contract.
2. Use `All categories` as the default and restore Twitch-specific URL state.
3. Present loading, empty, partial, stale, demo, unknown-category, unavailable, and error states honestly.
4. Add desktop, mobile, keyboard, accessibility, browser, and data-truth tests.
5. Keep public navigation and the normal visible Heatmap control unchanged.
6. Freeze complete hidden implementation acceptance.
7. Run the seven-day accumulation audit and use a separate public cutover PR.

### Following gates

1. Kick release-package acceptance, exact release, observation, and acceptance or rollback.
2. Complete hidden Twitch control-package acceptance.
3. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.
4. 12A-5C public Twitch Heatmap category-filter cutover.
5. Kick category UI only after separate Kick acceptance and Kick stable accumulation evidence.
6. Provider-specific Day Flow category views, then category history.

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
- `docs/audits/12a4-kick-permanent-category-capture-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`