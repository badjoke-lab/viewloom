# 12A-4-24 category parallel execution

## Status

Twitch permanent category capture is accepted and active. The first implementation package in each parallel track is now accepted:

- Track A: Kick permanent category implementation package accepted; fresh preflight and dormant release package are next under Issue #634.
- Track B: hidden Twitch Heatmap category API package accepted; hidden controls and browser/mobile/accessibility behavior are next under Issue #635.

Public Twitch category-filter exposure remains unauthorized until the seven-day Twitch accumulation audit and a separate public cutover PR.

## Accepted Twitch baseline

- Production start: `2026-07-20T11:40:00.000Z`.
- Final acceptance PR: #633.
- Final observation run: 29827696569.
- Final observation job: 88624752189.
- Final artifact: 8493912964.
- Observed category snapshots: 291.
- Expected category snapshots: 290.
- Coverage ratio: 1.0.
- Collector errors: 0.
- Provider leakage: 0.
- Projected 90-day size: 378.59 MB.
- Provider headroom: 71.41 MB.
- Account-wide headroom: 626.08 MB.

## Track A — Kick permanent capture

### Accepted package

- Implementation package PR: #637.
- Merge SHA: `b4012ebddb9ec33c50b6298c882f0f1a4ee16be0`.
- Validation run: 30003489805.
- Validation job: 89193908765.
- Permanent config: `workers/collector-kick/wrangler.category-permanent.toml`.
- Normal rollback config: `workers/collector-kick/wrangler.toml`.
- Fixture, package contract, category policy, collector typecheck, normal dry-run, and permanent dry-run: passed.
- Production publish from package PR: no.
- Remote D1 operation from package PR: no.
- Kick production runtime active: no.
- Twitch changed: no.

### Immediate work order

1. Prepare a dormant Kick release package that consumes the accepted implementation package.
2. Run a fresh read-only Kick production preflight using Cloudflare GET and D1 SELECT only.
3. Accept the release package without publishing production.
4. Use a separate exact one-file trigger on main after the fresh preflight passes.
5. Publish only the accepted Kick permanent config.
6. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
7. Observe for at least 24 hours, extend to 48 hours on warning, or roll back on a hard stop.
8. Freeze final evidence and retire temporary paths.

### Hard boundary

No Twitch configuration, binding, row, API, runtime, or public UI change is permitted from the Kick track.

## Track B — hidden Twitch Heatmap filter

### Accepted API package

- Hidden API package PR: #638.
- Merge SHA: `5b466e3e440324bbd6b19d60aa3acaed0d1d95e8`.
- Validation run: 30003251337.
- Validation job: 89193154092.
- Category IDs and refs decoded from `category-source-v1`.
- Names resolved from the Twitch category dictionary.
- Category metadata attached to Heatmap items.
- Available-category options returned provider-specifically.
- Category filtering occurs before Top 20 / 50 / 100 slicing.
- `all`, `selected`, `unknown_category`, and `category_unavailable` states implemented at the API layer.
- Public category control or navigation added: no.
- Collector or Kick change: no.

### Immediate work order

1. Create a hidden control package that consumes the accepted API contract.
2. Add `All categories` as the default UI state behind a disabled feature flag or non-public route.
3. Add Twitch-specific URL-state restoration.
4. Add loading, empty, partial, stale, demo, unknown-category, category-unavailable, and error presentation.
5. Add desktop, mobile, keyboard, accessibility, browser, and regression tests.
6. Preserve the existing unfiltered Heatmap as fallback.
7. Freeze hidden implementation acceptance without public exposure.

### Public gate

Earliest audit: `2026-07-27T11:40:00.000Z` / 2026-07-27 20:40 JST.

The audit must verify seven stable Twitch days, category continuity, dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, and storage headroom. A separate public cutover PR is mandatory after both the audit and complete hidden implementation package pass.

## Shared boundaries

- Existing Twitch and Kick Worker cadence remains `*/5 * * * *`.
- No new Worker cron.
- No backfill.
- No retention expansion.
- No cross-provider category identity, mapping, totals, or rankings.
- Provider data, route state, options, and results remain separate.
- Every PR must cite the current specification, plan, roadmap, schedule, canonical gate, this WIP, relevant decision and package contracts, and development policy.

## Mandatory source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-kick-permanent-category-decision-contract.json`
- `docs/audits/12a4-kick-permanent-category-capture-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`