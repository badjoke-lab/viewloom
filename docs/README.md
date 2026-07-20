# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-20

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries accepted and retired
canonical gate 12A-4-21 Twitch release package accepted; exact trigger pending
Twitch permanent implementation package accepted yes
Twitch permanent release package accepted yes
Twitch permanent category capture active no
Exact release trigger current no
Kick permanent implementation authorized no
normal Twitch cadence */5 * * * *
new Worker schedule authorized no
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
8. `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
9. `docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json`
10. `docs/audits/12a4-twitch-permanent-category-release-contract.json`
11. `docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json`
12. `docs/audits/12a4-category-source-audit-evidence.json`
13. `docs/audits/12a4-category-storage-budget-evidence.json`
14. `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`
15. `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`

## Current category evidence chain

- Source paths and availability: `docs/audits/12a4-category-source-audit-evidence.json`
- Storage budget: `docs/audits/12a4-category-storage-budget-evidence.json`
- Existing category schema: `docs/audits/12a4-category-migration-runtime-contract.json`
- Accepted execution-cost evidence: `docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json`
- Final Kick canary evidence: `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`
- Final Twitch canary evidence: `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`
- Permanent rollout specification: `docs/product/category-capture-permanent-rollout-spec.md`
- Permanent rollout plan: `docs/product/category-capture-permanent-rollout-plan.md`
- Accepted Twitch implementation contract: `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
- Accepted Twitch implementation evidence: `docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json`
- Accepted Twitch release contract: `docs/audits/12a4-twitch-permanent-category-release-contract.json`
- Accepted Twitch release-package evidence: `docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json`

## Current gate

The canonical gate is 12A-4-21. The Twitch permanent-category implementation and dormant release packages are accepted. The exact release trigger is absent and no permanent runtime capture is active yet.

The current action is one exact trigger file pinned to the accepted release-package merge SHA and a start boundary inside the three-hour runner limit. The main workflow must run the fresh read-only preflight before release, verify two consecutive category-bearing real non-empty snapshots, and restore the normal configuration automatically on failed initial verification.

Kick remains unauthorized pending Twitch final acceptance and a separate explicit decision. Category UI, backfill, retention expansion, cross-provider identity, and combined rankings remain unauthorized.

## Invariants

- Twitch and Kick remain separate.
- Accepted Twitch implementation and release packages do not authorize Kick.
- Runtime capture remains inactive until an accepted exact release trigger runs successfully.
- Normal collector cadence remains five minutes.
- No new Worker schedule, backfill, retention expansion, category UI, cross-provider category identity, or combined category ranking is authorized.
- Every category PR must cite the current specification, plan, roadmap, schedule, gate, active WIP, implementation contract, release contract, and development policy.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
