# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-19

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source, storage, schema, and execution-cost gates accepted
Kick bounded canary completed, rolled back, accepted, and retired
Twitch bounded canary completed, rolled back, accepted, and retired
Twitch finalizer run: 29677847983 / artifact: 8439540426
Twitch post-rollback acceptance run: 29683729428 / artifact: 8441534201
Twitch category payload after expiry grace: 0 rows
canonical gate 12A-4-18 provider canaries accepted and retired
exact Twitch trigger current no
Twitch bounded category capture active no
permanent category capture flag present no
permanent runtime category capture authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/audits/12a4-category-capture-enablement-decision-contract.json`
6. `docs/audits/12a4-kick-category-capture-canary-package-contract.json`
7. `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`
8. `docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json`
9. `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`
10. `docs/audits/12a4-twitch-category-capture-canary-package-contract.json`
11. `docs/audits/12a4-twitch-category-capture-canary-execution-contract.json`
12. `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json`
13. `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json`
14. `docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json`
15. `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`

## Current category evidence chain

- Source paths and availability: `docs/audits/12a4-category-source-audit-evidence.json`
- Storage budget: `docs/audits/12a4-category-storage-budget-evidence.json`
- Disabled runtime production evidence: `docs/audits/12a4-disabled-runtime-postmerge-evidence.json`
- Read-only production preflight: `docs/audits/12a4-category-readonly-preflight-evidence.json`
- Final provider schema state: `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- Accepted execution-cost evidence: `docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json`
- Accepted provider sequence: `docs/audits/12a4-category-capture-enablement-decision-contract.json`
- Accepted dormant Kick package: `docs/audits/12a4-kick-category-capture-canary-package-contract.json`
- Accepted and retired Kick execution package: `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`
- Accepted Kick attempt 3 initial checkpoint: `docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json`
- Accepted final Kick post-rollback evidence: `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`
- Accepted and retired cleanup chain: `docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json`
- Accepted dormant Twitch package: `docs/audits/12a4-twitch-category-capture-canary-package-contract.json`
- Accepted and retired Twitch execution package: `docs/audits/12a4-twitch-category-capture-canary-execution-contract.json`
- Accepted Twitch storage preflight: `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json`
- Frozen Twitch storage evidence: `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json`
- Accepted Twitch post-rollback contract: `docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json`
- Accepted final Twitch evidence: `docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json`

## Permanent product and operations records

- Local Watchlist specification: `product/local-watchlist-spec.md`
- Local Watchlist implementation record: `product/watchlist-v1-implementation-plan.md`
- Local Watchlist production acceptance: `operations/watchlist-production-acceptance-2026-06-25.md`

## Current gate

The canonical gate is 12A-4-18. Both provider-separated bounded category canaries completed their observation windows, returned to normal configurations, passed post-expiry acceptance, and retired their production execution paths.

The final Twitch evidence records 434 dictionary rows, 287 category-bearing snapshots inside the bounded window, zero category-bearing snapshots after the ten-minute grace boundary, zero provider leakage, and a fresh real non-empty normal snapshot with 300 streams. Projected Twitch 90-day size is 372.64 MB, provider headroom is 77.36 MB, and projected account-wide headroom is 777.09 MB.

Permanent runtime category capture is not authorized. Historical category rows are retained as accepted evidence; no bounded canary is active.

## Invariants

- Twitch and Kick remain separate.
- No bounded category canary is active.
- Normal collector configurations do not contain `CATEGORY_CAPTURE_ENABLED`.
- Kick and Twitch canary production execution paths are retired.
- No permanent category flag was introduced.
- Normal Twitch cadence remains five minutes.
- No new cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category rankings are authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
