# Twitch Stream Map City reference-geometry source audit — 2026-09-05

Status: accepted source-strategy audit on merge  
Parent City specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
Audited runtime baseline: main `801860483b50bf418d8edfb5295542244e69c138`

## Decision

Do **not** select one global City dataset and silently resolve every `countryCode + region + city` string against it.

Adopt a **reviewed static City reference-geometry registry**.

Each registry entry is approved against one exact ViewLoom City aggregate key and records its source, geometry class, version, license and attribution. A City without an accepted registry entry remains fully usable in the aggregate list and receives no map target.

Accepted source classes for the first registry version:

1. **geoBoundaries gbOpen** — candidate source for a City/municipal administrative polygon only when a reviewer confirms that a specific boundary unit actually represents the ViewLoom City aggregate.
2. **Natural Earth Populated Places** — candidate fallback for a City aggregate reference point when an exact reviewed City/country match exists and no accepted polygon is available.

Deferred/rejected for v0.1:

- **Overture Maps divisions** — technically useful, but deferred as the primary City source because locality/sub-county coverage is documented as spotty and the divisions theme is ODbL. It may be reconsidered through a separate license/coverage decision.
- **public Nominatim API** — rejected as a production/bulk geometry resolver. Its public usage policy discourages periodic/bulk geocoding and forbids systematic extraction. No public runtime dependency is introduced.
- arbitrary browser geocoders, Country centroids, region centroids, venue coordinates and creator-derived coordinates — prohibited.

## Evaluation criteria

A City geometry source must be evaluated on:

```text
semantic object represented
world/country coverage
stable record identity
matching fields
ambiguity behavior
license/attribution
update model
file/runtime cost
network dependency
precision/privacy risk
fail-closed behavior
```

The geometry source does not decide whether a streamer belongs to a City. The accepted City evidence contract decides placement first; geometry only decorates an already accepted City aggregate.

## Candidate 1 — Overture Maps divisions

Official documentation reviewed:

- https://docs.overturemaps.org/guides/divisions/
- https://docs.overturemaps.org/schema/reference/divisions/division/
- https://docs.overturemaps.org/schema/reference/divisions/division_area/
- https://docs.overturemaps.org/attribution/

Observed properties:

- divisions include countries, regions, counties, cities/localities and neighborhoods;
- `division` supplies an approximate point associated with the division;
- `division_area` supplies polygon/multipolygon areas where available;
- current documentation states global country/region/county coverage but notes that sub-county/locality coverage is often spotty;
- releases are monthly and available from public AWS/Azure storage;
- the divisions theme is published under ODbL because it includes OpenStreetMap data;
- the full divisions theme is large, while selective query/download is supported.

### Decision

**Deferred as the default v0.1 source.**

Reasons:

1. City/locality completeness is not strong enough to make `not found` mean anything about ViewLoom City validity.
2. ODbL introduces a wider database-license/attribution decision than is necessary for the first City geometry layer.
3. Overture's hierarchy/subtype is not guaranteed to map automatically to ViewLoom's semantic `city` field.
4. Runtime or build-time name matching would still need a reviewed ambiguity layer.

Overture remains a future candidate if a later gate accepts its license boundary and uses explicit reviewed GERS/division IDs rather than fuzzy names.

## Candidate 2 — geoBoundaries gbOpen

Official documentation reviewed:

- https://www.geoboundaries.org/
- https://www.geoboundaries.org/api.html
- https://www.geoboundaries.org/simplifiedDownloads.html

Observed properties:

- gbOpen is CC BY 4.0 and requires attribution;
- programmatic access is explicitly supported;
- data is organized by country and ADM level;
- different countries expose different deepest ADM levels;
- ADM level does not globally mean `city` or `municipality`;
- simplified GeoJSON is available for visualization;
- API metadata exposes source/license/year/build/update information and static download URLs.

Examples from the current API index reinforce the hierarchy mismatch:

- USA exposes ADM0, ADM1 and ADM2 only;
- JPN exposes ADM0, ADM1 and ADM2 only;
- other countries may expose ADM3/ADM4/ADM5.

Therefore a fixed rule such as `City = ADM2` or `City = deepest ADM` is invalid.

### Decision

**Accepted as a reviewed polygon source, not an automatic resolver.**

A geoBoundaries unit may enter the ViewLoom registry only when a reviewer confirms:

```text
exact ViewLoom City aggregate key
-> specific geoBoundaries country + ADM layer + feature
-> feature semantically represents that City/municipality
-> no same-name/cross-region ambiguity remains
-> source/version/license retained
```

If a country has no suitable municipal boundary at the available ADM levels, geoBoundaries produces no City map geometry for that aggregate.

## Candidate 3 — Natural Earth Populated Places

Official documentation reviewed:

- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/
- https://www.naturalearthdata.com/about/terms-of-use/

Observed properties:

