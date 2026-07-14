# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-14

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
12A-4 Twitch and Kick category schemas complete and audited PR #545
Schema execution and recovery triggers retired
Current workstream 12A-4-5 bounded provider-separated category execution-cost probe design
category capture started no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
6. `docs/audits/12a4-category-execution-cost-probe-contract.json`
7. `docs/work-in-progress/phase12a4-category-execution-cost-probe.md`

## Current category evidence chain

- Source paths and availability: `docs/audits/12a4-category-source-audit-evidence.json`
- Storage budget: `docs/audits/12a4-category-storage-budget-evidence.json`
- Disabled runtime production evidence: `docs/audits/12a4-disabled-runtime-postmerge-evidence.json`
- Read-only production preflight: `docs/audits/12a4-category-readonly-preflight-evidence.json`
- Final provider schema state: `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- Current cost-probe contract: `docs/audits/12a4-category-execution-cost-probe-contract.json`

## Current gate

12A-4-5 is a design/package gate. It must not execute production work. The package must define a bounded reserved probe, provider order, query and latency measurements, complete cleanup, evidence normalization, and stop conditions. Production execution requires a later one-file trigger PR.

## Invariants

- Twitch and Kick remain separate.
- Both production category schemas are complete.
- `CATEGORY_CAPTURE_ENABLED` remains absent.
- Production category rows remain absent.
- Schema execution and recovery workflows are validation-only archives.
- No new cron, backfill, retention expansion, category UI, cross-provider category identity, or combined category rankings are authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by a later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Any production workflow requires an explicit contract, a separate trigger, sanitized evidence, and a retirement step.
