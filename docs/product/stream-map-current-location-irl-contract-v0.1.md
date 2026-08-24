# ViewLoom Stream Map Current Location / IRL Contract v0.1

Status: contract for Issue #1031  
Parent: Stream Map specification v0.6 / implementation plan v0.5  
Last updated: 2026-08-24

## 1. Purpose

Define a temporary **Current Location / IRL** layer without converting travel, event attendance, birthplace, nationality, or historical residence into a permanent home/base location.

Current Location is not the City base map.

```text
Base/Home    where accepted current base evidence places the person
Current/IRL  where fresh, explicitly time-bounded evidence places the person now
```

A person may therefore have both:

```text
Home/Base      Los Angeles
Current        Tokyo
Observed at    2026-08-24T00:00:00Z
Expires at     2026-08-25T00:00:00Z
```

When the current claim expires, the Current layer returns to Unknown. The Base/Home placement remains unchanged.

## 2. Claim vocabulary

### Base-capable claims

```text
home_base
declared_location
```

These belong to Country/City base placement and do not become Current merely because they are recent.

### Current-layer claims

```text
current_location
temporary_location
```

These may place only in the Current/IRL layer when all temporal/source requirements pass.

### Context-only for Current placement

```text
birthplace
nationality
historical_residence
event_venue
planned_travel
```

An event venue becomes relevant only when separate attributable evidence explicitly places the person at that venue/current city during the validity window. Venue alone never proves presence.

## 3. Required retained fields

Every accepted current/temporary claim must have:

```text
streamer identity
source class
source URL/reference
claimKind
countryCode
countryName
region?          optional
city?            optional
observedAt
expiresAt
confidence
status
reviewedAt
```

Optional:

```text
explicitStartAt
explicitEndAt
sourceStatementType
relatedStreamSessionId
```

Forbidden public precision:

```text
street address
residential address
postal address
exact latitude/longitude
GPS trace
precise travel path
hotel/room/private venue detail
```

Public placement unit is Country or City only.

## 4. Evidence source classes

Accepted current-location evidence must be attributable and explicitly temporal.

Potentially acceptable after review:

```text
self-controlled current statement
official affiliated source explicitly placing the person now
attributable editorial/interview source explicitly placing the person now
reviewed transcript of a direct self-statement about present location
```

Candidate-only by itself:

```text
stream title
stream tag
profile location string without current-time meaning
search snippet
social repost by an unrelated account
```

Rejected as standalone current placement:

```text
nationality
birthplace
language
timezone
IP-derived inference
name cues
team/organization headquarters
event venue without proof of attendance/presence
planned future travel
old residence statement
category/game
```

## 5. Temporal requirement

A Current/IRL claim without a defensible temporal bound is not accepted for current placement.

At minimum:

```text
observedAt  required
expiresAt   required
```

`expiresAt` is derived conservatively from explicit source timing or the default TTL rules below.

## 6. Initial TTL rules

### 6.1 Explicit short current statement with no stated end

Examples:

```text
"I'm in Tokyo now"
"streaming from Berlin today"
```

Default:

```text
TTL = 24 hours from observedAt
```

Reason: enough to represent a same-day/current statement without leaving a traveler permanently pinned.

### 6.2 Explicit same-stream current-location statement

If evidence is explicitly tied to one live stream/session and does not assert a longer stay:

```text
expiresAt = earlier of:
  observedAt + 24 hours
  known session-end expiry if a reliable session lifecycle is available
```

Until reliable session-end semantics are implemented, the 24-hour ceiling applies.

### 6.3 Explicit multi-day temporary stay

Examples:

```text
"I'm in Tokyo for the next three days"
"in Paris through Sunday"
```

Use the explicit end when machine-reviewable and unambiguous, with a hard initial ceiling:

```text
maximum accepted temporary span = 14 days
```

If the stated span exceeds 14 days, the claim may remain retained context but requires a separate review before current placement continues beyond 14 days.

### 6.4 Event/tournament attendance

Event dates alone do not place a person.

If attributable evidence explicitly establishes their presence at the event/city:

```text
expiresAt = earlier of:
  explicit personal stay end
  event end + 12 hours
  observedAt + 7 days
```

