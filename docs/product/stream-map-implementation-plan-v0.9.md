# ViewLoom Stream Map Implementation Plan v0.9

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.8.md`  
Audited runtime baseline: main `1e70f93e2e6b5db44dbaf527ec6f7e63357e3e8e`  
Date: 2026-09-05

## 1. Current position

Twitch Country and Twitch City are closed at their current public product boundaries.

Current / IRL completed a fresh September 5 Top300 review and remains fail-closed with zero accepted Current placements.

Kick Country K1 is now complete on main through PR #1239:

```text
reviewed Country artifacts
-> reviewed-evidence bridge
-> internal runtime staging core
-> Country response core
```

The internal staging path is exercised against the real four reviewed result files and remains non-public. Public `/api/kick-stream-map` behavior is unchanged.

Validated K1 state:

```text
review result files          4
reviewed identities        100
accepted Country             7
excluded non-person          3
no qualifying evidence      90
conflict unmapped             0
runtime staging connected   true
public activation           false
stable identity             broadcaster_user_id
```

The active Map lanes are therefore:

```text
Lane A  Twitch Country maintenance/quality only
Lane B  Twitch City maintenance/quality only
Lane C  Kick Country blocked on production stable identity + later activation gates
Lane D  Current Location / IRL blocked on production identity/public route/fresh evidence
Lane E  shared Map UI/accessibility/verification
Lane M  reviewed-evidence maintenance only
```

Lane M does not serialize or pause A-E.

## 2. Authority and execution rule

Read Stream Map work in this order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.9.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant lane contracts/specifications
7. current main implementation/tests

Older plans remain historical and do not override v0.9.

A blocked production dependency in one lane does not stop safe work in another lane.

## 3. Twitch Country — CLOSED

Accepted boundary remains:

- choropleth / filled Country regions are primary;
- small-country aggregate markers are fallback controls only;
- Streams/Viewers intensity with five positive buckets;
- map/list selection synchronized;
- Country selection independent of camera movement;
- explicit `World view` reset;
- Map -> selected Country -> mapped results -> unmapped diagnostics;
- no creator coordinate semantics.

Issue #1214 is completed and closed. Future work is scoped regression, accessibility and evidence-quality maintenance only.

## 4. Twitch City — C1-C6 COMPLETE

City remains an aggregate geography surface, not creator-coordinate mapping.

Current accepted boundary:

- explicit `?geography=city` mode;
- Base City only from accepted `home_base` / `declared_location` evidence;
- Country-only evidence is not promoted to City;
- Base City conflicts fail closed;
- current/temporary evidence is excluded from Base City placement;
- login is not stable identity;
- no address/GPS/creator coordinate publication;
- Current / IRL remains separate and disabled.

Current reviewed reference geometry:

```text
reference_point  8
no_geometry      1
```

Natural Earth points remain `city_aggregate_reference` targets only. They are not municipal-boundary or creator-position claims.

City C1-C6 remain complete through #1233. No schedule returns development to C1-C5 as unfinished work.

## 5. Kick Country — K1 COMPLETE / K2 BLOCKED

### K1. Collector-independent reviewed-evidence runtime staging — COMPLETE

PR #1239 merged as:

`1e70f93e2e6b5db44dbaf527ec6f7e63357e3e8e`

K1 added an internal runtime staging core that composes:

```text
completed manual review results
-> buildKickReviewedCountryEvidence(...)
-> buildKickCountryResponse(...)
```

The real four reviewed result files are exercised by the existing reviewed-evidence workflow.

Validated result:

```text
resultFiles                  4
reviewed                   100
accepted                     7
excludedNonperson            3
noQualifyingEvidence        90
conflictUnmapped             0
runtimeStagingConnected    true
reconciliationPasses       true
publicActivationAuthorized false
```

K1 explicitly does not:

- change the production Kick collector;
- change the public Kick route;
- write D1;
- alter schema/cadence/retention;
- treat slug/login as stable identity;
- reuse Twitch evidence;
- automatically promote geography;
- authorize public activation.

The existing two workflows retain separate roles:

- `Kick Stream Map Reviewed Country Evidence` validates the real reviewed data/runtime staging path;
- `Kick Stream Map Country Public Readiness` validates activation blockers and public boundaries.

No redundant new workflow was added.

### Current exact Kick blockers

After K1, the public-readiness gate has exactly two blockers:

```text
1. production_livestream_snapshot_does_not_retain_broadcaster_user_id
2. public_country_activation_not_authorized
```

Readiness stages now include:

```text
collectorStableIdentityPersistence        blocked
publicSnapshotStableIdentityConsumption   ready_in_code
publicAdapterStableIdentityConsumption    ready_in_code
reviewedCountryEvidenceBridge             ready_in_code
countryResponseCore                       ready_in_code
reviewedCountryEvidenceRuntimeStaging     ready_in_code
publicReviewedEvidenceRuntime             not_activated
publicCountryActivation                   blocked
```

### K2. Production stable identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required dependency:

```text
Kick official livestream collection
-> retain official broadcaster_user_id in production minute snapshot
```

This is a production collector mutation and is not authorized by this plan.

Stale Draft #1083 must not be merged as-is. If authorization is later given, create a clean current-main implementation PR and re-run existing readiness gates.

### K3. Production runtime connection — AFTER K2

Only after production snapshots carry stable IDs may the already-prepared provider-specific reviewed Country path be connected to production runtime and production reconciliation verified.

K3 does not automatically authorize public activation.

### K4. Public Kick Country activation — SEPARATE GATE

Public activation requires an explicit decision plus API/browser/production proof. K1-K3 do not authorize it implicitly.

## 6. Current Location / IRL — FAIL CLOSED

Ready in code:

- optional Twitch stable-ID consumption;
- stable-ID coverage state;
- fail-closed Current response core;
- Current public-readiness validator;
- disabled Current / IRL public control.

Fresh September 5 bounded review:

```text
population measured          300
reviewable candidates          8
identities reviewed             8
fresh qualifying evidence       0
accepted Current placement      0
no qualifying evidence          6
true unresolved conflicts       2
```

Authoritative records:

- `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-05.json`
- `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-05.json`

Current exact blockers remain:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

The first blocker requires explicit production collector authorization. Stable identity alone cannot clear the evidence gate.

Do not repeatedly rerun the same live review only to seek a non-zero result. A later run requires a justified new signal/window.

Stale Draft #1107 must not be merged as-is.

## 7. Shared UI / accessibility

Safe independent work remains:

- keyboard/focus verification;
- mobile tap-target/overflow regression checks;
- map/legend/accessibility labels;
- explicit empty/conflict/unmapped states;
- geography URL-state verification;
- production/browser structural verification.

Shared mechanics must not collapse Country, City and Current into one geometry/evidence model.

## 8. Reviewed-evidence maintenance

The bounded Top-20 maintenance process remains maintenance only.

It does not:

- serialize Map development;
- impose weekly idle time on safe lanes;
- authorize automatic geography acceptance;
- authorize collector/schema/cadence/retention mutation.

## 9. Documentation synchronization gate

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

Material plan changes use a new version. Superseded versions remain historical.

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
- no collector/D1/schema/cadence/retention mutation without separate authorization/gate.

## 11. Immediate execution order

```text
DONE   Twitch Country current product boundary + #1214 closeout
DONE   Twitch City C1-C6 + production/browser/public acceptance
DONE   Twitch Current current-main readiness re-audit #1234
DONE   Kick Country current-main readiness re-audit #1235
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
BLOCK  Kick K4 public activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public route/evidence gates remain unresolved
NOW    safe shared Map regression/accessibility work and non-mutating lane maintenance
```

## 12. Remaining Map completion path

```text
Twitch Country remains usable/tested/evidence-safe
AND Twitch City remains useful without inferred creator precision
AND Kick obtains production broadcaster_user_id only under explicit authorization
AND Kick staged reviewed evidence is connected to production runtime only after stable identity exists
AND Kick public activation is separately authorized and production-proved
AND Current/IRL obtains production stable identity only under explicit authorization
AND Current/IRL reaches a public layer only if fresh accepted evidence supports it
AND provider/geography/evidence controls remain explicit and non-aggregating
AND current spec/plan/roadmap/schedule match main
```
