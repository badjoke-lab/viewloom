# Phase 12A-4 production category execution-cost probe

Status: current umbrella gate; controlled schema apply design is the active sub-gate  
Tracking issue: #519  
Planning PR: #520  
Read-only preflight acceptance PR: #523  
Current design: `phase12a4-category-controlled-schema-apply.md`

## Accepted starting point

```text
PR #516 repository category migration candidate and disabled runtime implementation merged
PR #517 disabled-runtime production boundary accepted
PR #518 accepted disabled-runtime evidence frozen on main
PR #523 read-only production preflight accepted and frozen on main
Twitch and Kick natural snapshots continued after deployment
production category payload fields absent
production category schema absent
CATEGORY_CAPTURE_ENABLED absent
provider separation preserved
read-only provider leakage zero
read-only D1 rows written zero
read-only D1 changes zero
temporary preflight Workers deleted
```

## Purpose

Complete the provider-separated production execution-cost gate before any category runtime enablement decision. The umbrella gate is split into explicit sub-gates so that schema application, bounded category writes, cost measurement, cleanup, and runtime capture cannot be silently combined.

## Completed sub-gate: planning and read-only preflight

```text
formal thresholds and stop conditions accepted PR #520
provider-separated read-only preflight package accepted PR #521
provider-health-aware verification accepted PR #526
attempt 3 executed from PR #527
accepted preflight evidence frozen PR #523
Twitch health source collector_status
Kick health source latest_snapshot
category schema absent for both providers
provider leakage zero
D1 rows written zero
D1 changes zero
```

## Current sub-gate: controlled schema apply design

```text
exact migration parity with db/d1/005_category_capture.sql
provider-shared controlled apply module
provider-separated temporary Worker candidates
Twitch executes before Kick
partial schema stops without applying
second apply executes zero schema statements
existing rows and collector status preserved
category dictionary remains empty after schema-only apply
explicit failure policy and deletion requirements
Wrangler dry-run only in the design PR
```

## Current design boundary

```text
no production Worker deployment
no Cloudflare secrets
no remote D1 migration
no CATEGORY_CAPTURE_ENABLED value
no production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no cross-provider category identity
no combined-provider category totals or rankings
```

## Remaining authorized sequence

```text
1. accept the controlled schema apply design package
2. open a separate one-time production schema-apply trigger PR
3. execute Twitch inspect/apply/no-op/post-inspect/delete first
4. stop before Kick on any Twitch failure
5. execute the same sequence for Kick
6. freeze sanitized schema-apply evidence
7. run a separate bounded category execution-cost probe
8. remove all reserved probe rows and temporary Workers
9. freeze sanitized cost evidence
10. decide whether provider-separated category capture may start
```

## Completion gate

The production gate is complete only when both providers independently satisfy the contract in `docs/audits/12a4-category-execution-cost-probe-contract.json`, all reserved probe rows are removed, temporary Workers are deleted, category failure cannot replace a successful collector outcome, and runtime capture receives a separate explicit acceptance.
