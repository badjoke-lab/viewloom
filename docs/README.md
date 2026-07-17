# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-17

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
12A-4 Twitch and Kick category schemas complete and audited PR #545
12A-4 bounded execution-cost probe accepted and retired through PR #559
12A-4 provider-separated canary sequencing accepted PR #561
Kick dormant canary package accepted PR #562
Kick dormant execution package accepted PR #563
Kick execution-path repair accepted PR #580
Kick attempt 3 exact trigger accepted PR #581
Kick attempt 3 initial read-only checkpoint accepted PR #579
Kick expired-binding cleanup package accepted PR #586
Kick expired-binding cleanup trigger accepted PR #587
Kick cleanup production path retired PR #588
canonical gate 12A-4-12 Kick final observation and rollback accepted
exact Kick trigger current no
bounded Kick category capture active no
Kick execution push and hourly schedule retired yes
permanent category capture flag present no
Twitch category capture started no
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
10. `docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md`

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

## Permanent product and operations records

- Local Watchlist specification: `product/local-watchlist-spec.md`
- Local Watchlist implementation record: `product/watchlist-v1-implementation-plan.md`
- Local Watchlist production acceptance: `operations/watchlist-production-acceptance-2026-06-25.md`

## Current gate

The canonical gate is 12A-4-12: Kick category capture canary final observation and rollback accepted. Final artifact `8399137444` proves that the attempt-3 window expired, all canary bindings are absent, permanent category capture remains disabled, no category payload was written after the ten-minute grace boundary, provider leakage is zero, and normal authenticated non-empty Kick snapshots resumed. The exact Kick trigger, hourly monitor/finalizer, cleanup deployment path, and production post-rollback probe are retired.

Twitch is now eligible only for a separate canary-package evaluation. Twitch has not started, is not automatically authorized, and permanent runtime category capture remains unauthorized.

## Invariants

- Twitch and Kick remain separate.
- Both production category schemas are complete.
- Normal collector configuration does not contain `CATEGORY_CAPTURE_ENABLED`.
- Kick category capture is not active.
- Permanent runtime category capture is not authorized.
- The exact Kick attempt 3 trigger is consumed and retired.
- The Kick canary push path and hourly schedule are retired.
- The cleanup deployment path and post-rollback production probe are retired.
- Twitch category capture has not started.
- Schema and execution-cost production triggers are retired.
- No new cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category rankings are authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
