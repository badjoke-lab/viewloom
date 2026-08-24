# Kick Stream Map location source audit — 2026-08-24

Status: retained read-only source audit  
Issue: #1030  
Scope: source/field availability and current retention only  
Production mutation: none

## 1. Result

Kick already has a real provider-specific collector path capable of supplying a Stream Map population, but the current stored snapshot contract retains only a subset of the official metadata that could be useful for reviewed geographic evidence.

Most important findings:

1. the active primary collector already uses Kick's official API when app auth is available;
2. current code calls `/public/v1/livestreams`, while Kick's current developer changelog says Livestreams V2 was added on 2026-06-23 and V1 was deprecated, followed by a 2026-07-03 migration note;
3. current official-livestream normalization retains title/viewers/category in memory but does not retain `custom_tags` even though Kick's developer changelog says `custom_tags` was added to GET livestreams and GET channels on 2025-11-21;
4. current channel normalization does not retain channel description even though Kick's official scope documentation describes `channel:read` as allowing channel information including channel description and category;
5. category source fields are deliberately stripped from per-item snapshot objects and encoded through the existing category-source-v1 refs/dictionary contract;
6. the legacy `https://kick.com/api/v2/channels/{slug}` path remains only a public fallback and should not become the primary permanent geographic-evidence source;
7. no current code or official source reviewed in this audit proves an external-links field. External links remain unproven and must not be assumed;
8. no field reviewed here is automatically accepted as geography. Title/tags/profile text are evidence candidates that still require claim/source rules.

## 2. Current runtime path — code confirmed

Active worker:

```text
workers/collector-kick/src/entry.ts
-> workers/collector-kick/src/index.ts
-> workers/collector-kick/src/index-category.ts
```

Active schedule:

```text
workers/collector-kick/wrangler.toml
crons = ["*/5 * * * *"]
```

Storage:

```text
DB_KICK_HOT
vl_kick_hot
minute_snapshots
```

The current README is stale on two points: it describes the collector as a channel-list collector and describes the cron block as commented, while the current code has an official livestreams-first path and the current Wrangler file has an active five-minute cron.

## 3. Official livestreams path

Code:

```text
workers/collector-kick/src/official-livestreams.ts
```

Current request:

```text
GET https://api.kick.com/public/v1/livestreams
limit <= 100
sort=viewer_count
Bearer app token
```

Current normalized in-memory fields:

```text
slug
displayName
title
viewer_count
url
categoryProviderId
categoryName
```

Title is selected from:

```text
stream_title
?? session_title
?? title
?? categoryName
```

### Current official-version risk

Kick's developer changelog currently states:

```text
2026-06-23  pagination-supported Livestreams V2 added; V1 deprecated
2026-07-03  endpoint to get Livestreams by user IDs added; Livestreams V1 should now be completely migrated off
```

The current ViewLoom collector still calls `/public/v1/livestreams`.

**Map implication:** before building Kick Map population logic on this path, verify the supported V2 response contract and migrate/normalize the primary population source if required. Do not build new Map assumptions around a deprecated V1 shape.

## 4. `custom_tags` gap

Kick's developer changelog states that `custom_tags` was added on 2025-11-21 to:

```text
GET /livestreams
GET /channels
```

Current ViewLoom official livestream normalizer does not read or retain `custom_tags`.

Current snapshot item shape therefore loses this possible evidence candidate.

Geography rule:

```text
custom tag present
!= accepted geographic placement
```

A tag may be retained as a distinct `stream_tag`-class candidate only after a separate persistence/cost/retention gate. Tag-only geography must remain non-placeable unless the accepted evidence contract explicitly allows corroborated use; it must never silently become country/city/current location.

## 5. Official channel path

Current code also contains:

```text
GET https://api.kick.com/public/v1/channels?slug=<slug>
```

in `fetchOfficialChannel()`.

Current normalization retains only:

```text
slug
displayName
title
viewer_count
url
```

It discards the rest of the channel response.

Kick's official scope documentation describes `channel:read` as viewing channel information including:

```text
channel description
category
etc.
```

A current Kick developer-doc issue example also shows the response field name `channel_description`, but this audit does not promote an issue example into a canonical contract. The exact current OpenAPI response shape must be confirmed with the official spec/read-only probe before persistence work.

**Map implication:** channel description is a promising provider-supported `channel_profile` evidence candidate, but ViewLoom currently throws it away.

## 6. Category handling

The official livestream path reads category id/name in memory.

Before snapshot persistence:

