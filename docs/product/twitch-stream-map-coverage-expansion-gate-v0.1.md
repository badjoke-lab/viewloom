# Twitch Stream Map Coverage Expansion Gate v0.1

Status: implementation gate proposal for Issue #1028  
Parent: Stream Map specification v0.6 / implementation plan v0.5  
Last updated: 2026-08-24

## 1. Purpose

Expand Twitch Country reviewed-evidence coverage without making the existing weekly fixed-Top-20 maintenance cadence the global Map scheduler.

This gate has two separate stages:

```text
A. bounded stable-identity population acquisition
B. deterministic unique review queue construction
```

No research/evidence mutation is authorized merely by constructing the queue.

## 2. Why a separate acquisition is required

The current production Twitch minute snapshot deliberately stores:

```text
channelLogin
displayName
viewers
momentum
activity
category source references
```

but the current collector drops Helix `user_id` before snapshot persistence.

Therefore the production snapshot cannot honestly provide stable Twitch identity for a cross-batch review queue.

The coverage-expansion acquisition must capture `user_id + user_login` directly from the supported Helix Streams response for the bounded queue artifact. Do not relabel login-only dedupe as stable identity.

## 3. Population acquisition ceiling

Target population:

```text
current overall Twitch Top 300
```

Hard provider ceiling per authorized acquisition:

```text
OAuth app-token requests        <= 1
GET /helix/streams requests     <= 3
first per streams request       <= 100
GET /helix/users requests       0
D1 writes                       0
production deployment mutation  false
```

Pagination stops after three pages even if Twitch reports another cursor.

No geography preselection and no replacement/refill based on geography or entity type.

## 4. Retained acquisition fields

Only these identity/population fields may enter the queue acquisition artifact:

```text
rank
twitchUserId
login
displayName
viewers
capturedAt
coveredPages
hasMore
requestCounts
```

Do not retain merely for this queue gate:

```text
title
tags
language
profile description
category
geography
address
coordinates
```

Evidence discovery uses separately governed research steps, not hidden payload retention in the population artifact.

## 5. Stable identity rules

Primary key:

```text
twitchUserId
```

The current sample login is retained as the provider-visible alias used to join existing login-keyed reviewed records.

Fail closed when:

- a captured Top300 contains duplicate Twitch user IDs;
- one current login resolves to multiple Twitch user IDs inside the same acquisition;
- a row has no Twitch user ID;
- a row has no login.

The existing reviewed-evidence registry is currently login-keyed. Matching a current sample to that registry by login is an explicit bridge, not proof that historical login alone is a stable identity key.

## 6. Queue exclusions

Before research, exclude:

1. known `organization` / `event_broadcast` rows;
2. accepted `home_base` / `declared_location` evidence that is still fresh under the 180-day lifecycle rule;
3. stable Twitch user IDs explicitly suppressed by retained prior queue/review history under a separately defined lifecycle rule.

Do not let accepted `current_location` suppress a missing base Country review. Current Location belongs to a separate layer and may expire.

## 7. Queue inclusions

Queue candidates include:

- no reviewed record;
- known person with no accepted base placement evidence;
- unresolved entity kind that still requires classification;
- accepted base evidence that has reached re-review due age;
- previously reviewed stable IDs whose retained lifecycle state says review is due.

## 8. Ordering

Queue order is deterministic and starts from the captured overall rank.

No geography-based reordering.

No manual refill to replace non-person exclusions merely to hit an arbitrary number of persons.

## 9. Batch/research budget — not yet authorized by this PR

This queue foundation does not itself choose a final research batch/session ceiling.

Before external/manual research is run, a follow-up gate must freeze:

```text
max identities per batch
max searches/lookups per identity
max searches/lookups per session
max wall-clock review minutes
terminal outcomes
canonical evidence mutation authority
```

The stop condition must be those actual work/cost limits, not "wait one week".

## 10. Production boundary

This gate does not authorize:

- production D1 mutation;
- collector schema changes;
- collector cadence changes;
- permanent Top300 identity persistence;
- automatic external research;
- automatic evidence acceptance;
- City public fields;
- Current Location / IRL activation;
- Kick changes;
- Twitch/Kick geographic aggregation.

## 11. Implementation proof in this gate

The first implementation PR must prove deterministic queue semantics using fixtures/current reviewed evidence:

- stable user ID duplicates fail closed;
- login-to-multiple-ID collision fails closed;
- known non-person excluded;
- fresh base evidence excluded;
- current-location-only evidence does not suppress base review;
- stable history suppression is keyed by Twitch user ID;
- no calendar-week condition exists in queue selection.

A later PR may add the bounded three-page read-only Helix acquisition harness after this queue core is accepted.
