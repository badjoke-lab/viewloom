# ViewLoom Stream Map Implementation Plan v0.7

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.6.md`  
Audited runtime baseline: main `24cd444bfe564588b70c16a335f07d2c41627c0b`  
Date: 2026-09-05

## 1. Current position

The documentation reconciliation and Twitch Country closeout are complete.

Completed sequence:

```text
#1219  current Stream Map source-of-truth reconciliation
#1220  Country closeout residue repair
main    24cd444bfe564588b70c16a335f07d2c41627c0b
Pages   run 33934879891 success
smoke   run 33934879840 success
```

The mainline now moves to Twitch City from the City contract that is already implemented, without reopening Country renderer experimentation.

## 2. Execution model

```text
Lane A  Twitch Country maintenance/quality only
Lane B  Twitch City C1-C5
Lane C  Kick Country evidence/API/public activation
Lane D  Current Location / IRL accepted-evidence/API/UI gate
Lane E  shared Map UI/accessibility/verification
Lane M  reviewed-evidence maintenance only
```

Lane M does not schedule or block A-E.

Within each product lane:

```text
normative contract
-> deterministic core/read-only audit
-> implementation
-> browser verification
-> public/production proof when authorized
```

## 3. Lane A — Twitch Country — CLOSED

Country current product boundary is accepted.

Primary behavior:

- filled Country regions / choropleth;
- no public Markers/Regions A/B switch;
- small-country aggregate fallback only where needed;
- Streams/Viewers, five log-scaled positive buckets;
- selection independent of camera;
- explicit `World view` reset;
- effective order Map → selected Country → mapped results → unmapped diagnostics;
- no creator coordinate semantics.

Closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Country work after closeout is limited to scoped defects, accessibility/regression work and evidence-quality maintenance. It is not a prerequisite for City/Kick/Current progress.

## 4. Lane B — Twitch City

### B0. Existing accepted boundary — DONE

Existing main already provides:

- explicit `?geography=city` API/UI mode;
- Base City only from accepted `home_base` / `declared_location` evidence;
- country-only evidence retained but not promoted;
- `base_city_conflict` fail-closed behavior;
- current/temporary evidence excluded from Base City;
- stable Twitch ID states `unavailable | partial | available`;
- login is not stable identity;
- no creator address/GPS/coordinates;
- no Country-centroid City placement;
- grouped accepted City rows;
- Country aggregate markers suppressed in City mode;
- Current placement count zero in Base City mode;
- production structural smoke covering Country and City.

### B1. City visualization semantics — DONE ON MERGE

`docs/product/stream-map-city-visualization-spec-v0.1.md`

Decision:

```text
primary semantic object     City aggregate
creator exact point         prohibited
exact/list surface          first-class
map target                  accepted City reference geometry only
missing geometry            list-only; never invent target
```

The City aggregate key is `countryCode + region + city`.

### B2. C1 City aggregate model + selection — NOW

Create a pure deterministic core independent of MapLibre.

Required model operations:

1. normalize a mapped City row into an aggregate key;
2. group mapped City rows by exact aggregate key;
3. sum streams/viewers exactly;
4. retain City/region/country display labels;
5. summarize accepted evidence sources without changing placement;
6. select/clear a City aggregate;
7. return mapped-stream drilldown for selected City;
8. preserve identical City names in different country/region keys as separate aggregates.

Hard exclusions from mapped aggregate totals:

```text
countryOnlyStreams
baseCityConflicts
current/temporary-only rows
excluded non-person rows
```

Tests must include same-name collision, missing region, zero/missing geometry and multi-stream same-City aggregation.

No new API, collector or geometry is required for C1.

### B3. C1 City UI wiring — AFTER CORE, SAME LANE

Replace the current display-only grouping with the deterministic aggregate core.

Required behavior:

- City rows are selectable buttons/controls;
- selected City is persistent until cleared or replaced;
- selected City filters mapped stream drilldown;
- selected detail shows City/region/country, streams, viewers and source summary;
- selected City does not activate Current/IRL;
- list remains fully usable without map geometry;
- no creator coordinate is introduced.

Keep the existing explicit geography query state.

### B4. C2 City reference-geometry audit — NOW / PARALLEL

Audit candidate public geometry sources before adding City map targets.

Required decision fields:

```text
source
license
hosting/update model
geometry class            boundary | aggregate reference point
matching key
ambiguity policy
missing policy
bundle/runtime cost
network dependency
privacy/semantic risk
accepted | rejected | deferred
```

Matching requirements:

- input identity is `countryCode + region + city`;
- no silent fuzzy match;
- no Country/region centroid substitution;
- no creator profile coordinate derivation;
- no venue substitution;
- unresolved City remains list-only.

C2 may accept multiple geometry forms with explicit preference order, but every fallback must preserve aggregate semantics.

### B5. C3 City aggregate map renderer — AFTER C2 ACCEPTANCE

If C2 accepts a source:

- render City boundary first when usable;
- otherwise use only an explicitly accepted City aggregate reference target;
- use aggregate styling clearly distinct from creator/current-location pins;
- synchronize map/list selection;
- keep hover informational;
- keep camera and selection separate;
- avoid automatic street-level zoom;
- unresolved City geometry produces no fake target.

If C2 accepts no source, skip C3 map targets and continue list-first C4.

### B6. C4 responsive/detail UI

Desktop:

```text
controls
-> City coverage
-> map/context
-> selected City
-> City aggregates + mapped streams
-> diagnostics
```

Mobile:

```text
compact controls
-> City coverage
-> City aggregates / selected City
-> compact map context
-> mapped streams
-> diagnostics
```

Required diagnostics:

- `country_only_at_city_resolution`;
- `base_city_conflict`;
- excluded non-person;
- parent eligible-unmapped states.

Mobile list selection is the reliable interaction path. No small geometry target may be the only way to select a City.

### B7. C5 verification / production proof

Deterministic verification must cover:

- aggregate reconciliation;
- same-name collision handling;
- region-present and region-missing City rows;
- country-only exclusion;
- conflict exclusion;
- current/temporary exclusion;
- stable-ID available/partial/unavailable state;
- no coordinate/address leakage;
- geometry resolved/unresolved states if C3 exists;
- desktop selection;
- 390px mobile no-overflow/list selection;
- Country isolation;
- production Country+City structural smoke.

Assertions target semantic structure/state, not transient copy.

## 5. Lane C — Kick Country — PARALLEL

Accepted provider path remains:

```text
Kick live population
-> unique official Channels join
-> broadcaster_user_id
-> Kick-only reviewed evidence
-> deterministic Country terminal state
-> Kick-only public activation gate
```

Next:

1. re-audit current main stable-ID persistence/response readiness;
2. identify only the missing provider-specific gate;
3. verify selected-population reconciliation;
4. verify reviewed Kick evidence only;
5. add public API/UI only when the real Kick path can drive it.

No Twitch evidence reuse, slug-as-stable-ID, demo geography, automatic acceptance or implicit collector/D1/cadence/retention expansion.

## 6. Lane D — Current Location / IRL — PARALLEL

Current remains temporary and separate from Base City.

Existing evaluator/snapshot identity work does not itself create accepted Current geography.

Next:

```text
re-audit fresh accepted current/temporary evidence
-> if insufficient: remain disabled/fail closed
-> if sufficient: freeze Current API contract
-> separate Current UI mode
-> expiry/conflict verification
-> production proof
```

No Home/Base mutation, expired placement, early future placement, venue-as-presence inference or travel-path inference.

## 7. Lane E — Shared UI / accessibility

Shared mechanics may be reused only when semantics match.

Current targets:

- keyboard/focus selection;
- mobile tap targets;
- no horizontal overflow;
- readable metric/legend labels;
- explicit empty/conflict/unmapped text;
- geography URL-state stability;
- list remains complete when map geometry fails.

Do not create a shared abstraction that forces Country, City and Current into one geometry type.

## 8. Lane M — reviewed-evidence maintenance

The bounded Top-20 process remains maintenance only.

It does not:

- serialize Map development;
- impose weekly idle time on City/Kick/Current;
- authorize automatic geography acceptance;
- authorize collector/schema/cadence/retention mutation.

## 9. Documentation sync gate

For any normative Stream Map change evaluate:

```text
parent spec impact
active implementation-plan impact
roadmap impact
schedule impact
lane-contract impact
Country/City/Kick/Current semantic boundary
collector/D1/cadence/retention impact
production impact
```

Material new product semantics use a new versioned spec/plan. Superseded versions remain historical and do not override the active authority chain.

## 10. Shared hard stops

- no language/timezone/name/category/IP geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-residence/current placement;
- no City inference from Country;
- no Current inference from Country/Home/Base;
- no Country/region centroid as creator City coordinate;
- no arbitrary/fuzzy geocoder placement;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no inferred travel path;
- no collector/D1/schema/cadence/retention mutation without its own gate.

## 11. Immediate execution order

```text
DONE  #1219 documentation source-of-truth reconciliation
DONE  #1220 Country closeout residue repair + production proof
NOW   City C1 aggregate core + selection
NOW   City C2 reference-geometry source audit
NEXT  City C3 renderer only if C2 accepts geometry
NEXT  City C4 responsive/detail UI
THEN  City C5 production proof
```

In parallel:

```text
Kick Country real provider-specific readiness path
Current/IRL fresh accepted-evidence gate
reviewed-evidence maintenance under its own bounded policy
shared accessibility/verification
```

## 12. Definition of Map completion path

```text
Twitch Country remains usable/tested/evidence-safe
AND Twitch City exposes useful exact aggregates without inferred creator precision
AND any City map target uses reviewed aggregate geometry semantics
AND Kick Country independently reaches a real provider-specific public surface
AND Current/IRL reaches a public layer only if fresh accepted evidence supports it
AND provider/geography/evidence controls remain explicit and non-aggregating
AND current spec/plan/roadmap/schedule match main
```
