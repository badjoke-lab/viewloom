# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-23

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-4-24 parallel execution
Twitch permanent category capture accepted and active yes
Kick permanent implementation package accepted yes
Kick permanent release package accepted no
Kick permanent runtime active no
Twitch Heatmap hidden category API package accepted yes
Twitch Heatmap hidden control package accepted no
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

The two tracks proceed in parallel. Every PR must identify its track and cite the current specification, plan, roadmap, schedule, canonical gate, active WIP, relevant decision/package contracts, and development policy.

## Track A — Kick permanent category capture

Completed:

1. 12A-4-24 documentation, decision contracts, canonical authorization, and policy synchronization merged in PR #636.
2. Kick permanent configuration and normal rollback configuration added in PR #637.
3. Extraction, dictionary, payload, provider-separation, fixture, package-contract, collector-typecheck, normal dry-run, and permanent dry-run gates passed.
4. Implementation package accepted without production publish or remote D1 mutation.

Next:

1. Prepare a separate dormant release package bound to PR #637 merge `b4012ebddb9ec33c50b6298c882f0f1a4ee16be0`.
2. Run a fresh read-only Kick production preflight using Cloudflare GET and D1 SELECT only.
3. Accept the release package without publishing production.
4. Create an exact one-file trigger on main only after the fresh preflight passes.
5. Publish only `workers/collector-kick/wrangler.category-permanent.toml`.
6. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
7. Observe for at least 24 hours.
8. Extend to 48 hours on warning; restore normal Kick configuration immediately on a hard stop.
9. Freeze final evidence, accept or roll back Kick, and retire all temporary paths.

## Track B — hidden Twitch Heatmap category filter

Completed:

1. Twitch Heatmap API now returns provider-specific category ID, name, and available-category options through PR #638.
2. `category-source-v1` IDs/refs are decoded and dictionary names are resolved.
3. Hidden `category` and `top=20|50|100` query handling applies category filtering before Top N.
4. `all`, `selected`, `unknown_category`, and `category_unavailable` API states are accepted.
5. Public navigation, normal visible controls, collector, Kick, backfill, and retention remain unchanged.

Next:

1. Implement hidden or feature-flagged controls using the accepted PR #638 API contract.
2. Add `All categories` as the default visible state inside the hidden implementation.
3. Persist selection in Twitch-specific URL state.
4. Present loading, empty, partial, stale, demo, unknown-category, category-unavailable, and error states.
5. Add desktop, mobile, keyboard, accessibility, browser, and regression tests.
6. Preserve the existing unfiltered Heatmap as fallback.
7. Accept the complete hidden control package independently of public exposure.

## Twitch seven-day accumulation gate

At or after `2026-07-27T11:40:00Z` / 2026-07-27 20:40 JST:

1. run a read-only audit of Twitch category-bearing snapshot continuity since `2026-07-20T11:40:00Z`;
2. verify collector errors, provider leakage, freshness, real/non-empty state, dictionary continuity, bounded growth, and storage headroom;
3. verify complete hidden implementation acceptance and public exposure still disabled during the audit;
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
7. the relevant decision and package contracts;
8. `docs/operations/development-and-deployment-policy.md`.