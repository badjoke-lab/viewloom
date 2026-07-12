# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan  
Version: 8.0  
Last updated: 2026-07-12  
Current phase: Phase 12A — Analytics Capture Foundation  
Current workstream: 12A-4 provider-specific category storage design and budget gate  
Production intraday generation started: yes  
Category runtime capture started: no

```text
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and production accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 storage design and budget current
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
12A-4 category storage design and budget gate
  -> migration and disabled runtime implementation
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
docs/audits/12a2-current-gate-state.json
docs/operations/12a4-category-source-audit-2026-07-12.md
```

## Accepted category source contract

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from public/v1/livestreams
two 100-row live probes per provider
minimum observed presence ratio 1.0
source audit pass true
storage design authorized true
runtime capture authorized false
```

## 12A-4-1 storage design and budget gate

Compare at least:

```text
category fields retained only in raw payload
one dominant category per streamer/day
bounded hourly category evidence JSON
separate compact category observation table
```

For each candidate record:

```text
provider-specific schema
coverage and missing-field semantics
category-change fidelity
bytes per observation/day/90 days
D1 rows_read and rows_written estimate
query duration estimate
retention and indexes
failure containment
migration requirement
```

The chosen design must preserve provider-native ids, keep Twitch and Kick separate, add no backfill, add no new high-frequency cron, leave raw retention unchanged, and keep runtime capture disabled until later acceptance.

## 12A-4 completion boundary

12A-4 closes only after provider-specific capture is real, coverage is measurable, storage/query cost is accepted, production evidence exists, and no combined-provider category ranking exists.

## 12A-5 foundation acceptance

Run provider-separated acceptance, verify retention and rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15.
