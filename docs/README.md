# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-30

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Replacement Twitch stability start 2026-07-29T05:30:00.000Z
Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z
Replacement audit issue #659
Dormant replacement audit package accepted yes
Package PR #661
Package acceptance PR #662
Runner repair accepted PR #663
Runner repair acceptance PR #664
Current branch work-659-twitch-replacement-audit-checkpoint-package
Twitch Heatmap hidden category implementation accepted yes
Twitch Heatmap public category-filter exposure authorized no
Existing Twitch cadence */5 * * * *
Existing Kick cadence */5 * * * *
New Worker cron authorized no
Backfill authorized no
Retention expansion authorized no
Cross-provider identity or combined ranking authorized no
```

## Read first

Read the following from current `main`, in this order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/product/category-capture-permanent-rollout-spec.md`
6. `docs/product/category-capture-permanent-rollout-plan.md`
7. `docs/product/twitch-replacement-seven-day-audit-spec.md`
8. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
9. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`
10. `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json`
11. `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
12. `docs/work-in-progress/phase12a4-category-parallel-execution.md`
13. the specification and plan for the feature being changed
14. relevant immutable acceptance/evidence records

For Heatmap Canvas work, also read:

- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`

## Current gate

Twitch and Kick permanent category capture are accepted and active on their existing five-minute collectors.

The guarded Twitch recovery began at `2026-07-29T05:30:00.000Z`, passed the final read-only preflight and two-snapshot verification, and was accepted in PR #657. The replacement seven-day accumulation window is active. The earliest final audit is `2026-08-05T05:30:00.000Z` under #659.

The dormant #659 package was implemented in PR #661 and accepted through PR #662. It fixes the audit window as `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`, requires 2016 five-minute slots, and keeps checkpoint mode diagnostic and final mode boundary-gated.

Pre-execution review found `sqlite_cte_scope_cross_statement`. PR #663 repaired the dormant runner before any production checkpoint or final audit executed. Validation run `30475011149` / job `90654426211` passed the package verifier, SQL repair verifier, window/slot tests, category and development policies, web typecheck/build, and public-control absence check. PR #664 freezes the repair acceptance.

The current gate is the bounded checkpoint execution package. Public navigation and normal production exposure for the Twitch category filter remain unauthorized.

## Work allowed before the audit boundary

The period before 2026-08-05 is active development time, not a freeze.

Current order:

1. create and accept `work-659-twitch-replacement-audit-checkpoint-package`;
2. execute checkpoint mode only through the accepted bounded read-only path and freeze sanitized diagnostic evidence;
3. perform Heatmap Canvas PR-1 responsibility separation with no behavior change;
4. add a Canvas scene only behind a hidden route or disabled flag after PR-1 acceptance;
5. inspect and fix #148 Day Flow/Battle Lines provider parity.

These tasks must not change either collector cadence, D1 schema, backfill, retention, Kick runtime from Twitch-only work, provider identity rules, or public category-filter exposure.

## Current evidence and decision chain

- Original rejected audit: Issue #650 and PR #651.
- Recovery package: PRs #653 and #654.
- Recovery trigger: PR #655.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Recovery acceptance and execution-path retirement: PR #657.
- Canonical v33 synchronization: PR #658 and commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Replacement audit: Issue #659.
- Replacement audit package: PR #661, merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Replacement package validation: run `30455002204`, job `90586212618`.
- Replacement package acceptance: PR #662, merge `3f15d18ee3f7b31a71b10ff6f192eead404da92b`.
- Runner repair: PR #663, merge `ab33afa4d6195532652791be2380a1fa9a278491`.
- Runner repair validation: run `30475011149`, job `90654426211`.
- Runner repair acceptance: PR #664 and `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`.
- Hidden Twitch Heatmap filter: Issue #635, API PR #638, controls PR #640, canonical acceptance PR #642.
- Kick permanent category final acceptance: PR #648.

## Invariants

- Twitch and Kick remain separate products, databases, collectors, APIs, options, URL state, and results.
- Existing collector cadence remains five minutes for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion is authorized.
- Existing unfiltered Heatmap remains the production fallback.
- Missing, partial, stale, empty, error, demo, unknown-category, and unavailable states remain distinct.
- A checkpoint never accepts #659 or exposes public UI.
- A passing final audit does not itself expose public UI; a separate cutover PR is required.

## Documentation governance

- Before every task and again before merge, read current-main roadmap, schedule, gate, affected specification/plan, active WIP, and development policy.
- Record the current-main SHA and governing documents in the PR.
- If current documents conflict or are stale, update them before implementation proceeds.
- Historical evidence is immutable but does not override current authorization.
- Current status belongs in roadmap, schedule, canonical gate, active WIP, and the relevant live specification/plan.
