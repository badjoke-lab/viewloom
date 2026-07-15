# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-15

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
Kick execution merge identity recorded PR #564
canonical gate 12A-4-10 exact one-file Kick trigger
exact trigger present no
category capture started no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/audits/12a4-category-capture-enablement-decision-contract.json`
6. `docs/audits/12a4-kick-category-capture-canary-package-contract.json`
7. `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`
8. `docs/work-in-progress/phase12a4-kick-category-capture-canary.md`
9. `docs/work-in-progress/phase12a4-kick-category-capture-canary-execution.md`

## Current category evidence chain

- Source paths and availability: `docs/audits/12a4-category-source-audit-evidence.json`
- Storage budget: `docs/audits/12a4-category-storage-budget-evidence.json`
- Disabled runtime production evidence: `docs/audits/12a4-disabled-runtime-postmerge-evidence.json`
- Read-only production preflight: `docs/audits/12a4-category-readonly-preflight-evidence.json`
- Final provider schema state: `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- Accepted execution-cost evidence: `docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json`
- Accepted provider sequence: `docs/audits/12a4-category-capture-enablement-decision-contract.json`
- Accepted dormant Kick package: `docs/audits/12a4-kick-category-capture-canary-package-contract.json`
- Accepted dormant Kick execution package: `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`

## Permanent product and operations records

- Local Watchlist specification: `product/local-watchlist-spec.md`
- Local Watchlist implementation record: `product/watchlist-v1-implementation-plan.md`
- Local Watchlist production acceptance: `operations/watchlist-production-acceptance-2026-06-25.md`

## Current gate

The canonical gate is 12A-4-10: the exact one-file Kick category capture canary trigger. The disabled Kick package and dormant execution package are accepted, and PR #564 recorded the exact PR #563 merge identity. This gate-advancement change contains no trigger. Production runtime category capture remains unauthorized, the normal Kick collector remains unchanged, and Twitch remains blocked until accepted Kick canary evidence exists.

## Invariants

- Twitch and Kick remain separate.
- Both production category schemas are complete.
- Normal collector configuration does not contain `CATEGORY_CAPTURE_ENABLED`.
- Production runtime category capture has not started.
- No exact Kick canary trigger exists.
- Schema and execution-cost production triggers are retired.
- No new cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category rankings are authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
