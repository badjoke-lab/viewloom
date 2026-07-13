# 12A-4 category storage design acceptance

Date: 2026-07-14  
Status: accepted  
Accepted PR: #514  
Merge SHA: `d3c219670af2189fe9acd51ecd67777481162a29`

## Accepted provider-separated source contracts

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from public/v1/livestreams
category contract version: category-source-v1
cross-provider identity equivalence: false
```

## Storage models compared

```text
raw_payload_only
one dominant category per streamer/day
embedded compact hourly category JSON
separate streamer/category/hour rows
```

## Selected model

`embedded_hourly` is accepted as the repository migration candidate.

The selected source representation stores provider-native category IDs once per snapshot and item-order-aligned references. Category names are retained through one set-based provider dictionary write rather than repeating names in every raw item.

The selected long-term representation extends the existing provider-specific streamer/day rollup with compact hourly category evidence and bounded coverage counters. It preserves hourly dominant-category evidence and support. It does not claim exact category switch times, exact sessions, or full-platform coverage.

## Accepted projected storage

```text
Twitch projected total with safety: 438.70 MB
Twitch projected headroom:           11.30 MB

Kick projected total with safety:   314.57 MB
Kick projected headroom:            135.43 MB

Account projected total with safety: 3716.59 MB
Account projected headroom:           891.41 MB

Safety margin: 20%
```

## Authorized next work

```text
repository migration candidate: authorized
provider-separated disabled runtime implementation: authorized
local migration and fixture verification: authorized
production execution-cost probe preparation: authorized
```

## Still unauthorized

```text
remote production migration apply
CATEGORY_CAPTURE_ENABLED production flag
recurring production category writes
backfill
raw-retention extension
new cron
category analytics UI
cross-provider category identity
combined-provider category ranking
```

A production execution-cost probe must measure D1 rows read/written, SQL duration, Worker duration, collector latency, and failure containment before remote migration apply or runtime capture enablement.

## Permanent evidence

```text
docs/audits/12a4-category-storage-design-contract.json
docs/audits/12a4-category-storage-budget-evidence.json
```
