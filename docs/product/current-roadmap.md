# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-26

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 through 12A-4-23: Twitch permanent implementation, release, observation, and final acceptance.
- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.
- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.
- Kick dormant release package accepted in PR #641 and frozen canonically in PR #642.
- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.
- Kick permanent category capture started through PR #643, completed the minimum 24-hour observation, and was accepted in PR #648 without rollback.

### Current gate: Twitch seven-day accumulation audit

Twitch permanent category capture remains active and accepted on the existing five-minute collector. The hidden category controls are complete and accepted, but remain available only through the non-public exact query `categoryPreview=1`.

Kick permanent category capture is accepted and active on the existing five-minute collector. Final evidence recorded 298 category-bearing snapshots, zero provider leakage, fresh authenticated data, safe storage headroom, and no rollback.

The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z` / 2026-07-27 20:40 JST.

### Active deliverables

#### Track A — Kick

1. Final acceptance: PR #648.
2. Final observation: run `30193672205`, job `89771280558`, artifact `8629415129`.
3. Kick permanent capture remains active; the temporary hourly observation workflow is retired.
4. No Kick category UI is authorized by this acceptance.

#### Track B — Twitch hidden filter

1. Keep the accepted hidden controls non-public and preserve the existing unfiltered Heatmap fallback.
2. At or after 2026-07-27 20:40 JST, run the seven-day accumulation audit.
3. Verify category continuity, dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, bounded growth, and storage headroom.
4. Create a separate public cutover PR only if the audit passes.
5. Keep Kick category UI absent and preserve provider-specific options, URL state, and results.

### Following gates

1. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.
2. 12A-5C public Twitch Heatmap category-filter cutover.
3. Kick category UI only after separate Kick stable-accumulation and UI authorization evidence.
4. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron is authorized.
- No backfill or retention expansion is authorized.
- Kick rollout must not mutate Twitch.
- Accepted hidden Twitch controls must not become public before the seven-day audit and separate cutover acceptance.
- Twitch accumulation evidence must not be reused as Kick UI evidence.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-kick-permanent-category-decision-contract.json`
- `docs/audits/12a4-kick-permanent-category-capture-package-contract.json`
- `docs/audits/12a4-kick-permanent-category-release-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`

