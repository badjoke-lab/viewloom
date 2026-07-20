# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-20

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries accepted and retired
canonical gate 12A-4-19 Twitch permanent capture authorized; implementation pending
Twitch permanent implementation authorized yes
Twitch permanent category capture active no
Kick permanent implementation authorized no
normal Twitch cadence */5 * * * *
new Worker cron authorized no
backfill authorized no
retention expansion authorized no
category UI authorized no
cross-provider identity or combined ranking authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/category-capture-permanent-rollout-spec.md`
3. `docs/product/category-capture-permanent-rollout-plan.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/audits/12a2-current-gate-state.json`
7. `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
8. `docs/audits/12a4-category-source-audit-evidence.json`
9. `docs/audits/12a4-category-storage-budget-evidence.json`
10. `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`
11. `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`

## Current category evidence chain

- Source paths and availability: `docs/audits/12a4-category-source-audit-evidence.json`
- Storage budget: `docs/audits/12a4-category-storage-budget-evidence.json`
- Existing category schema: `docs/audits/12a4-category-migration-runtime-contract.json`
- Accepted execution-cost evidence: `docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json`
- Final Kick canary evidence: `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`
- Final Twitch canary evidence: `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`
- Permanent rollout specification: `docs/product/category-capture-permanent-rollout-spec.md`
- Permanent rollout plan: `docs/product/category-capture-permanent-rollout-plan.md`

## Current gate

The canonical gate is 12A-4-19. Completed provider-separated canaries justify a Twitch-first permanent rollout. Twitch implementation is authorized, but no permanent runtime capture is active yet.

The next deliverable is a Twitch-only implementation package. It must preserve the existing five-minute Worker cron, use the accepted category schema and contract, include rollback and fresh preflight paths, and perform no production deployment from its implementation PR.

Kick remains unauthorized pending Twitch final acceptance and a separate explicit decision. Category UI, backfill, retention expansion, cross-provider identity, and combined rankings remain unauthorized.

## Invariants

- Twitch and Kick remain separate.
- Twitch implementation authorization does not authorize Kick.
- Runtime capture remains inactive until exact deployment acceptance.
- Normal collector cadence remains five minutes.
- No new Worker cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category ranking is authorized.
- Every category PR must cite the current specification, plan, roadmap, schedule, gate, and development policy.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
