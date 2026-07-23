# 12A-4-24 category parallel execution

## Status

Twitch permanent category capture is accepted and active. The current execution stage contains two separate authorized tracks:

- Track A: Kick permanent category capture rollout under Issue #634.
- Track B: hidden Twitch Heatmap category-filter implementation under Issue #635.

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

### Current authorization

- Kick implementation authorized: yes.
- Kick production runtime active: no.
- Implementation PR production deploy: no.
- Fresh read-only preflight required: yes.
- Separate package acceptance required: yes.
- Separate exact release trigger required: yes.
- Minimum observation: 24 hours.
- Warning observation: 48 hours.
- Automatic rollback on hard stop: required.

### Immediate work order

1. Run a fresh read-only Kick preflight.
2. Prepare the Kick permanent configuration and retain the normal rollback configuration.
3. Add extraction, dictionary, payload, provider-separation, rollback, typecheck, fixture, and dry-run validation.
4. Accept the implementation package without deploying production.
5. Prepare and accept the dormant release package.
6. Use a separate exact trigger after a fresh passing preflight.
7. Verify two consecutive category-bearing Kick snapshots.
8. Observe, accept or roll back, freeze evidence, and retire temporary paths.

### Hard boundary

No Twitch configuration, binding, row, API, runtime, or public UI change is permitted from the Kick track.

## Track B — hidden Twitch Heatmap filter

### Current authorization

- Hidden implementation authorized: yes.
- API contract work authorized: yes.
- Internal feature flag or non-public route authorized: yes.
- Public navigation authorized: no.
- Default-route category control authorized: no.
- Public exposure authorized: no.

### Immediate work order

1. Add Twitch category ID, name, and available-category options to the Heatmap API contract.
2. Add `All categories` as default.
3. Filter before Top N selection and layout.
4. Add Twitch-specific URL state.
5. Add explicit loading, empty, partial, stale, demo, unknown-category, category-unavailable, and error states.
6. Add desktop, mobile, keyboard, accessibility, API-contract, browser, and regression tests.
7. Keep the existing unfiltered Heatmap as fallback.
8. Freeze hidden implementation acceptance without public exposure.

### Public gate

Earliest audit: `2026-07-27T11:40:00.000Z` / 2026-07-27 20:40 JST.

The audit must verify seven stable Twitch days, category continuity, dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, and storage headroom. A separate public cutover PR is mandatory after both the audit and hidden implementation package pass.

## Shared boundaries

- Existing Twitch and Kick Worker cadence remains `*/5 * * * *`.
- No new Worker cron.
- No backfill.
- No retention expansion.
- No cross-provider category identity, mapping, totals, or rankings.
- Provider data, route state, options, and results remain separate.
- Every PR must cite the current specification, plan, roadmap, schedule, canonical gate, this WIP, relevant decision contract, and development policy.

## Mandatory source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-kick-permanent-category-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`