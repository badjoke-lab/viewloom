# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public Data Status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on their existing five-minute collectors.
- Hidden Twitch Heatmap category API and controls accepted without public exposure.
- The original Twitch seven-day audit correctly rejected a production configuration regression.
- Guarded Twitch recovery was triggered by PR #655, verified in run `30423637234`, accepted in PR #657, and synchronized in PR #658.
- Canonical state is `viewloom-12a2-current-gate-state-v33`.
- The fixed-window dormant replacement audit package was implemented in PR #661 and accepted through PR #662.
- Package validation run `30455002204` / job `90586212618` passed exact 2016-slot tests, current policy checks, web typecheck/build, and public-control absence checks.
- The dormant runner defect `sqlite_cte_scope_cross_statement` was repaired in PR #663 before any production checkpoint or final audit executed.
- Repair validation run `30475011149` / job `90654426211` passed package, repair, window/slot, category-policy, development-policy, typecheck/build, and public-control absence gates.
- Runner repair acceptance is frozen through PR #664.

### Current gate: bounded checkpoint execution package

The replacement Twitch stability clock started at `2026-07-29T05:30:00.000Z`. The earliest replacement final audit is `2026-08-05T05:30:00.000Z` under Issue #659.

The accepted runner now enumerates observed category slots directly from `minute_snapshots`, keeps every statement read-only, preserves the exact half-open 2016-slot window, and has no later statement referencing CTE `scoped`.

No checkpoint or final production execution has occurred. Public Twitch Heatmap category-filter exposure remains unauthorized.

## Active deliverables before 2026-08-05

### Track A — replacement audit readiness

1. Create and validate `work-659-twitch-replacement-audit-checkpoint-package`.
2. Add a separate bounded checkpoint execution workflow and exact trigger contract.
3. Accept the checkpoint execution path before any production read-only run.
4. Execute checkpoint mode only through that accepted path.
5. Freeze sanitized checkpoint evidence as diagnostic and non-authorizing.
6. At or after `2026-08-05T05:30:00.000Z`, run final mode and freeze the result canonically.

### Track B — Heatmap Canvas redesign

1. The Canvas/Camera/LOD specification and implementation plan are accepted.
2. PR-1: split current Heatmap responsibilities without changing public behavior.
3. PR-2: add Canvas scene, camera state, redraw, world-coordinate hit testing, and overlay architecture behind a hidden route or disabled flag.
4. Do not cut over the production renderer before browser, mobile, accessibility, and data-truth acceptance.
5. Do not expose the hidden category filter as part of Canvas work.

### Track C — provider UI parity

1. Inspect Issue #148 after checkpoint-package priority is secured.
2. Align Twitch/Kick Day Flow and Battle Lines page skeletons, controls, state handling, and Data Status navigation.
3. Keep allowed provider differences limited to color, copy, data volume, source mode, and limitation notes.
4. Do not change collectors, cadence, D1 schema, category authorization, or cross-provider behavior.

### Track D — Kick preservation

- Preserve the accepted Kick permanent configuration and five-minute cadence.
- Do not deploy or change Kick from Twitch-only audit, Heatmap, or parity work.
- No Kick category UI is authorized by the Twitch audit.

## Following gates

1. Bounded read-only checkpoint package and separate path acceptance.
2. Diagnostic checkpoint execution and evidence freeze.
3. 12A-5B-R2 replacement Twitch seven-day final audit (#659).
4. 12A-5C public Twitch Heatmap category-filter cutover only after accepted final evidence.
5. Heatmap Canvas production cutover only after its independent final validation.
6. Kick category UI only after separate Kick-specific evidence and authorization.
7. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion.
- Cross-provider category identity, mapping, totals, or combined rankings are prohibited.
- The accepted runner repair performed no Cloudflare/D1 execution and changed no runtime configuration.
- Checkpoints are read-only and non-authorizing.
- Hidden Twitch controls remain non-public until #659 final evidence and a separate cutover PR are accepted.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.
- Canvas work is renderer/interaction work and does not authorize collector or public-category changes.

## Source of truth

- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
- `docs/operations/development-and-deployment-policy.md`
