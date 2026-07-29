# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-29

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- Twitch permanent category capture initially launched and passed its first observation gate.
- Kick permanent category capture completed its minimum observation and was accepted in PR #648.
- The first Twitch seven-day audit in PR #651 correctly rejected a production configuration regression.
- Provider-scoped collector deployment protection and the dormant Twitch recovery package were accepted in PR #653 and PR #654.
- The guarded Twitch-only recovery was triggered by PR #655, succeeded in run `30423637234`, and was accepted and retired in PR #657.

- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.
- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.
- Kick dormant release package accepted in PR #641 and frozen canonically in PR #642.
- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.
- Kick permanent category capture started through PR #643, completed the minimum 24-hour observation, and was accepted in PR #648 without rollback.
- The first Twitch seven-day audit was executed read-only in PR #651 and correctly rejected after detecting a production configuration regression.

### Current gate: replacement Twitch seven-day accumulation

Kick permanent category capture remains accepted and active on the existing five-minute collector.

Twitch permanent category capture was recovered through PR #655 and accepted in PR #657. The permanent binding is active, two consecutive real and non-empty category-bearing snapshots passed, provider leakage remained zero, storage gates passed, rollback was not required, and Kick was unchanged.

The replacement stability clock started at `2026-07-29T05:30:00.000Z`. The earliest replacement read-only seven-day audit is `2026-08-05T05:30:00.000Z`.

The original clock that began on 2026-07-20 remains invalid. Public Twitch Heatmap category-filter exposure remains unauthorized.

### Active deliverables

#### Track A — Kick

1. Preserve the accepted Kick permanent configuration and five-minute cadence.
2. Do not deploy or mutate Kick from Twitch-only work.
3. Do not add Kick category UI without separate evidence and authorization.

#### Track B — Twitch hidden filter

1. Accumulate uninterrupted category-bearing Twitch snapshots from `2026-07-29T05:30:00.000Z`.
2. Run the replacement read-only seven-day audit at or after `2026-08-05T05:30:00.000Z`.
3. Verify cadence, permanent binding, coverage, reference resolution, zero leakage, errors, freshness, and storage headroom.
4. Keep hidden controls non-public throughout the audit.
5. Only after accepted audit evidence, use a separate public cutover PR.

### Following gates

1. 12A-5B-R2 replacement Twitch seven-day accumulation audit.
2. 12A-5C public Twitch Heatmap category-filter cutover only after accepted audit evidence.
3. Kick category UI only after separate Kick stable-accumulation and UI authorization evidence.
4. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron, backfill, or retention expansion is authorized.
- Twitch audit work must not mutate Kick.
- Hidden Twitch controls must not become public before the replacement seven-day audit and separate cutover acceptance.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
