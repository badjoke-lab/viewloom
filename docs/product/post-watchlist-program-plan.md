# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan  
Version: 12.0  
Last updated: 2026-07-14  
Current phase: Phase 12A — Analytics Capture Foundation  
Current workstream: 12A-4-5 bounded provider-separated category execution-cost probe design  
Production intraday generation started: yes  
Category runtime capture started: no

```text
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and production accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
12A-4 Twitch and Kick category schemas complete and audited PR #545
Schema execution and recovery triggers retired
```

## Program objective

Finish the provider-specific category capture foundation without exceeding free-tier operating limits or weakening data honesty. The schema is complete; the remaining question is whether bounded runtime category generation is cheap and stable enough to enable later.

## Current gate: 12A-4-5

Build and accept a production-ready **package**, not a production execution, for one bounded category probe per provider.

The package must:

- consume the accepted complete-schema evidence;
- preserve Twitch/Kick separation;
- restrict writes to reserved probe identifiers;
- measure query count, rows read/written, D1 changes, SQL duration, Worker wall time, database-size delta, and collector-latency delta;
- prove the dictionary second pass is a no-op;
- clean all probe rows and dictionary entries;
- verify cleanup remaining rows and provider leakage are zero;
- delete temporary Workers and verify HTTP 404;
- leave `CATEGORY_CAPTURE_ENABLED` absent.

## Delivery sequence

### 12A-4-5 — bounded probe design and package

1. Define reserved probe input and provider-specific bindings.
2. Implement local success, no-op, cleanup, and failure fixtures.
3. Implement sanitized evidence collection and verification.
4. Add strict scope and package identity checks.
5. Run TypeScript, fixture, Development policy, and Wrangler dry-run gates.
6. Merge without production execution.

### 12A-4-6 — one-time production probe and acceptance

1. Open a one-file trigger PR pinned to the package head and merge SHA.
2. Execute Twitch first.
3. Clean Twitch and prove zero remaining rows before Kick begins.
4. Execute and clean Kick.
5. Upload sanitized evidence even on failure.
6. Accept only the exact push SHA and artifact.
7. Freeze accepted evidence on `main`.
8. Retire the trigger and production workflow.

### 12A-4-7 — capture enablement decision

Enablement remains a separate decision. It may proceed only when both provider probes pass and all reserved data is removed. Any enablement package must preserve the existing cron schedule, keep provider-specific failure isolation, define a disable path, and include post-merge observation.

## Permanent boundaries

- No cross-provider category identity.
- No combined Twitch/Kick category totals or rankings.
- No category backfill.
- No raw-retention expansion.
- No new cron.
- No category analytics UI before the capture gate is accepted.
- No schema reapply; both provider schemas are already complete.
- Do not drop category columns as rollback. Disable runtime and preserve evidence.

## Canonical files

- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- `docs/audits/12a4-category-execution-cost-probe-contract.json`
- `docs/work-in-progress/phase12a4-category-execution-cost-probe.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
