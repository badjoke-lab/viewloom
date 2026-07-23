# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-23

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-4-24 parallel execution
Twitch permanent category capture accepted and active yes
Kick permanent implementation authorized yes
Kick permanent runtime active no
Twitch Heatmap hidden category-filter implementation authorized yes
Twitch Heatmap public category-filter exposure authorized no
Twitch seven-day audit earliest 2026-07-27T11:40:00Z
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
```

## Active parallel sequence

The two tracks may proceed in parallel. A PR must identify one track unless it is a documentation or policy synchronization PR.

## Track A — Kick permanent category capture

1. Merge the 12A-4-24 documentation, decision contracts, canonical gate, and policy synchronization.
2. Run a fresh read-only Kick production preflight using Cloudflare GET and D1 SELECT only.
3. Prepare the Kick permanent-category implementation package.
4. Preserve the current normal Kick configuration as rollback.
5. Validate extraction, dictionary writes, category-bearing payloads, provider separation, typecheck, fixtures, normal dry-run, and permanent dry-run.
6. Merge implementation acceptance without deploying production.
7. Prepare and accept a separate dormant release package.
8. Create an exact one-file trigger on main only after a fresh passing preflight.
9. Publish only the accepted Kick-scoped configuration.
10. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
11. Observe for at least 24 hours.
12. Extend to 48 hours on warning; restore normal Kick configuration immediately on a hard stop.
13. Freeze final evidence, accept or roll back Kick, and retire all temporary trigger, release, observation, and reconciliation paths.

## Track B — hidden Twitch Heatmap category filter

1. Extend the Twitch Heatmap API contract with provider-specific category ID, name, and available-category options.
2. Add `All categories` as the default state.
3. Filter before Top 20 / 50 / 100 selection and treemap layout.
4. Persist selection in a Twitch-specific URL query.
5. Implement loading, empty, partial, stale, demo, unknown-category, and category-unavailable states.
6. Add desktop, mobile, keyboard, accessibility, API-contract, browser, and regression tests.
7. Keep the feature behind a disabled flag or non-public route.
8. Keep public navigation, default-route controls, and normal production exposure absent.
9. Preserve the existing unfiltered Heatmap as fallback.
10. Accept the hidden implementation package independently of public exposure.

## Twitch seven-day accumulation gate

At or after `2026-07-27T11:40:00Z` / 2026-07-27 20:40 JST:

1. run a read-only audit of Twitch category-bearing snapshot continuity since `2026-07-20T11:40:00Z`;
2. verify collector errors, provider leakage, freshness, real/non-empty state, dictionary continuity, bounded growth, and storage headroom;
3. verify hidden implementation acceptance and public exposure still disabled during the audit;
4. authorize a separate public cutover PR only if every gate passes;
5. otherwise keep the feature hidden and record the failed or extended gate.

The seven-day boundary blocks public exposure only. It does not block hidden implementation or Kick rollout work.

## Public Twitch cutover

A separate PR must explicitly:

- enable the normal Twitch Heatmap category control;
- expose no Kick category UI;
- retain `All categories` and the unfiltered fallback;
- pass production browser, mobile, accessibility, and data-truth checks;
- record exact build and deployment identities.

## Hard stops

### Kick

- permanent Kick flag absent after release or obsolete canary bindings present;
- provider leakage greater than zero;
- projected Kick 90-day size greater than 440 MB or provider headroom below 10 MB;
- projected account-wide D1 headroom below 500 MB;
- latest Kick collection stale, non-real, or empty for two consecutive expected cycles;
- category payload absent for three consecutive otherwise successful snapshots;
- repeated collector or D1 failures;
- any unexpected Twitch configuration, binding, row, API, or runtime change.

### Hidden Twitch filter

- public nav or normal-route exposure before authorization;
- collector, cron, retention, backfill, Kick, or cross-provider mutation;
- category selection applied after Top N instead of before Top N;
- provider category identity or URL state shared across Twitch and Kick;
- demo, empty, partial, stale, unknown, or unavailable states collapsed into false real data.

## Mandatory references

Every category PR must read and cite:

1. `docs/product/category-capture-permanent-rollout-spec.md`;
2. `docs/product/category-capture-permanent-rollout-plan.md`;
3. `docs/product/current-roadmap.md`;
4. this schedule;
5. `docs/audits/12a2-current-gate-state.json`;
6. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
7. the relevant Kick or hidden Twitch decision contract;
8. `docs/operations/development-and-deployment-policy.md`.