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
Dormant runner package accepted PR #661 / #662
Runner repair accepted PR #663 / #664
Checkpoint package accepted PR #665 / #666
Current branch work-659-twitch-replacement-audit-checkpoint-trigger
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
5. `docs/product/twitch-replacement-seven-day-audit-spec.md`
6. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
7. `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
8. `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
9. `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
10. `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`
11. `docs/work-in-progress/phase12a4-category-parallel-execution.md`
12. the specification and plan for the feature being changed
13. relevant immutable acceptance/evidence records

For Heatmap Canvas work, also read:

- `docs/product/heatmap-canvas-redesign-spec.md`
- `docs/product/heatmap-canvas-implementation-plan.md`

## Current gate

Twitch and Kick permanent category capture are accepted and active on their existing five-minute collectors.

The guarded Twitch recovery began at `2026-07-29T05:30:00.000Z` and was accepted in PR #657. The replacement seven-day accumulation window remains active; the earliest final audit is `2026-08-05T05:30:00.000Z` under #659.

The dormant runner was accepted through PRs #661/#662. The SQL scope repair was merged in PR #663 and accepted in PR #664 before any production checkpoint/final execution.

The bounded checkpoint package was merged in PR #665 as `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`. Validation run `30476596379` / job `90659857133` passed the trigger-absence, package, repair, 2016-slot, policy, typecheck/build, and public-containment gates. PR #666 freezes package acceptance.

The current gate is the exact one-file checkpoint trigger. Public navigation and normal production exposure for the Twitch category filter remain unauthorized.

## Current order

1. add only `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json` on `work-659-twitch-replacement-audit-checkpoint-trigger`;
2. bind it to package PR #665 and merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`;
3. merge only after exact trigger validation;
4. execute checkpoint mode once on main push;
5. freeze sanitized checkpoint evidence and exact run/job/artifact/digest identities;
6. retire the trigger and temporary execution path;
7. then proceed with Heatmap Canvas PR-1 and #148 provider parity;
8. execute final mode only at or after the accepted final boundary.

## Current evidence and decision chain

- Original rejected audit: Issue #650 and PR #651.
- Recovery package/acceptance/trigger: PRs #653, #654, #655.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Recovery acceptance: PR #657.
- Canonical v33 synchronization: PR #658.
- Replacement runner package/acceptance: PRs #661 and #662.
- Runner repair/acceptance: PRs #663 and #664.
- Checkpoint package: PR #665, merge `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
- Checkpoint validation: run `30476596379`, job `90659857133`.
- Checkpoint package acceptance: PR #666.
- Hidden Twitch Heatmap filter: Issue #635, API PR #638, controls PR #640, canonical acceptance PR #642.
- Kick permanent category final acceptance: PR #648.

## Invariants

- Twitch and Kick remain separate products, databases, collectors, APIs, options, URL state, and results.
- Existing collector cadence remains five minutes for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion is authorized.
- Checkpoint execution is Cloudflare GET and D1 SELECT/WITH only.
- Existing unfiltered Heatmap remains the production fallback.
- Missing, partial, stale, empty, error, demo, unknown-category, and unavailable states remain distinct.
- A checkpoint never accepts #659, guarantees final acceptance, authorizes mutation, or exposes public UI.
- A passing final audit does not itself expose public UI; a separate cutover PR is required.

## Documentation governance

- Before every task and again before merge, read current-main roadmap, schedule, gate, affected specification/plan, active WIP, and development policy.
- Record the current-main SHA and governing documents in the PR.
- If current documents conflict or are stale, update them before implementation proceeds.
- Historical evidence is immutable but does not override current authorization.
- Current status belongs in roadmap, schedule, canonical gate, active WIP, and the relevant live specification/plan.
