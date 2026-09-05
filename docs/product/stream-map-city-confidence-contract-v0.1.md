# Stream Map City confidence / ambiguity contract v0.1

Status: accepted semantic contract; implementation has advanced beyond the original activation boundary  
Provider: Twitch only  
Geography layer: Base City only  
Current parent: `stream-map-spec-v0.7.md` / `stream-map-implementation-plan-v0.6.md`  
Status note updated: 2026-09-05

## Current implementation note

The classification/privacy semantics below remain the City evidence contract. Since this v0.1 was first written, the repository has implemented the explicit City API/UI, stable-ID coverage states, City renderer isolation and structural production smoke. Those later implementation steps do not weaken the rules below.

In particular, City still does not derive a creator coordinate from Country geometry/centroids, and Current/IRL still cannot mutate Base City.

## Purpose

Make City evidence quality explicit without turning evidence strength into an inferred probability.

`confidenceClass` describes **evidence consistency**, not the probability that a streamer is in a place.

## Base placement inputs

Only accepted evidence with one of these claim kinds may place Base City:

- `home_base`
- `declared_location`

The classifier never derives City from Country.

## Current / IRL boundary

These claim kinds are excluded from Base City placement:

- `current_location`
- `temporary_location`
- `event_presence`
- `travel_location`

Current / temporary / event / travel evidence may be useful to the separate Current / IRL layer, but it cannot mutate Home/Base City.

## City states

- `mapped`
  - one or more accepted Base City rows agree on the same Country/Region/City key
  - public Base City placement is eligible
- `conflict`
  - accepted Base evidence disagrees on Country or City
  - fail closed; no City placement
- `country_only`
  - accepted Base evidence has Country but no City
  - no City inference
- `current_only`
  - only Current/temporary/event/travel City evidence exists
  - no Base City placement
- `context_only`
  - context evidence such as birthplace exists without qualifying Base City evidence
  - no Base City placement
- `privacy_invalid`
  - precise-location keys such as address or coordinates are present
  - fail closed; no placement
- `excluded_non_person`
  - confirmed organization or event broadcast
- `unmapped`
  - no explicit accepted Base City evidence

## Confidence classes

For `mapped` rows:

- `single_explicit_base_city`
  - exactly one accepted Base City row places the City
- `consistent_multiple_explicit_base_city_rows`
  - multiple accepted Base City rows agree on the same City

These labels must not be presented as numeric confidence scores or probabilities.

## Privacy boundary

Public precision is Country / Region / City only. The classifier fails closed if retained input contains address, postal, coordinate, latitude/longitude, GPS, or equivalent precise-location keys.

No address, coordinates, precise travel path, or private venue detail may be published by this layer.

## Provider boundary

This contract is Twitch-only. Twitch and Kick geography are not aggregated. Kick requires its own stable identity and evidence path.

## Original activation boundary and present meaning

The original v0.1 package itself was a pure classification/validation layer and did not authorize deployment, D1/schema/cadence/retention changes or Current/IRL activation.

Later accepted City API/UI/renderer work has now consumed this contract. That later implementation does **not** authorize:

- production data mutation by implication;
- Current/IRL activation;
- precise creator coordinates;
- Country-to-City inference;
- Twitch/Kick geography aggregation.
