# Phase 12A-4 category storage design and budget

Status: candidate deterministic benchmark  
Branch: `work-analytics-12a4-category-storage-design`

## Purpose

Choose a provider-separated category evidence representation that preserves enough hourly structure for later Phase 15/16 evaluation without extending raw retention or exceeding the accepted Free Strong storage boundary.

## Accepted source inputs

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from official public/v1/livestreams
category contract: category-source-v1
```

## Compared models

```text
raw_payload_only
one dominant category per streamer/day
compact hourly category JSON embedded in the existing streamer/day row
separate streamer/category/hour rows
```

## Candidate source encoding

```text
categoryContractVersion: one root scalar
categoryIds: provider-native ids once per snapshot
categoryRefs: item-order-aligned references; null means missing_from_source
category names: one set-based provider_category_dictionary upsert
```

Category names are not repeated on every Twitch 300 / Kick 100 raw item.

## Candidate long-term encoding

The benchmark tests a compact `category_hourly_json` in the existing `streamer_intraday_rollups` row. It retains a per-day category dictionary, 24 hourly category references, sample support, viewer-minute support, daily observed/missing counts, and contract version.

It preserves hourly dominant category evidence, not exact switch timestamps or exact sessions.

## Gate

```text
Twitch projected total <= 440 MB and headroom >= 10 MB
Kick projected total <= 330 MB and headroom >= 100 MB
Account projected total <= 4000 MB and headroom >= 500 MB
20% safety margin
provider separation mandatory
```

## Exclusions

```text
production schema change
migration
runtime category capture
production D1 write
raw retention change
new cron
backfill
category analytics UI
cross-provider category identity
combined-provider category ranking
```

A passing local benchmark authorizes only a later migration candidate and production cost probe. It does not authorize migration or runtime capture.
