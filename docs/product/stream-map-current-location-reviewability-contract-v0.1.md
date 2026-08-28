# ViewLoom Stream Map Current Location Reviewability Contract v0.1

Status: pre-public reviewability gate  
Parent: `stream-map-current-location-irl-contract-v0.1.md`  
Live candidate measurement: run `33144962164`, audit #1082  
Last updated: 2026-08-28

## Purpose

The bounded live probe established that Current / IRL candidate signals exist, but candidate extraction is not accepted geography.

This gate defines the boundary between:

```text
live title/tag candidate
-> minimal review queue
-> reviewer establishes separate qualifying evidence
-> accepted time-bounded Current/temporary claim
```

It deliberately does **not** define a public Current API or UI activation.

## Candidate queue boundary

A review-queue entry may retain only the minimum fields required to identify and review the live candidate:

```text
provider = twitch
stable Twitch user ID
login
public channel URL/reference
observedAt
reviewWindowExpiresAt
candidate Country/City values
candidate source classes (stream_title / stream_tag)
review state
```

It must not retain:

```text
raw stream title
raw tags
raw language
raw profile body
address
coordinates
GPS trace
private venue detail
```

`stream_title` and `stream_tag` remain candidate sources only. They cannot be promoted automatically to accepted Current evidence.

## Review window

The initial candidate review window is 24 hours from `observedAt`.

This is a maximum opportunity to inspect the live/public source while the candidate still has useful temporal meaning. It is not itself an accepted Current TTL.

If the review window expires before qualifying evidence is established, the candidate cannot be accepted from the stale queue entry.

## Future/travel rejection

If the title extractor detects explicit future/planned-travel wording, the row is rejected from active Current review even if a location-like tag is also present.

Examples include:

```text
tomorrow
next week
planning a trip
going to
heading to
traveling to
```

A future itinerary is not current presence.

## Multiple candidate places

If one live stream produces multiple distinct candidate places:

```text
reviewState = candidate_conflict_review_required
```

No candidate place is preferred automatically.

The reviewer must either establish one qualifying current statement with an unambiguous temporal relationship or return `conflict_unmapped` / `no_qualifying_evidence`.

## Qualifying evidence required for acceptance

Accepted Current/temporary placement requires a source class that satisfies the parent Current/IRL contract. Initial accepted classes are:

```text
self_controlled_current_statement
official_affiliated_current_statement
attributable_editorial_current_statement
reviewed_direct_self_statement
```

The following are never sufficient as the final accepted source class:

```text
stream_title
stream_tag
language
category
timezone
search snippet
unrelated repost
event venue alone
```

An accepted result must include:

```text
qualifying source class
public source URL/reference
countryCode
city? optional
observedAt
expiresAt
confidence
reviewedAt
```

The qualifying placement must match the candidate country/place rather than silently turning the review into unrelated geography promotion.

## Review outcomes

Allowed terminal outcomes:

```text
accepted_current
accepted_temporary
no_qualifying_evidence
conflict_unmapped
rejected_future_travel
expired_before_review
```

Unsupported or incomplete outcomes fail validation.

## Freshness ceilings

For accepted results:

```text
current_location:
  expiresAt > observedAt
  maximum initial span = 24 hours

temporary_location:
  expiresAt > observedAt
  maximum initial span = 14 days
```

These ceilings come from the parent Current / IRL contract. A longer-lived claim requires a separate reviewed gate; it cannot be smuggled through this queue.

## Base/Home isolation

Every result from this gate has:

```text
baseMutationAuthorized = false
```

No transition is allowed from a Current candidate or accepted Current result to `home_base` / `declared_location` without a separate base-evidence review.

## Public activation boundary

This gate authorizes none of the following:

```text
production deploy
D1 write
schema change
collector cadence change
retention change
automatic Current acceptance
public Current / IRL API activation
public Current / IRL UI activation
Home/Base mutation
```

A later identity-preserving preview probe may feed this reviewability core, but any such probe remains read-only and separately bounded.

## Hard invariants

- title/tag are candidate-only, never final accepted evidence;
- future/planned travel never places Current;
- review expires rather than becoming stale accepted geography;
- conflicts fail closed;
- accepted claims require source attribution plus `observedAt` and `expiresAt`;
- Current defaults to <=24h, temporary to <=14d;
- raw live text is not emitted by the review queue;
- no exact address/GPS/private-location publication;
- no Home/Base mutation;
- no Twitch/Kick aggregation;
- no public activation from this gate.