```text
stripCategorySourceFields(items)
```

removes:

```text
categoryProviderId
categoryName
```

from each stored item.

When category capture is enabled, the existing shared category contract stores category through:

```text
categoryContractVersion = category-source-v1
categoryIds[]
categoryRefs[]
provider_category_dictionary
```

This is intentional normalization, not data loss requiring a Map-specific collector.

Category remains descriptive/filter data and never creates geography.

## 7. Legacy public channel fallback

Fallback path:

```text
GET https://kick.com/api/v2/channels/{slug}
```

The code and status notes explicitly describe this as `public-channel-fallback`, not official authenticated collection.

Fallback normalization currently retains:

```text
slug
displayName
title
viewer_count
url
```

It does not retain profile description, tags or category source fields.

**Recommendation:** keep this as resilience/coverage fallback for live observation where already accepted, but do not make it the primary permanent Stream Map evidence acquisition path. Prefer official provider-supported endpoints for durable reviewed-evidence sourcing.

## 8. Source matrix

| Candidate | Current path | Currently fetched | Currently retained in snapshot | Geography role | Next action |
|---|---|---:|---:|---|---|
| Live slug/name/viewers | official livestreams | yes | yes | population/identity only | reuse |
| Stream title | official livestreams | yes | yes | `stream_title` candidate | audit claims; no automatic acceptance |
| Custom tags | official livestreams / channels per Kick changelog | provider says available | no | `stream_tag` candidate | confirm V2 field shape with read-only probe |
| Category | official livestreams | yes | yes through category contract | filter/context only | reuse existing contract |
| Channel description | official channels per scope docs | endpoint already called; exact current field shape not normalized | no | `channel_profile` candidate | confirm current OpenAPI shape/read-only probe |
| External links | not proven | unproven | no | unproven | separate source audit; do not assume |
| Language | metadata may exist in provider events/contracts | not part of current Map snapshot item | no | never placement evidence | no Map geography use |
| Public fallback title | kick.com legacy fallback | yes | yes | lower-trust candidate path | do not promote to primary source |

## 9. Recommended Kick Map evidence path

```text
Official supported Kick live population
-> stable Kick identity
-> provider-supported stream title / custom tags candidates
-> provider-supported channel profile candidate
-> entity eligibility
-> reviewed evidence contract
-> accepted Country placement
-> independent Kick mapped/unmapped accounting
```

Do not copy Twitch accepted evidence merely because a Kick slug/name appears to represent the same person. Cross-provider identity reuse needs its own proof/contract.

## 10. Immediate next gate

Before any new persistence or public Kick Map API, add a bounded **read-only official Kick source probe** that:

1. uses the currently supported Livestreams V2 contract;
2. captures response keys only or a tightly redacted bounded sample;
3. confirms exact `custom_tags` shape;
4. confirms exact official Channels response fields needed for description/profile evidence;
5. counts field presence/coverage;
6. performs zero D1 writes;
7. performs no production deployment mutation;
8. stores no location conclusions;
9. does not call the legacy public fallback for evidence discovery.

The probe result should decide the minimal persistence contract needed for Kick `stream_title`, `stream_tag`, and `channel_profile` evidence candidates.

## 11. Hard boundaries

This audit does not authorize:

- Kick Map public rollout;
- D1 schema/payload expansion;
- collector cadence changes;
- Livestreams V2 migration in production;
- profile/tag persistence;
- automatic geographic extraction/acceptance;
- unsupported scraping;
- Twitch/Kick evidence copying or geographic aggregation;
- current-location/IRL acceptance;
- address or precise coordinate collection.

## 12. Evidence reviewed

Repository:

- `workers/collector-kick/src/official-livestreams.ts`
- `workers/collector-kick/src/index-category.ts`
- `workers/collector-kick/src/entry.ts`
- `workers/collector-kick/src/scheduled-observation.ts`
- `workers/collector-kick/wrangler.toml`
- `workers/collector-kick/README.md`
- `workers/shared/category-capture.ts`

Provider documentation:

- KickEngineering/KickDevDocs README/changelog
- KickEngineering/KickDevDocs `changelog.md`
- KickEngineering/KickDevDocs `apis/livestreams.md`
- KickEngineering/KickDevDocs `apis/channels.md`
- KickEngineering/KickDevDocs `scopes/scopes.md`

Provider-doc facts are used only for source capability/version assessment. Exact response-field persistence must still be verified against the current official OpenAPI/read-only payload before implementation.
