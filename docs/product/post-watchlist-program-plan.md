# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan  
Version: 10.0  
Last updated: 2026-07-14  
Current phase: Phase 12A — Analytics Capture Foundation  
Current workstream: 12A-4 production category execution-cost probe  
Production intraday generation started: yes  
Category runtime capture started: no

```text
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and production accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design and budget accepted PR #514
12A-4 category migration and disabled runtime accepted through PR #518
12A-4 production execution-cost probe current
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-4 production execution-cost probe and remote migration decision
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

## Active authorities

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a3-generator-enablement-evidence.json
docs/audits/12a3-postmerge-acceptance-evidence.json
docs/audits/12a4-category-source-audit-contract.json
docs/audits/12a4-category-source-audit-evidence.json
docs/audits/12a4-category-storage-design-contract.json
docs/audits/12a4-category-storage-budget-evidence.json
docs/audits/12a4-category-migration-runtime-contract.json
docs/audits/12a4-disabled-runtime-postmerge-evidence.json
docs/audits/12a4-category-execution-cost-probe-contract.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a4-category-source-audit-2026-07-12.md
docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md
```

## Accepted category source contract

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from public/v1/livestreams
two 100-row live probes per provider
minimum observed presence ratio 1.0
source audit pass true
runtime capture authorized false
```

## Accepted 12A-4 category storage design

```text
selected model embedded_hourly
category contract category-source-v1
raw payload category ids stored once per snapshot
raw item references aligned by item order
category names retained through provider_category_dictionary
hourly category evidence embedded in existing streamer/day rows
new category index false
raw retention changed false
new cron false
backfill false
```

```text
Twitch projected total/headroom 438.70 / 11.30 MB
Kick projected total/headroom 314.57 / 135.43 MB
Account projected total/headroom 3716.59 / 891.41 MB
repository migration candidate implemented true
disabled runtime production acceptance true
production category schema present false
remote migration apply authorized false
production execution-cost probe required true
runtime capture authorized false
```

## 12A-4-2 migration and disabled runtime implementation

Accepted result:

```text
provider-separated category migration candidate implemented PR #516
provider_category_dictionary and category columns implemented in repository
compact categoryIds/categoryRefs snapshot encoding implemented behind disabled flag
one set-based dictionary write implemented behind explicit enablement
category-aware intraday SQL preserves 12-query maximum
local schema/idempotency/payload/coverage/provider-separation fixtures pass
disabled runtime deployed and accepted PR #517
accepted production evidence frozen PR #518
```

The accepted boundary remains:

```text
production category schema absent
CATEGORY_CAPTURE_ENABLED absent
production category rows absent
new cron absent
backfill absent
raw retention unchanged
category analytics UI absent
cross-provider category identity forbidden
combined-provider category rankings forbidden
```

## 12A-4-3 production execution-cost gate

Required work:

```text
provider-separated read-only preflight
controlled remote migration decision
pre/post schema and database-size evidence
CATEGORY_CAPTURE_ENABLED remains absent during schema apply
separate Twitch and Kick D1 cost measurements
rows read/written, changes, SQL duration, Worker duration
collector latency delta
dictionary unchanged-name no-op measurement
category-aware generator remains within 12 queries
failure-containment proof
cleanup and temporary Worker deletion
explicit thresholds and stop conditions
```

Planning PR boundary:

```text
no production deployment
no remote migration
no category enablement
no production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no combined-provider category identity or ranking
```

## 12A-4 completion boundary

12A-4 closes only after provider-specific capture is real, coverage is measurable, storage and production query cost are accepted, production evidence exists, and no combined-provider category ranking exists.

## 12A-5 foundation acceptance

Run provider-separated acceptance, verify retention and rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15.
