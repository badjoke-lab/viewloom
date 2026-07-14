# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan  
Version: 11.0  
Last updated: 2026-07-14  
Current phase: Phase 12A — Analytics Capture Foundation  
Current workstream: 12A-4 controlled category schema apply design  
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
12A-4 read-only production preflight accepted PR #523
12A-4 controlled category schema apply design current
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-4 controlled provider-separated category schema apply
  -> bounded provider-separated category execution-cost probe
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
docs/audits/12a4-category-readonly-preflight-evidence.json
docs/audits/12a4-category-controlled-schema-apply-contract.json
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
repository category migration candidate implemented true
disabled runtime production acceptance true
read-only production preflight accepted true
production category schema present false
remote migration apply authorized false
bounded production execution-cost probe authorized false
runtime capture authorized false
```

## 12A-4-2 category migration and disabled runtime implementation

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

## 12A-4-3 read-only production preflight

Accepted result:

```text
planning and thresholds accepted PR #520
provider-separated read-only package accepted PR #521
provider-health-aware verification accepted PR #526
attempt 3 trigger accepted PR #527
accepted evidence frozen on main PR #523
Twitch health source collector_status
Kick health source latest_snapshot
category schema absent for both providers
provider leakage zero
D1 rows written zero
D1 changes zero
temporary Workers deleted and HTTP 404 confirmed
remote migration unauthorized
runtime capture unauthorized
```

Observed preflight cost:

```text
Twitch 10 statements / 8,763 rows read / 14.139 ms D1 / 1,172 ms Worker
Kick 9 statements / 15,638 rows read / 34.152 ms D1 / 1,063 ms Worker
```

## 12A-4-4 controlled category schema apply design

Current design work:

```text
exact parity with db/d1/005_category_capture.sql
one provider-shared controlled apply module
separate Twitch and Kick temporary Worker configurations
exact confirmation header required
completely absent pre-schema required
partial schema stops without applying
Twitch executes before Kick
failure stops before the next provider
first apply executes nine schema statements
second apply must execute zero statements
existing rollup rows and collector state preserved
category dictionary remains empty after schema-only apply
no production execution in the design PR
```

Planning PR boundary:

```text
no production temporary Worker deployment
no remote migration
no category enablement
no production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no combined-provider category identity or ranking
```

## Later 12A-4 gates

After the controlled schema apply is accepted and evidenced:

```text
bounded provider-separated execution-cost probe
dictionary first-pass and unchanged-name second-pass measurement
category-aware generator query count at or below 12
collector latency delta measurement
reserved probe-row cleanup
provider-separated capture enablement decision
post-merge capture acceptance
```

## 12A-4 completion boundary

12A-4 closes only after provider-specific capture is real, coverage is measurable, storage and production query cost are accepted, production evidence exists, and no combined-provider category ranking exists.

## 12A-5 foundation acceptance

Run provider-separated acceptance, verify retention and rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15.
