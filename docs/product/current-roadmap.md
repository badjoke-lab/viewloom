# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-29

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public Data Status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on their existing five-minute collectors.
- Hidden Twitch Heatmap category API and controls accepted without public exposure.
- The original Twitch seven-day audit correctly rejected a production configuration regression.
- Guarded Twitch recovery was triggered by PR #655, verified in run `30423637234`, accepted in PR #657, and synchronized in PR #658.
- Canonical state is `viewloom-12a2-current-gate-state-v33`.

### Current gate: replacement Twitch seven-day accumulation

The replacement Twitch stability clock started at `2026-07-29T05:30:00.000Z`. The earliest replacement audit is `2026-08-05T05:30:00.000Z` under Issue #659.

Public Twitch Heatmap category-filter exposure remains unauthorized. The original clock is invalid and cannot be used as release evidence.

## Active deliverables before 2026-08-05

### Track A — replacement audit readiness

1. Freeze the #659 audit specification.
2. Build a dormant read-only audit package before the boundary.
3. Verify exact window identity, expected five-minute slots, bounded-gap accounting, category contract/reference continuity, collector errors, permanent binding, leakage, freshness, storage headroom, and hidden-public-surface state.
4. Add bounded read-only checkpoints so a broken accumulation window is detected before the final day.
5. Keep checkpoints non-mutating and do not treat them as final audit acceptance.
6. At or after `2026-08-05T05:30:00.000Z`, run #659 and freeze the result canonically.

### Track B — Heatmap Canvas redesign

1. Accept the Canvas/Camera/LOD specification and implementation plan.
2. PR-1: split current Heatmap responsibilities without changing public behavior.
3. PR-2: add Canvas scene, camera state, redraw, world-coordinate hit testing, and overlay architecture behind a hidden route or disabled flag.
4. Do not cut over the production renderer before browser, mobile, accessibility, and data-truth acceptance.
5. Do not expose the hidden category filter as part of Canvas work.

### Track C — provider UI parity

1. After the #659 package candidate is ready, inspect Issue #148.
2. Align Twitch/Kick Day Flow and Battle Lines page skeletons, controls, state handling, and Data Status navigation.
3. Keep allowed provider differences limited to color, copy, data volume, source mode, and limitation notes.
4. Do not change collectors, cadence, D1 schema, category authorization, or cross-provider behavior.

### Track D — Kick preservation

- Preserve the accepted Kick permanent configuration and five-minute cadence.
- Do not deploy or change Kick from Twitch-only audit, Heatmap, or parity work.
- No Kick category UI is authorized by the Twitch audit.

## Following gates

1. 12A-5B-R2 replacement Twitch seven-day audit (#659).
2. 12A-5C public Twitch Heatmap category-filter cutover only after accepted audit evidence.
3. Heatmap Canvas production cutover only after its independent final validation.
4. Kick category UI only after separate Kick-specific evidence and authorization.
5. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion.
- Cross-provider category identity, mapping, totals, or combined rankings are prohibited.
- Hidden Twitch controls remain non-public until #659 and a separate cutover PR are accepted.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.
- Canvas work is renderer/interaction work and does not authorize collector or public-category changes.

## Source of truth

- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
- `docs/operations/development-and-deployment-policy.md`
