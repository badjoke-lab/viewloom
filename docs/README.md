# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-18

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source, storage, schema, and execution-cost gates accepted
Kick bounded canary completed, rolled back, accepted, and retired
Twitch canary package accepted PR #590
Twitch execution package accepted PR #591 and PR #592
Twitch storage preflight accepted PR #599 and finalized PR #600
Twitch start-order fix accepted PR #609
Twitch monitor parser fix accepted PR #613
Twitch attempt 3 exact trigger accepted PR #614
Twitch attempt 3 start run: 29631153598 / artifact: 8425765411
Twitch attempt 3 first monitor: 29634222309 / artifact: 8426512098
canonical gate 12A-4-17 Twitch attempt 3 active; first checkpoint passed
exact Twitch trigger current yes
fresh Twitch start preflight accepted yes
Twitch bounded category capture active yes
permanent category capture flag present no
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
14. `docs/work-in-progress/phase12a4-twitch-category-capture-canary-storage-preflight.md`

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
- Accepted Twitch execution package and active bounded attempt 3: `docs/audits/12a4-twitch-category-capture-canary-execution-contract.json`
- Accepted Twitch storage preflight: `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json`
- Frozen Twitch storage evidence: `docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json`

## Permanent product and operations records

- Local Watchlist specification: `product/local-watchlist-spec.md`
- Local Watchlist implementation record: `product/watchlist-v1-implementation-plan.md`
- Local Watchlist production acceptance: `operations/watchlist-production-acceptance-2026-06-25.md`

## Current gate

The canonical gate is 12A-4-17. Twitch attempt 3 reached its exact start boundary, passed a same-job read-only production preflight, and deployed the bounded canary. Start run `29631153598` produced artifact `8425765411`. The first scheduled monitor run `29634222309` produced artifact `8426512098` and passed with 163 Twitch dictionary rows, 30 category payload rows, zero provider leakage, 370.03 MB projected 90-day Twitch size, 79.97 MB provider headroom, and 864.75 MB projected account-wide headroom.

The bounded window ends at `2026-07-19T05:15:00.000Z`. Scheduled checkpoints and the exact-expiry wrapper remain active. Final acceptance requires normal-config rollback, absent canary bindings, zero provider leakage, no post-grace category payload, and fresh authenticated non-empty normal Twitch collection. Permanent runtime category capture is not authorized.

## Invariants

- Twitch and Kick remain separate.
- The active capture is Twitch attempt 3 only and is bounded by the exact trigger window.
- Normal collector configuration does not contain `CATEGORY_CAPTURE_ENABLED`.
- Kick category capture is inactive and its production execution path is retired.
- Twitch attempt 3 has no permanent category flag.
- Scheduled monitoring must hard-stop and restore the normal Twitch config on a failed gate.
- Final rollback and post-expiry observation are still pending.
- No new cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category rankings are authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