No venue-level public precision is emitted.

### 6.5 No temporal meaning

If a source says only:

```text
"Tokyo"
"from Japan"
"based in LA"
```

it is not Current Location merely because it was observed today.

It must be evaluated under base/home semantics instead.

## 7. Freshness states

Internal state:

```text
future       explicit start has not begun
fresh        now >= effective start and now < expiresAt
expired      now >= expiresAt
conflict     overlapping accepted fresh claims disagree on placement
invalid      required temporal/source fields fail contract
```

Public Current layer maps only `fresh` claims with one unambiguous accepted placement.

`future`, `expired`, `conflict`, and `invalid` are unmapped in Current mode.

## 8. Conflict handling

If overlapping accepted fresh current claims produce different countries/cities:

```text
Current placement = unmapped
reason = conflicting_current_location
```

Do not pick the newest source silently unless a reviewer explicitly records temporal supersession.

A new claim can supersede an older one only when the evidence establishes a real sequence/change, not merely because its timestamp is newer.

## 9. Base/Home isolation

Current/temporary evidence must never mutate base/home evidence automatically.

Forbidden transitions:

```text
current_location -> home_base
temporary_location -> declared_location
event attendance -> home_base
expired current claim -> historical base
```

If a person later explicitly states they moved, that new statement is reviewed separately as base/home evidence.

## 10. Expiry behavior

At or after `expiresAt`:

```text
Current layer placement stops immediately
Current state becomes expired/unknown publicly
Base/Home remains independently placeable if valid
```

The system must not carry the last known current city forward.

Expired evidence may remain retained for audit/history, but it is not live placement evidence.

## 11. Public API target

A later implementation gate may add a separate current layer shaped approximately as:

```text
{
  layer: "current",
  countryCode,
  countryName,
  city,
  observedAt,
  freshness: "fresh",
  locationType: "current_location" | "temporary_location",
  sourceClass
}
```

Do not expose exact source text if it would leak private precision. Source attribution can link to the reviewed public source where appropriate.

Base and Current remain separate fields/layers; one must never overwrite the other in API normalization.

## 12. Public UI target

Potential mode selector:

```text
Geography
[Country] [City] [Current / IRL]
```

For an identity with both states:

```text
Home/Base   Los Angeles
Current     Tokyo
Observed    3h ago
Freshness   Current
```

When expired:

```text
Home/Base   Los Angeles
Current     Unknown
```

No travel line between Los Angeles and Tokyo is inferred.

## 13. Existing-evidence audit rule

The first audit after this contract must classify retained evidence into exactly one of:

```text
base_only
fresh_current_candidate
temporary_current_candidate
context_only
expired
conflict
invalid
```

Existing `home_base` / `declared_location` rows are `base_only` unless their actual claim explicitly and independently satisfies current/temporary semantics. Recency alone is insufficient.

## 14. Automation boundary

This contract does not authorize automatic location extraction or automatic acceptance.

Title/tag/profile fields can produce review candidates, but candidate extraction and accepted live placement remain separate states.

No inference from language, timezone, category, IP or device/network metadata.

## 15. Retention and history

A later History/Replay gate may retain expired current claims so a user can see what was observed at a past time.

History must show observation/expiry boundaries and must not interpolate a route between known cities.

## 16. Initial implementation gates after this contract

```text
D2 existing retained evidence current/temporary audit
D3 deterministic freshness/expiry evaluator + fixtures
D4 read-only live candidate coverage measurement
D5 separate current-location API layer
D6 Current / IRL UI mode
```

Each gate remains independently reviewable.

## 17. Hard invariants

- no current placement without `observedAt` and `expiresAt`;
- default open-ended current statement expires within 24 hours;
- explicit temporary stay is capped at 14 days without renewed review;
- event venue alone never places the person;
- expired current evidence never remains live;
- conflicts map to Unknown rather than silent source preference;
- base/home and current layers never overwrite each other;
- no exact address/GPS/private-location publication;
- no inferred travel path;
- no automatic title/tag/profile acceptance;
- no Twitch/Kick geographic aggregation.
