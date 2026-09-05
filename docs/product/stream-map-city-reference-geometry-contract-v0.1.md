# ViewLoom Twitch Stream Map — City reference-geometry contract v0.1

Status: accepted on merge / City C2 geometry-source contract  
Parent City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
Source audit: `docs/audits/twitch-stream-map-city-reference-geometry-source-audit-2026-09-05.md`  
Baseline main: `801860483b50bf418d8edfb5295542244e69c138`  
Date: 2026-09-05

## 1. Scope

This contract governs map geometry for an **already accepted City aggregate**.

It does not determine streamer geography and does not change the City evidence contract.

```text
accepted Base City evidence
-> deterministic City aggregate
-> optional reviewed reference geometry
```

No geometry entry means list-only City, not failed City evidence.

## 2. Registry is authoritative for City map geometry

C3 may render City geometry only when an exact `cityAggregateKey` exists in a reviewed static registry.

Runtime search/geocoding is not an authority source.

Canonical key:

```text
countryCode + normalized region or __none__ + normalized city
```

This must use the same normalization semantics as `city-aggregate-core.mjs`.

## 3. Accepted geometry classes

### `boundary`

A reviewed polygon/multipolygon representing the City/municipality/place administrative area.

Initial allowed source:

```text
geoBoundaries gbOpen
license: CC BY 4.0
```

A geoBoundaries ADM feature is accepted only after manual semantic review. ADM number alone never means City.

### `reference_point`

A reviewed public point representing the City/place aggregate itself, used only when no accepted boundary is available.

Initial allowed source:

```text
Natural Earth Populated Places
license status: public domain under Natural Earth terms
```

Reference points must be rendered as **City aggregate targets**, visually distinct from creator/current-location pins.

## 4. Deferred/rejected source behavior

### Overture Maps divisions

Deferred for v0.1. Do not ingest or render Overture divisions without a later explicit contract revision addressing ODbL, locality coverage and matching.

### Public Nominatim

Rejected as runtime/build bulk resolver. No automatic query fallback is allowed.

### Other geocoders

Not authorized unless this contract is revised.

## 5. Registry record

Each reviewed record must contain:

```json
{
  "schemaVersion": "viewloom-city-reference-geometry-v0.1",
  "cityAggregateKey": "US|texas|austin",
  "countryCode": "US",
  "region": "Texas",
  "city": "Austin",
  "geometryKind": "boundary",
  "sourceDataset": "geoboundaries_gbopen",
  "sourceFeatureId": "...",
  "sourceVersion": "...",
  "sourceUrl": "...",
  "license": "CC-BY-4.0",
  "attribution": "geoBoundaries",
  "reviewedAt": "...",
  "geometryArtifactPath": "..."
}
```

For a missing-region aggregate, `region` is `null` and the key contains the explicit `__none__` sentinel.

No creator identity or creator coordinate is stored in this registry.

## 6. Review requirements

A registry entry is accepted only when all are true:

- aggregate key already derives from accepted City evidence;
- country matches exactly;
- City/place identity is manually reviewed;
- region/admin context is compatible when present;
- same-name ambiguity is resolved explicitly;
- source feature ID is retained;
- source version/date is retained;
- source URL is retained;
- license and attribution are retained;
- geometry class is semantically correct;
- geometry validates;
- no creator/address/current-position semantics are introduced.

## 7. Prohibited matching

Never perform:

- fuzzy City-name matching;
- nearest-place matching;
- Country centroid fallback;
- region centroid fallback;
- venue substitution;
- same-name first-match selection;
- IP/device geolocation;
- creator profile coordinate inference;
- automatic geocoder fallback.

Ambiguity results in `no_geometry`.

## 8. Static artifact

The public renderer consumes a generated static artifact from reviewed registry entries.

The browser must not call external geometry/geocoding APIs.

The artifact must be bounded to accepted registry entries rather than packaging an unnecessary worldwide municipal dataset.

Each generated feature must retain at least:

```text
cityAggregateKey
geometryKind
sourceDataset
sourceFeatureId
sourceVersion
license
attribution
```

## 9. Renderer rules

C3 must:

- join geometry by exact `cityAggregateKey` only;
- render boundary geometry as aggregate area;
- render reference-point geometry as aggregate reference target;
- never use creator-pin styling for either;
- keep selection synchronized with the C1 aggregate list;
- keep selection and camera separate;
- avoid automatic street-level zoom;
- expose source/attribution appropriate to rendered geometry;
- render no target when the registry has no accepted entry;
- leave list/stream drilldown functional when geometry is absent or fails.

## 10. Attribution

If at least one rendered/packaged feature uses geoBoundaries gbOpen, the City map must expose geoBoundaries attribution according to CC BY 4.0 and the source's requested web attribution practice.

Natural Earth states its map data is public domain and credit is not required, but ViewLoom may retain/show source credit for transparency.

Per-feature source metadata remains in the artifact so mixed-source attribution is auditable.

## 11. Validation rules

The registry/artifact validator must fail on:

- duplicate `cityAggregateKey` entries unless an explicitly defined priority mechanism exists;
- unsupported `geometryKind`;
- unsupported source dataset;
- missing source feature ID/version/URL;
- missing license/attribution metadata;
- City/country mismatch;
- key/field normalization mismatch;
- invalid/empty geometry;
- latitude/longitude fields attached to a creator/stream record;
- any runtime geocoder endpoint or Nominatim dependency;
- unresolved ambiguity recorded as accepted.

## 12. Missing-geometry state

`no_geometry` is an ordinary map-decoration state.

It means:

```text
City evidence accepted
City aggregate valid
no reviewed geometry entry available
list/drilldown still available
```

It must not be counted as `country_only_at_city_resolution` or `base_city_conflict`.

## 13. No operational expansion

This contract authorizes no:

- Twitch/Kick collector change;
- D1/schema/binding change;
- cadence/retention change;
- recurring crawler;
- paid API;
- production runtime geocoder;
- Current/IRL activation;
- creator precision expansion.

## 14. C2 acceptance

On merge, City C2 is complete at the source-contract level.

Next geometry sequence:

```text
review current accepted City aggregate keys
-> add bounded registry entries where source match is explicit
-> validate/generate static geometry artifact
-> C3 aggregate renderer consumes artifact
-> unresolved City remains list-only
```
