# Phase 12A-4 bounded category execution-cost probe

Status: current umbrella gate; bounded probe package accepted and separate one-file trigger is the next sub-gate  
Tracking issue: #519  
Planning PR: #520  
Read-only preflight acceptance PR: #523  
Post-apply schema audit acceptance PR: #545  
Schema execution retirement PR: #546  
Bounded probe package PR: #547  
Umbrella contract: `docs/audits/12a4-category-execution-cost-probe-contract.json`  
Package contract: `docs/audits/12a4-category-execution-cost-probe-package-contract.json`

## Accepted starting point

```text
PR #516 repository category migration candidate and disabled runtime implementation merged
PR #517 disabled-runtime production boundary accepted
PR #523 read-only production preflight accepted
PR #528 controlled schema design accepted
PR #529 production execution package accepted
PR #541 Kick-only recovery fix accepted
PR #545 final post-apply audit evidence frozen on main
PR #546 schema execution/recovery paths retired
PR #547 bounded execution-cost probe package validated
Twitch category schema complete
Kick category schema complete
CATEGORY_CAPTURE_ENABLED remains absent
production category rows remain absent
provider separation preserved
final audit D1 rows written zero
final audit D1 changes zero
provider leakage zero
temporary schema/audit Workers deleted and HTTP 404
all schema execution triggers consumed and retired
```

## Purpose

Measure the real cost of the category generator and dictionary path with one bounded, reserved probe per provider before any runtime capture enablement decision. Schema work is complete and must not be repeated. The current phase is about execution cost, cleanup, and collector safety only.

## Completed sub-gates

```text
planning thresholds and stop conditions accepted
provider-separated read-only preflight accepted
Twitch schema applied and independently audited
Kick schema applied through a Kick-only recovery package
both provider schemas re-audited as complete
category capture remained disabled throughout
all temporary schema Workers deleted
all schema execution and recovery triggers retired
bounded probe design accepted
reserved-identifier-only Worker implemented
fixed historical probe day enforced
first dictionary pass and second no-op fixture passed
probe row idempotency and failure containment fixture passed
cleanup remaining rows zero fixture passed
sanitized success and failure evidence fixtures passed
Twitch and Kick Wrangler bundles passed dry-run
```

## Accepted package boundary

```text
Worker mode: bounded_execution_cost_probe
confirmation: RUN_RESERVED_CATEGORY_COST_PROBE
probe day: 1900-01-02
reserved prefix: __viewloom_category_cost_probe__:
provider order: Twitch then Kick
one dictionary entry + one rollup row + one status row per provider
cleanup executes in finally
collector_status is never written
arbitrary production identifiers are rejected
production execution from package PR: no
Cloudflare credentials in package CI: no
CATEGORY_CAPTURE_ENABLED value: absent
persistent production category rows: none
new cron/backfill/raw-retention/category UI: none
cross-provider category identity or combined rankings: none
```

## Current sub-gate: separate one-file production trigger

The next PR may change only the trigger contract required to bind the accepted package to an exact package head and merge SHA. It must not alter Worker logic, thresholds, provider order, cleanup rules, evidence normalization, collector code, or runtime category capture.

The trigger must preserve this sequence:

```text
1. verify the exact accepted package identity from PR #547
2. execute Twitch reserved probe
3. verify first pass, no-op, thresholds, cleanup zero, leakage zero, and Worker deletion 404
4. stop before Kick on any Twitch failure
5. execute Kick reserved probe
6. verify the same Kick gates and Worker deletion 404
7. publish sanitized provider-separated evidence
8. freeze evidence in a separate acceptance PR
9. retire the trigger and production execution workflow
10. decide separately whether category capture may start
```

## Current boundary

```text
no production probe has run
no schema apply or schema rollback
no CATEGORY_CAPTURE_ENABLED value
no persistent production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no cross-provider category identity
no combined-provider category totals or rankings
```

## Completion gate

12A-4 is complete only when both providers independently satisfy the execution-cost contract in production, all reserved rows and dictionary entries are removed, temporary Workers are deleted, category failure cannot replace a successful collector outcome, and runtime capture receives a separate explicit acceptance. Until then, category capture remains disabled.
