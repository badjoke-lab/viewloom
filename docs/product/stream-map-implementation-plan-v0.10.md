# ViewLoom Stream Map Implementation Plan v0.10

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.9.md`  
Audited runtime baseline: main `6b8668492d2a35e9fb83e1d93929fef8b58de215`  
Date: 2026-09-06

## 1. Current position

Twitch Country and Twitch City are closed at their current public product boundaries.

Current / IRL remains fail-closed after the September 5 Top300 review produced zero accepted temporal placements.

Kick Country now has two distinct tracks that must not be conflated:

```text
runtime/data readiness
  K1 reviewed-evidence runtime staging              COMPLETE #1239
  K2 production broadcaster_user_id persistence    BLOCKED BY EXPLICIT AUTHORIZATION
  K3 production reviewed-evidence runtime join     AFTER K2
  K4 public activation                             SEPARATE GATE

pre-public UI readiness
  KUI1 fail-closed preview shell                    COMPLETE #1241
  KUI2 Country aggregate choropleth/results UI      COMPLETE #1242
  KUI3 real production-connected browser/API proof AFTER K3
```

The public route is still intentionally absent:

```text
/apps/web/kick/map/     absent
/kick/map/              not public
```

The completed UI work is stored under the non-production preview surface and is deliberately excluded from the production Vite input. UI preparation therefore no longer waits on K2, while actual live Country rendering and public activation still do.

The active Map lanes are:

```text
Lane A  Twitch Country maintenance/quality only
Lane B  Twitch City maintenance/quality only
Lane C  Kick Country runtime/data path
Lane U  Kick Country pre-public UI path
Lane D  Current Location / IRL
Lane E  shared Map UI/accessibility/verification
Lane M  reviewed-evidence maintenance only
```

Lane M does not serialize or pause A-E/U.

## 2. Authority and execution rule

Read Stream Map work in this order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant lane contracts/specifications
7. current main implementation/tests

Older implementation plans remain historical and do not override v0.10.

A blocked production dependency in one lane does not stop safe work in another lane. In particular, K2 does not prevent preview-only Kick UI, validators, contract work, browser-safe fixtures, documentation or shared UI work.

## 3. Twitch Country — CLOSED

Accepted boundary remains:

- choropleth / filled Country regions are primary;
- small-country aggregate markers are fallback controls only;
- Streams/Viewers intensity with five positive buckets;
- map/list selection synchronized;
- Country selection independent of camera movement;
- explicit `World view` reset;
- Map -> selected Country -> mapped results -> unmapped diagnostics;
- accepted-evidence-only placement;
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
- no Country-centroid City placement;
- Current / IRL remains separate and disabled.

Current reviewed reference geometry:

```text
reference_point  8
no_geometry      1
```

Natural Earth points remain `city_aggregate_reference` targets only. They are not municipal-boundary or creator-position claims. `no_geometry` remains list-only.

City C1-C6 remain complete through #1233. No schedule returns development to C1-C5 as unfinished work.

## 5. Kick Country — DATA/RUNTIME TRACK

### K1. Collector-independent reviewed-evidence runtime staging — COMPLETE

PR #1239 merged as `1e70f93e2e6b5db44dbaf527ec6f7e63357e3e8e`.

Internal staged path:

```text
completed manual review results
-> buildKickReviewedCountryEvidence(...)
-> stable broadcaster_user_id join
-> buildKickCountryResponse(...)
```

Validated result:

```text
result files                  4
reviewed                    100
accepted Country              7
excluded non-person           3
no qualifying evidence       90
conflict unmapped             0
runtime staging connected   true
reconciliation passes       true
public activation           false
stable identity             broadcaster_user_id
```

The reviewed-evidence runtime bridge intentionally keeps only the minimum terminal state needed for runtime Country placement. It drops slug, viewer counts, raw profile text, source prose and location detail beyond reviewed Country. UI must not reconstruct or invent dropped provenance.

K1 does not:

- change the production Kick collector;
- change public Kick geography behavior;
- write D1;
- alter schema/cadence/retention;
- treat slug/login as stable identity;
- reuse Twitch evidence;
- automatically promote geography;
- authorize public activation.

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

Required properties:

- stable join uses `broadcaster_user_id` only;
- slug/login remains display metadata only;
- Twitch evidence is never reused;
- terminal states remain mapped / unmapped / excluded / conflict;
- Country code is the only placement needed for the Country surface;
- no City or Current inference;
- no creator coordinates.

K3 does not automatically authorize public activation.

### K4. Public Kick Country activation — SEPARATE GATE

Public activation requires an explicit decision plus API/browser/production proof after K3. K1-K3 and KUI1-KUI3 do not implicitly authorize it.

Only K4 may create/activate the canonical public `/kick/map/` route and add it to public navigation/production Vite inputs.

## 6. Kick Country — PRE-PUBLIC UI TRACK

This track was missing from v0.9. That omission made internal API/runtime readiness look closer to a public `/kick/map/` page than it actually was. v0.10 makes the UI stages explicit.

### KUI1. Fail-closed preview shell — COMPLETE

PR #1241 merged as `f592559699a03d52b9b063da332fbe5c9e38ddd4`.

Added:

- `apps/web/preview/kick-stream-map/index.html`;
- Kick-specific preview model and renderer;
- readiness/accounting display from `/api/kick-stream-map`;
- explicit dual gate: geography renders only when both runtime readiness and public activation authorization are true;
- validator proving `apps/web/kick/map/index.html` is absent and production Vite input is unchanged;
- existing Kick Country Public Readiness workflow coverage, without adding another workflow.

The preview is `noindex,nofollow`, has no public canonical URL and does not link to `/kick/map/`.

### KUI2. Country aggregate visualization/results — COMPLETE

PR #1242 merged as `6b8668492d2a35e9fb83e1d93929fef8b58de215`.

Added to the pre-public UI path:

- deterministic aggregation from `mappedStreams[].geography.countryCode` only;
- local Country GeoJSON region fill;
- Viewers / Streams intensity;
- Country selection and World view reset;
- mapped stream list;
- unmapped / excluded / conflict accounting;
- reconciliation display;
- keyboard focus and minimum tap-target treatment for new controls;
- explicit rejection of Twitch evidence reuse, provider aggregation, City inference, Current promotion and creator-coordinate semantics;
- deterministic validator wired into the existing Kick readiness workflow.

KUI2 deliberately does not render creator/country markers as creator locations. The visualization is Country-region aggregation only.

### KUI3. Real production-connected proof — AFTER K3

Once K3 makes real production-connected reviewed Country rows available, run the actual Kick UI through:

```text
real production snapshot
-> stable broadcaster_user_id join
-> reviewed Kick Country response
-> Country aggregate UI
-> desktop/mobile/browser verification
-> API/UI accounting reconciliation
```

KUI3 must prove at minimum:

- no fixture/demo geography is substituted;
- Country region totals equal the production response;
- mapped/unmapped/excluded/conflict accounting reconciles;
- Country selection never changes evidence acceptance;
- no creator coordinates are emitted or inferred;
- no Twitch evidence is consumed;
- empty/blocked states remain explicit.

KUI3 still does not authorize K4 by itself.

## 7. Current Location / IRL — FAIL CLOSED

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

Current exact blockers remain:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

The first blocker requires explicit production collector authorization. Stable identity alone cannot clear the evidence gate.

Do not repeatedly rerun the same live review only to seek a non-zero result. A later run requires a justified new signal/window.

Stale Draft #1107 must not be merged as-is.

Current never becomes Base/Home or Base City, and expired Current evidence never survives as a placement.

## 8. Shared UI / accessibility

Safe independent work remains:

- keyboard/focus verification;
- mobile tap-target/overflow regression checks;
- map/legend/accessibility labels;
- explicit empty/conflict/unmapped states;
- geography URL-state verification;
- production/browser structural verification.

Shared mechanics may be reused, but evidence and geometry semantics remain provider/geography specific. Shared mechanics must not collapse Twitch/Kick, Country/City or Base/Current into one evidence model.

## 9. Reviewed-evidence maintenance

The bounded Top-20 maintenance process remains maintenance only.

It does not:

- serialize Map development;
- impose weekly idle time on safe lanes;
- authorize automatic geography acceptance;
- authorize collector/schema/cadence/retention mutation.

## 10. Documentation synchronization gate

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

## 11. Shared hard stops

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

## 12. Immediate execution order

```text
DONE   Twitch Country current product boundary + #1214 closeout
DONE   Twitch City C1-C6 + production/browser/public acceptance
DONE   Twitch Current current-main readiness re-audit #1234
DONE   Kick Country current-main readiness re-audit #1235
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate preview renderer #1242
NEXT   Kick KUI3 proof preparation that does not require production mutation
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
WAIT   Kick K3 production runtime connection until K2
WAIT   Kick KUI3 real-data browser/API proof until K3
BLOCK  Kick K4 public /kick/map/ activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public route/evidence gates remain unresolved
PAR    safe shared Map regression/accessibility work and non-mutating lane maintenance
```

## 13. Remaining Map completion path

```text
Twitch Country remains usable/tested/evidence-safe
AND Twitch City remains useful without inferred creator precision
AND Kick pre-public UI remains ready without pretending to be public
AND Kick obtains production broadcaster_user_id only under explicit authorization
AND Kick staged reviewed evidence is connected to production runtime only after stable identity exists
AND Kick Country UI is proved against real production-connected reviewed rows
AND Kick /kick/map/ is created only through a separate explicit public activation gate
AND Current/IRL obtains production stable identity only under explicit authorization
AND Current/IRL reaches a public layer only if fresh accepted evidence supports it
AND provider/geography/evidence controls remain explicit and non-aggregating
AND current spec/plan/roadmap/schedule match main
```
