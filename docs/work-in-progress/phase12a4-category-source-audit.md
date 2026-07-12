# Phase 12A-4 category source audit

Status: candidate live source verification  
Branch: `work-analytics-12a4-category-source-audit`

## Purpose

Verify provider-specific category/game source fields before any storage design, migration, runtime capture, or public category analytics work.

## Current code finding

```text
Twitch Helix stream rows currently retain no game/category fields.
Kick official-livestreams rows currently retain no category fields.
Kick alternate official channel parsing inspects category only as a title fallback.
Kick public fallback currently retains no category fields.
```

## Trusted live audit

A temporary wrapper is deployed to the existing Twitch and Kick collector Worker names. It delegates all normal fetches and scheduled events to the accepted production collector and exposes one random-token-protected audit route.

```text
Twitch source: Helix /streams, two live probes
Kick primary: public/v1/livestreams, two live probes
Kick alternate official: public/v1/channels, five sampled live channels per pass
Kick public fallback: api/v2/channels, the same five sampled channels per pass
```

The audit returns only source keys, category/game field paths, value types, field presence ratios, object child keys, and limited category values. It does not return channel identities, slugs, titles, or raw upstream rows.

## Restoration boundary

```text
existing worker names preserved
existing D1 bindings preserved
existing */5 cron preserved
INTRADAY_GENERATION_ENABLED remains true
scheduled handler delegates to production entry
main collector redeploy required after audit
GET /health 200 required after restore
```

## Approval rule

Twitch requires stable `game_id` and `game_name` evidence across both probes.

Kick requires a stable provider-native category identifier/name pair in the primary official-livestreams response across both probes. Alternate official or public fallback evidence cannot approve the primary source.

## Exclusions

```text
production schema change
D1 writes by audit route
collector cadence change
raw retention change
backfill
category capture enablement
category analytics UI
cross-provider category identity
combined-provider category ranking
```

A passing source audit authorizes only 12A-4 storage-design comparison. Runtime category capture remains unauthorized.
