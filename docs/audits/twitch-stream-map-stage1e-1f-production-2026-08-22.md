# Twitch Stream Map Stage 1E–1F production acceptance — 2026-08-22

Status: retained read-only production evidence  
Scope: Twitch only

## Accepted implementation lineage

- PR #971 — entity/claim placement eligibility and retained A4.1 audit
- PR #972 — latest real Twitch snapshot join API
- PR #974 — public `/twitch/map/` route, MapLibre, source/type filters and provenance badges
- PR #975 — verification-only production route/API probe; closed without merge after success

Current accepted implementation SHA after #974:

```text
17bbe766a79903436501b05dc1e4ccb0379aa00a
```

## Production verification method

PR #975 modified only the Web checks workflow on a temporary branch.

The verification performed read-only GET requests against:

```text
https://www.viewloom.net/twitch/map/
https://www.viewloom.net/api/twitch-stream-map
```

It performed no production write, deployment, D1 mutation, collector change or runtime mutation.

Workflow run:

```text
32545020869
```

Web-check job:

```text
96961843621
```

Artifact:

```text
web-checks-logs
artifact id 9468228655
sha256 255baf0c05aaf44caa3442524ab7d5ee62d3443a5e7ced9f4d018aad4a4fad48
```

## Route acceptance

The deployed `/twitch/map/` HTML passed assertions for:

- `Stream Map`
- six `data-location-source` inputs
- `official_external`
- three `data-location-type` inputs
- `current_location`

This proves the merged source/type-filter UI reached the public production route.

## API acceptance

The deployed `/api/twitch-stream-map` response passed:

```text
version == viewloom-stream-map-live-v1
platform == twitch
source == real
languageUsedForPlacement == false
candidateOnlyPlacementAllowed == false
nonPersonPlacementAllowed == false
mappedPlusUnmappedEqualsObserved == true
evidenceSourcesRemainDistinct == true
```

## Production observation at route verification

API `updatedAt`:

```text
2026-08-22T01:55:42.393Z
```

Coverage:

```text
topLimit                  300
observedStreams           300
observedViewers           907197
payloadStreams            300
missingPayloadStreams     0
mappedStreams             0
unmappedStreams           300
eligibleUnmappedStreams   297
excludedNonPersonStreams  3
mappedPercent             0
mappedViewers             0
unmappedViewers           907197
excludedNonPersonViewers  73654
mappedViewerPercent       0
mappedCountryCount        0
currentLocationStreams    0
currentLocationPercent    0
coveredPages              3
hasMore                   true
```

Unmapped reasons:

```text
excluded_nonperson 3
no_reviewed_evidence 297
```

## Earlier live observation

A prior read-only production probe after Stage 1E, before the public route acceptance, observed:

```text
updatedAt                2026-08-21T16:45:07.733Z
observedStreams          300
observedViewers          1805401
mappedStreams            1
mappedViewers            17893
mappedCountryCount       1
currentLocationStreams   0
excludedNonPersonStreams 5
excludedNonPersonViewers 342765
```

The mapped record in that observation was Shotzzy, supported by `official_external` declared-location evidence for United States / Texas / Dallas.

By the later route-verification snapshot that channel was not a mapped member of the current Top 300, so mapped coverage became zero.

## Acceptance conclusion

The public Stream Map uses a live snapshot join rather than a fixed map fixture. Mapped coverage may legitimately move between zero and non-zero values as the Top 300 changes.

Zero mapped streams is an accepted data state. The product must not compensate for low coverage by inferring geography from language, category, name, timezone or other unsupported signals.

## Next gate

Stage 1G must add a true selected-country state and country-to-streamer drilldown while preserving the source/type filter contract and zero-mapped state.
