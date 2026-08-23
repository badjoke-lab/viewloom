# Twitch Stream Map country-only production audit — 2026-08-23

Status: retained read-only production observation  
Verification-only PR: `#992`  
Production mutation: none

## Purpose

PR #990 introduced an explicit country-only public projection so reviewed evidence may retain region/city internally while `/api/twitch-stream-map` keeps those fields unavailable until a separately accepted City gate.

This audit checks the deployed production endpoint after #990.

## Run

```text
workflow run      32612657637
successful job    97128002202
artifact          9485950050
artifact digest   sha256:fc569da96ad668172851237649f93177a00c5a6408fa9e13807dd6a4c8312a5c
updatedAt         2026-08-23T02:20:15.311Z
```

The workflow performed GET requests only against:

```text
https://www.viewloom.net/api/twitch-stream-map
top=300
min_viewers=0
category=all
```

No deploy, storage write, collector change, D1 mutation, cadence change or retention change occurred.

## Production response

```text
observedStreams           300
observedViewers        980,881
mappedStreams               0
unmappedStreams            300
mappedViewers                0
mappedCountryCount           0
currentLocationStreams       0
excludedNonPersonStreams     3
noReviewedEvidence         297
```

The five explicitly inspected reviewed targets were not live+mapped in this timestamped Top 300:

```text
ibai        false
papaplatte  false
ohnepixel   false
hutchmf     false
knirpz      false
```

## Country-only assertion

The workflow requires every mapped row, if present, to satisfy:

```text
location.regions length == 0
location.cities length  == 0
every evidence.region   == null
every evidence.city     == null
```

The workflow completed successfully.

However, this production snapshot had `mappedStreams=0`. Therefore the row-level assertion was vacuously true in this observation: it confirms there was no public region/city leak in the returned snapshot, but it does **not** independently exercise the projector on a live mapped reviewed row.

The non-vacuous projector proof remains the #990 regression suite, which constructs mapped Ibai/Papaplatte/Knirpz rows, verifies retained internal city values, then asserts that the public projection strips all region/city values while preserving country/provenance.

## Semantics confirmed in production

```text
languageUsedForPlacement              false
candidateOnlyPlacementAllowed         false
nonPersonPlacementAllowed             false
conflictingAcceptedCountriesAreMapped false
mappedPlusUnmappedEqualsObserved      true
excludedNonPersonIsSubsetOfUnmapped   true
evidenceSourcesRemainDistinct         true
populationFilterBeforeEvidenceFilter  true
languageUsedForPopulationFiltering    false
```

## Decision

- #990's country-only projection remains required and regression-protected.
- This production observation does not authorize City.
- No need to keep the verification workflow on main; PR #992 should close without merge after this audit is merged.
- A later ordinary production observation with one or more reviewed streamers live may provide an additional non-vacuous live-row check, but the current development gate does not depend on waiting for that event.
- Current work remains `Reviewed-evidence maintenance policy + fixed Top 20 replication`.
