# Phase 12A-4 production category execution-cost probe

Status: current  
Tracking issue: #519  
Branch: `agent/12a4-category-execution-cost-probe`

## Accepted starting point

```text
PR #516 repository migration candidate and disabled runtime implementation merged
PR #517 disabled-runtime production boundary accepted
PR #518 accepted evidence frozen on main
Twitch and Kick natural snapshots continued after deployment
production category payload fields absent
production category schema absent
CATEGORY_CAPTURE_ENABLED absent
provider separation preserved
```

## Purpose

Prepare the provider-separated production execution-cost gate that must pass before any
remote category migration or category runtime enablement decision.

## This planning PR adds

```text
formal probe contract and stop conditions
read-only provider preflight Worker
local controlled-migration/idempotency fixture
dictionary unchanged-name no-op fixture
provider-separation and cleanup fixture
failure-containment fixture
PR scope and contract verification
Twitch and Kick Wrangler dry-run bundles
canonical state correction from completed 12A-4-2 to current 12A-4-3
```

## Planning PR boundary

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

## Authorized sequence after this PR

```text
1. merge the planning package
2. open an explicit controlled remote-probe PR
3. run read-only preflight for Twitch and Kick separately
4. evaluate preflight and authorize or stop
5. apply schema with category capture still disabled
6. run bounded cost probes and cleanup
7. freeze sanitized evidence
8. decide whether provider-separated category capture may start
```

## Completion gate

The production gate is complete only when both providers independently satisfy the
contract in `docs/audits/12a4-category-execution-cost-probe-contract.json`, all reserved
probe rows are removed, temporary Workers are deleted, and category failure cannot
replace a successful collector outcome.