- Populated Places is a point dataset for cities and towns;
- the 1:10m dataset includes major/regional cities plus a sampling of smaller places, not every City;
- Natural Earth data on the site is published as public-domain data under its stated terms;
- the simple 1:10m populated-place package is small enough for a static build-time/reference dataset;
- a point represents the place, not a creator location.

### Decision

**Accepted as a reviewed aggregate reference-point fallback.**

It is not a City boundary and must never be styled or described as a creator pin.

A Natural Earth point may enter the registry only when:

```text
country match is explicit
AND City name match is reviewed
AND any available region/admin context is compatible
AND no unresolved same-name ambiguity remains
```

Missing Natural Earth coverage is a normal `no_geometry` condition, not a placement failure.

## Candidate 4 — public OpenStreetMap Nominatim

Official policy reviewed:

- https://operations.osmfoundation.org/policies/nominatim/

The public service policy states, among other limits:

- absolute maximum usage constraints;
- periodic requests are considered bulk geocoding and are strongly discouraged;
- larger/systematic extraction should use other data access methods;
- results should be cached;
- autocomplete/systematic queries are forbidden.

### Decision

**Rejected for ViewLoom City geometry resolution.**

No browser/runtime call to the public Nominatim service is authorized. No periodic build job may use it as an implicit complete City resolver.

This does not reject OpenStreetMap data as a concept; it rejects this public service dependency for the ViewLoom use case.

## Accepted architecture

```text
accepted City evidence
-> exact ViewLoom City aggregate key
-> lookup reviewed local registry entry
   -> polygon entry: render City aggregate area
   -> reference-point entry: render aggregate reference target
   -> no entry: list-only City aggregate
```

There is no fallback from a failed registry lookup to fuzzy search, geocoding, Country centroid or region centroid.

## Registry source priority

For one aggregate key, prefer:

```text
1. reviewed municipal/City boundary from geoBoundaries gbOpen
2. reviewed Natural Earth Populated Places reference point
3. no geometry
```

This priority is semantic, not a claim that geoBoundaries has better universal coverage. A point fallback is allowed only because the City visualization spec explicitly permits an aggregate reference target when no usable boundary exists.

## Runtime/network decision

The public page must not call geoBoundaries, Natural Earth, Overture or a geocoder at runtime.

Accepted geometry is vendored as a bounded static ViewLoom artifact generated from reviewed registry entries.

Effects:

- no per-user external lookup cost;
- no public API quota dependency;
- reproducible browser tests;
- geometry changes arrive through reviewed repository changes;
- missing geometry fails closed to list-only.

## Matching decision

Automatic fuzzy matching is prohibited.

The registry key is the same deterministic City aggregate key used by C1:

```text
countryCode + normalized region or explicit missing-region sentinel + normalized city
```

A geometry source's own feature ID is retained separately. Display-name changes must not silently remap an existing geometry entry.

For an aggregate with missing region, a same-name collision inside the country blocks geometry acceptance unless another retained source identifier makes the match unambiguous and a reviewer records it.

## License/attribution decision

### geoBoundaries

- use only `gbOpen` records for this initial contract;
- retain `CC BY 4.0` and source metadata in the registry;
- expose geoBoundaries attribution on any public City map that actually renders such geometry.

### Natural Earth

- retain dataset/version/source metadata even though Natural Earth states the data is public domain and does not require credit;
- optional credit may still be shown for transparency.

### Mixed-source artifact

The generated artifact must retain per-feature source metadata so public attribution can be computed from geometry actually present in the build rather than pretending the whole file has one source.

## Initial registry schema

Each accepted entry must contain at minimum:

```text
schemaVersion
cityAggregateKey
countryCode
region
city
geometryKind            boundary | reference_point
sourceDataset           geoboundaries_gbopen | natural_earth_populated_places
sourceFeatureId
sourceVersion
sourceUrl
license
attribution
reviewedAt
geometryArtifactPath or generated feature linkage
```

No creator login, Twitch user ID, address or creator coordinate belongs in the geometry registry.

## Fail-closed states

```text
no registry entry                -> no_geometry / list-only
ambiguous source match           -> no_geometry / list-only
source semantics uncertain       -> no_geometry / list-only
license/source metadata missing  -> no_geometry / list-only
invalid geometry                 -> no_geometry / list-only
```

None of these states changes accepted City evidence or City aggregate counts.

## Cost decision

The accepted architecture requires no new paid service and no runtime external API.

The bounded registry/artifact grows only with reviewed City aggregates that ViewLoom can actually place. ViewLoom does not need to package a worldwide municipal-boundary database merely to render a small observed City set.

## C2 completion result

C2 is **accepted on merge** with the reviewed-registry architecture above.

C3 is authorized only to consume entries that conform to the separate City reference-geometry contract. It is **not** authorized to add automatic source querying/matching or creator point placement.

Immediate next geometry work after this audit:

1. add the registry/validator contract;
2. review geometry only for current accepted City aggregate keys;
3. generate the smallest static artifact needed for those accepted entries;
4. implement C3 against the registry with list-only fallback.
