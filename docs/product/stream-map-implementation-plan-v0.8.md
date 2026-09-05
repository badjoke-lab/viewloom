# ViewLoom Stream Map Implementation Plan v0.8

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.7.md`  
Audited runtime baseline: main `13af00ce399bcf85d3699815730deda5cd78288f`  
Date: 2026-09-05

## 1. Current position

Twitch Country and Twitch City are closed at their current public product boundaries.

Completed sequence since v0.7:

```text
#1222  City aggregate model + selection
#1223  City reference-geometry source contract
#1224  reviewed City reference-geometry registry
#1225  initial Natural Earth reference-point review
#1226  completed current City reference-point review
#1227  reviewed City aggregate reference-point renderer
#1228  City public activation contract aligned
#1229  production City browser contract strengthened
#1230  mapped City results ordered before unmapped diagnostics
#1231  unavailable Current-location evidence filter disabled in City
#1232  City mapped-stream results expanded to full width
#1233  C6 public acceptance audit
#1234  Twitch Current public-readiness gate aligned with current main
#1235  Kick Country public-readiness gate aligned with current main
```

Country issue #1214 is closed as completed. City C1-C6 are complete and production/browser accepted.

The next work is not another City C-stage. The remaining Map lanes are Kick Country and Current / IRL, with explicit blockers that must not be bypassed by stale Draft PRs.

## 2. Execution model

```text
Lane A  Twitch Country maintenance/quality only
Lane B  Twitch City maintenance/quality only
Lane C  Kick Country blocked production dependency + safe preparation
Lane D  Current Location / IRL blocked production/evidence dependencies + safe preparation
Lane E  shared Map UI/accessibility/verification
Lane M  reviewed-evidence maintenance only
```

Lane M does not schedule or block A-E.

CI waiting or a blocked production dependency in one lane does not stop independent read-only audits, fixtures, validators, evidence review, documentation or non-mutating preparation in another lane.

## 3. Lane A — Twitch Country — CLOSED

Accepted public boundary:

- choropleth / filled Country regions are primary;
- no public Markers/Regions A/B switch;
- small-country aggregate markers are fallback controls only;
- Streams/Viewers intensity with five positive buckets;
- map and Country-list selection remain synchronized;
- Country selection is independent of camera movement;
- explicit `World view` reset;
- Map → selected Country → mapped results → unmapped diagnostics;
- responsive/mobile/browser/OpenFreeMap proof complete;
- no creator coordinate semantics.

Issue #1214 is completed and closed. Country work is now scoped defect, accessibility, regression and evidence-quality maintenance only.

## 4. Lane B — Twitch City — C1-C6 COMPLETE

### B0. Placement boundary

City remains an aggregate geography surface, not a creator-coordinate surface.

- explicit `?geography=city` API/UI mode;
- accepted Base City only from `home_base` / `declared_location` evidence;
- Country-only evidence is not promoted to City;
- Base City conflicts fail closed;
- current/temporary evidence is excluded from Base City placement;
- login is not stable identity;
- no address/GPS/creator coordinate publication or inference;
- Current / IRL remains separate and disabled.

### B1. City aggregate model — COMPLETE

The deterministic City aggregate key remains:

```text
countryCode + normalized region (or __none__) + normalized city
```

City list selection, same-name separation, stream/viewer totals, selected-City drilldown and filter-zero state are implemented.

### B2. Reviewed reference geometry — COMPLETE FOR CURRENT SET

The registry is bounded to accepted City aggregates and preserves aggregate semantics.

Current reviewed state:

```text
reference_point  8
no_geometry      1
```

`Sant Cugat del Valles` remains `no_geometry` under the reviewed Natural Earth v5.1.2 source result and therefore remains list-only.

Reviewed Natural Earth points are `city_aggregate_reference` targets only. They are not municipal boundaries and are not creator home/current positions.

### B3. City map rendering — COMPLETE

Only registry entries with reviewed `reference_point` geometry render map targets. `no_geometry` entries remain selectable from the list without an invented map target.

Map/list selection synchronization and Country-marker suppression in City mode are browser verified.

### B4. Public UI cleanup — COMPLETE

Accepted City presentation includes:

- City public activation contract true;
- Current / IRL activation false;
- Current-location evidence filter disabled in City mode because City Base placement cannot match it;
- mapped City results before unmapped diagnostics;
- full-width City mapped-stream result surface;
- City aggregate reference semantics exposed explicitly;
- production browser reconciliation between reviewed reference rows and rendered markers.

### B5. Public acceptance — COMPLETE

Current acceptance audit:

`docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json`

Historical 2026-08-26 gate audit remains historical and is not rewritten.

No new City stage is scheduled after C6. Future City changes are scoped quality/coverage work under the same semantic boundaries.

## 5. Lane C — Kick Country — PREPARED, PRODUCTION DEPENDENCY BLOCKED

Current main already provides these stages ready in code:

- read-only latest Kick minute-snapshot source;
- optional `broadcaster_user_id` consumption in snapshot parsing;
- public adapter stable-ID consumption without slug fallback;
- Kick-only reviewed Country evidence bridge;
- deterministic stable-ID live join;
- Country response core;
- public-readiness validator.

Reviewed Country batches are complete:

```text
reviewed identities       100
accepted Country          7
excluded non-person       3
no qualifying evidence   90
```

The existing reviewed-evidence validator reconciles the real four review-result batches through the evidence bridge, stable-ID live join and Country response core.

Current exact blockers are:

```text
1. production livestream snapshot does not retain broadcaster_user_id
2. reviewed Kick Country evidence is not connected to the public runtime
3. public Kick Country activation is not authorized
```

The first blocker requires a production collector mutation and therefore requires explicit authorization before implementation/merge. Stale Draft #1083 must not be merged as-is.

When collector authorization is eventually given, create a clean current-main implementation PR and re-run the existing readiness gates rather than blindly merging/rebasing #1083.

Until then, safe work may include read-only audits, validator maintenance, reviewed evidence work, fixtures and non-activating runtime preparation.

## 6. Lane D — Current Location / IRL — PREPARED, BLOCKED

Current remains temporary, fresh and independent from Home/Base.

Ready-in-code stages:

- common Twitch Stream Map parser can consume optional `twitchUserId` / `user_id` and report stable-ID coverage;
- Current response core requires stable identity and fails closed;
- expiry/conflict/current-evidence semantics remain isolated from Base City;
- Current UI control remains disabled and public activation unauthorized;
- explicit current public-readiness validator is wired to the existing Current response workflow.

Current exact blockers are:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

The first blocker requires a production collector mutation and therefore requires explicit authorization. Stale Draft #1107 must not be merged as-is.

The third blocker is substantive: stable-ID plumbing alone never authorizes Current placement. Public Current remains disabled until fresh accepted temporal evidence exists and a separate public API/UI activation gate is intentionally completed.

No Home/Base mutation, expired placement, early future placement, event-venue-as-presence inference, travel-path inference or residential/GPS publication is authorized.

## 7. Lane E — Shared UI / accessibility

Safe shared work remains:

- keyboard/focus verification;
- mobile tap-target/overflow regression checks;
- map/legend/accessibility labels;
- explicit empty/conflict/unmapped state presentation;
- geography URL-state verification;
- production/browser structural verification.

Shared mechanics must not force Country, City and Current into one geometry or evidence model.

## 8. Lane M — reviewed-evidence maintenance

The bounded Top-20 maintenance process remains a maintenance sublane only.

It does not:

- serialize Map development;
- impose weekly idle time on other safe lanes;
- authorize automatic geography acceptance;
- authorize collector/schema/cadence/retention mutation.

## 9. Documentation sync gate

For every normative Stream Map change evaluate:

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

Material plan changes use a new version. Superseded versions remain historical and do not override the active authority chain.

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
- no collector/D1/schema/cadence/retention mutation without its own authorization/gate.

## 11. Immediate execution order

```text
DONE  Twitch Country current product boundary + #1214 closeout
DONE  Twitch City C1-C6 + production/browser/public acceptance
DONE  Twitch Current current-main readiness re-audit #1234
DONE  Kick Country current-main readiness re-audit #1235
NOW   safe non-mutating Kick/Current preparation and evidence/validator work
BLOCK Kick production stable-ID persistence pending explicit collector authorization
BLOCK Current production stable-ID persistence pending explicit collector authorization
BLOCK Current public path additionally pending fresh accepted temporal evidence
```

No schedule should send development back to City C1/C2/C3/C4/C5 as unfinished work.

## 12. Definition of remaining Map completion path

```text
Twitch Country remains usable/tested/evidence-safe
AND Twitch City remains useful without inferred creator precision
AND Kick Country obtains stable provider identity in the production snapshot under explicit authorization
AND reviewed Kick evidence is then connected through the already-prepared provider-specific response path
AND Kick public activation is separately authorized and production-proved
AND Current/IRL obtains production stable identity only under explicit authorization
AND Current/IRL reaches a public layer only if fresh accepted evidence supports it
AND provider/geography/evidence controls remain explicit and non-aggregating
AND current spec/plan/roadmap/schedule match main
```
