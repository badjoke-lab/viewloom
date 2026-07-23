# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-23

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
canonical target 12A-4-24 category parallel execution
Twitch permanent category capture accepted and active yes
Kick permanent implementation authorized yes
Kick permanent runtime active no
Twitch Heatmap hidden category-filter implementation authorized yes
Twitch Heatmap public category-filter exposure authorized no
Twitch seven-day audit earliest 2026-07-27T11:40:00Z
existing Twitch cadence */5 * * * *
existing Kick cadence */5 * * * *
new Worker cron authorized no
backfill authorized no
retention expansion authorized no
cross-provider identity or combined ranking authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/category-capture-permanent-rollout-spec.md`
3. `docs/product/category-capture-permanent-rollout-plan.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/audits/12a2-current-gate-state.json`
7. `docs/work-in-progress/phase12a4-category-parallel-execution.md`
8. `docs/audits/12a4-kick-permanent-category-decision-contract.json`
9. `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
10. `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`

## Current category evidence and decision chain

- Source and storage evidence remain accepted and provider separated.
- Final Kick and Twitch bounded-canary evidence remains historical accepted evidence.
- Twitch permanent implementation, release, production start, and final observation are accepted.
- Final Twitch permanent-category acceptance: `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`.
- Kick permanent rollout authorization: `docs/audits/12a4-kick-permanent-category-decision-contract.json`.
- Hidden Twitch Heatmap filter authorization: `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`.
- Active parallel execution record: `docs/work-in-progress/phase12a4-category-parallel-execution.md`.

## Current gate

The canonical target is 12A-4-24. Twitch permanent category capture is accepted and active. Kick permanent capture implementation and guarded rollout are authorized, but Kick runtime remains inactive until package acceptance, fresh preflight, and an exact release trigger.

The Twitch Heatmap category filter may be implemented and tested behind a disabled feature flag or non-public route. Public navigation and normal production exposure remain unauthorized until the seven-day Twitch accumulation audit at or after 2026-07-27 20:40 JST and a separate public cutover PR.

## Invariants

- Twitch and Kick remain separate data products, databases, collectors, APIs, options, URL state, and results.
- Twitch acceptance does not supply Kick production or UI evidence.
- Existing collector cadence remains five minutes for both providers.
- No new Worker cron, backfill, or retention expansion is authorized.
- Hidden Twitch UI implementation must not become public before the gate.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.
- Cross-provider category identity, mapping, totals, and combined rankings are prohibited.
- Missing, partial, stale, empty, error, demo, unknown-category, and unavailable states remain distinct where applicable.

## Documentation governance

- Every category PR must read and cite the current specification, rollout plan, roadmap, schedule, canonical gate, active WIP, relevant decision contract, and development policy.
- Accepted evidence is immutable except when replaced by later exact-identity acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation and WIP files must not be presented as current authorization.
- Production workflows require explicit contracts, sanitized evidence, rollback, and retirement steps.
- Hidden UI acceptance and public UI exposure are separate gates.