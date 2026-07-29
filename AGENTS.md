# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Twitch permanent category capture: active
Kick permanent category capture: active
Replacement Twitch stability start: 2026-07-29T05:30:00.000Z
Earliest replacement audit: 2026-08-05T05:30:00.000Z
Replacement audit issue: #659
Dormant replacement audit package: accepted from PR #661 through PR #662
Twitch Heatmap public category-filter exposure: unauthorized
Existing Twitch cadence: */5 * * * *
Existing Kick cadence: */5 * * * *
```

## Mandatory current authorities

Read these from the current `main` branch before starting work and reread them before merging:

1. `docs/README.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. the affected feature specification and implementation plan
6. the active work-in-progress record
7. `docs/operations/development-and-deployment-policy.md`

Current feature authorities include:

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`
- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`

Do not rely on a cached handoff, an old chat summary, or a historical acceptance file when current `main` differs. The current roadmap, schedule, canonical gate, affected specification, and active WIP determine authorization.

## Current execution order

1. Create and accept `work-659-twitch-replacement-audit-checkpoint-package`.
2. Execute bounded read-only checkpoint mode only through a separate accepted path; freeze sanitized diagnostic evidence.
3. Begin Heatmap Canvas PR-1: `work-heatmap-canvas-module-split`, with no user-visible behavior change.
4. Add the Canvas scene only behind a hidden route or disabled feature flag after PR-1 acceptance.
5. Inspect and fix provider UI parity gaps from #148; the audit package prerequisite is complete.
6. At or after `2026-08-05T05:30:00.000Z`, execute #659 final mode and freeze the result.
7. Keep public category-filter exposure disabled until an accepted final audit and a separate cutover PR.

## Production safety

- `main` is production.
- No direct push to `main`.
- Use `work-*` for ordinary work and one PR per responsibility.
- Package PRs do not use production credentials or execute production mutation.
- Production read-only execution requires a separately accepted bounded path where the contract requires one.
- Checkpoint evidence is diagnostic, does not accept #659, and does not authorize public UI.
- Twitch and Kick bindings, rows, routes, options, and outputs remain separate.
- No new Worker cron, cadence change, D1 schema mutation, backfill, retention expansion, cross-provider identity, or combined category ranking.
- Heatmap Canvas work must not change collector behavior or expose the hidden category filter.
- Existing unfiltered Heatmap remains the production fallback until a separately accepted cutover.

## Validation

Run the affected targeted checks during iteration, then all feature and shared gates on the latest candidate HEAD. At minimum for governance/category work:

```bash
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Run web build, typecheck, browser, mobile, accessibility, and data-truth gates when the affected scope requires them.
