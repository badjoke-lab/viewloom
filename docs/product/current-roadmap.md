# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public Data Status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on their existing five-minute collectors.
- Hidden Twitch Heatmap category API and controls accepted without public exposure.
- Guarded Twitch recovery accepted in PR #657 and synchronized in PR #658.
- Canonical state remains `viewloom-12a2-current-gate-state-v33`.
- Dormant replacement audit package accepted through PRs #661 and #662.
- Runner defect `sqlite_cte_scope_cross_statement` repaired in PR #663 and accepted in PR #664 before any production checkpoint/final execution.
- Checkpoint package PR #665 merged as `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
- Checkpoint package validation run/job `30476596379` / `90659857133` passed trigger absence, package verifier, accepted repair, 2016-slot tests, category/development policies, web typecheck/build, and public-control absence.
- Checkpoint package acceptance PR #666 freezes the checkpoint-only path and exact trigger contract.

### Current gate: exact checkpoint trigger

Current branch: `work-659-twitch-replacement-audit-checkpoint-trigger`.

The accepted package can execute only checkpoint mode, only after the exact one-file trigger reaches main. It uses Cloudflare GET and D1 SELECT/WITH only, adds no Worker cron, performs no deployment or mutation, preserves Kick, and cannot accept #659 or expose public UI.

## Active deliverables before 2026-08-05

### Track A — diagnostic checkpoint

1. Add only `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json` in the exact trigger PR.
2. Bind the trigger to package PR #665 and merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
3. Merge only after trigger identity validation passes; no production execution occurs on the PR.
4. On main push, execute checkpoint mode once at the exact `startAt`.
5. Freeze sanitized workflow/job/artifact/digest evidence.
6. Retire the trigger and temporary path after evidence freeze.
7. Keep checkpoint evidence diagnostic and non-authorizing.

### Track B — Heatmap Canvas redesign

1. Start PR-1 `work-heatmap-canvas-module-split` only after checkpoint execution/evidence priority is secured.
2. Split current Heatmap responsibilities without public behavior change.
3. Add Canvas scene/camera/redraw/hit-test only behind a hidden route or disabled flag after PR-1 acceptance.
4. Do not cut over production renderer before independent browser/mobile/accessibility/data-truth acceptance.
5. Do not expose the hidden category filter as part of Canvas work.

### Track C — provider UI parity

1. Inspect Issue #148 after checkpoint priority is secured.
2. Align Twitch/Kick Day Flow and Battle Lines page skeletons, controls, state handling, and Data Status navigation.
3. Keep allowed provider differences limited to color, copy, data volume, source mode, and limitation notes.
4. Do not change collectors, cadence, D1 schema, category authorization, or cross-provider behavior.

## Final boundary

At or after `2026-08-05T05:30:00.000Z`:

1. execute #659 final mode read-only over the exact 2016-slot window;
2. freeze exact evidence identities;
3. accept or reject the replacement window in a separate PR;
4. keep public category controls hidden;
5. require a separate 12A-5C cutover PR after accepted final evidence.

## Hard boundaries

- Twitch and Kick remain separate products, databases, collectors, APIs, options, URL state, and results.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion.
- Cross-provider category identity, mapping, totals, or combined rankings are prohibited.
- Checkpoint workflow is read-only and checkpoint-only.
- A checkpoint does not accept #659, guarantee final acceptance, authorize mutation, or expose public UI.
- Existing unfiltered Heatmap remains the fallback.
- Canvas work is renderer/interaction work and does not authorize collector/category changes.

## Source of truth

- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`
- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
- `docs/operations/development-and-deployment-policy.md`
