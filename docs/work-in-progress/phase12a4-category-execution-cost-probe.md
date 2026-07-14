# Phase 12A-4 bounded category execution-cost probe

Status: current umbrella gate; provider-separated bounded probe design is the active sub-gate  
Tracking issue: #519  
Planning PR: #520  
Read-only preflight acceptance PR: #523  
Post-apply schema audit acceptance PR: #545  
Current contract: `docs/audits/12a4-category-execution-cost-probe-contract.json`

## Accepted starting point

```text
PR #516 repository category migration candidate and disabled runtime implementation merged
PR #517 disabled-runtime production boundary accepted
PR #523 read-only production preflight accepted
PR #528 controlled schema design accepted
PR #529 production execution package accepted
PR #541 Kick-only recovery fix accepted
PR #545 final post-apply audit evidence frozen on main
Twitch category schema complete
Kick category schema complete
CATEGORY_CAPTURE_ENABLED absent
production category rows absent
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
all temporary Workers deleted
all schema execution and recovery triggers retired
```

## Current sub-gate: bounded probe design

The design package must prove all of the following before any production trigger is allowed:

```text
accepted schema evidence is read directly from main
Twitch and Kick are executed independently
only reserved probe identifiers are permitted
one provider finishes cleanup before the next provider starts
category generator query count is bounded
first dictionary pass and second no-op pass are measured
collector latency is measured before and after
provider leakage remains zero
reserved probe rows and dictionary entries are removed
cleanup remaining rows equals zero
temporary Workers are deleted and return HTTP 404
CATEGORY_CAPTURE_ENABLED remains absent
```

## Current boundary

```text
no production probe execution from the design PR
no Cloudflare credentials in PR validation jobs
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

## Remaining authorized sequence

```text
1. implement and accept the bounded provider-separated probe package
2. prove local/fixture first-pass, no-op, cleanup, and failure evidence
3. open a separate one-file production trigger PR
4. execute Twitch reserved probe, measure, clean, verify zero rows, delete Worker
5. stop before Kick on any Twitch failure
6. execute Kick reserved probe, measure, clean, verify zero rows, delete Worker
7. freeze sanitized provider-separated cost evidence
8. retire the probe trigger and production workflow
9. decide separately whether provider-separated category capture may start
```

## Completion gate

12A-4 is complete only when both providers independently satisfy the v2 execution-cost contract, all reserved rows and dictionary entries are removed, temporary Workers are deleted, category failure cannot replace a successful collector outcome, and runtime capture receives a separate explicit acceptance. Until then, category capture remains disabled.
