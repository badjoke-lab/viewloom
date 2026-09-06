# ViewLoom Stream Map Implementation Plan v0.10

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.9.md`  
Audited runtime baseline: main `4068b41f0ec7e686f915915022c05a7c88ae60e5`  
Date: 2026-09-06

## 1. Current position

Twitch Country and Twitch City are closed at their current public product boundaries.

The September 6 shared Twitch Map keyboard/mobile/legend regression batch is complete through #1247. The already-public `/twitch/map/` route is permanently covered by sitemap/public-surface/browser/production-smoke inventory through #1259, and the later stale-data/unavailable-presentation closeout is complete through #1275/#1276. Shared UI is scoped maintenance/quality work only rather than an unfinished serial phase.

Current / IRL remains fail-closed after the latest September 6 Top300 sequence measured 300 unique stable identities, reviewed 10 candidates across 40 accepted-class identity pairs, and produced zero fresh qualifying evidence and zero accepted Current placements.

Kick Country has two distinct tracks that must not be conflated:

```text
runtime/data readiness
  K1 reviewed-evidence runtime staging              COMPLETE #1239
  K2 production broadcaster_user_id persistence    COMPLETE #1249
  K3 production reviewed-evidence runtime join     COMPLETE #1252
  K4 public activation                             SEPARATE EXPLICIT GATE / NOT AUTHORIZED

pre-public UI readiness
  KUI1 fail-closed preview shell                    COMPLETE #1241
  KUI2 Country aggregate choropleth/results UI      COMPLETE #1242
  KUI3a non-mutating browser proof                  COMPLETE #1244
  KUI3b real production-connected browser/API proof COMPLETE #1253
```

K4 preactivation proof #1255 and the exact cutover contract #1265 are complete, but they do not authorize K4 activation.

The public route is still intentionally absent:

```text
/apps/web/kick/map/     absent
/kick/map/              not public
```

K3 now supplies real reviewed Country terminal rows through the production Kick API, but public response rows strip stable identity. KUI3b proves the existing Country renderer against the real production-connected payload while the normal preview remains K4-gated. Neither K3 nor KUI3b authorizes K4.

Accepted K3 production chain:

```text
#1252 production commit       0e7b6b0682df21864551b6d47d9520209f42829f
Deploy Web Pages             34010236812 success
Country readiness            34010236815 success
Production API Smoke         34010236817 success
observedStreams              100
stableIdentityStreams        100
state                         blocked_public_activation
publicActivationAuthorized   false
reconciliation               pass
stable identity published    false
```

Accepted KUI3b post-merge main proof run `34010502534`:

```text
production deployment commit  0e7b6b0682df21864551b6d47d9520209f42829f
observedStreams               100
stableIdentityStreams         100
reviewedIdentityStreams         9
mappedStreams                   2
mappedViewers               12848
mappedCountryCount              2
mappedCountryCodes          BR, PL
viewports                       2
browser scenarios               4
violations                      0
artifact                 9982308317
```

Those live mapped/reviewed counts are an accepted sample, not fixed catalog totals. The fixed reviewed catalog remains 100 identities: 7 accepted, 3 excluded non-person, 90 no qualifying evidence, 0 conflict.

The active Map lanes are:

```text
Lane A  Twitch Country maintenance/quality only
Lane B  Twitch City maintenance/quality only
Lane C  Kick Country runtime/data maintenance after K1-K3 completion
Lane U  Kick Country pre-public UI maintenance after KUI1-KUI3b completion
Lane D  Current Location / IRL
Lane E  shared Map UI scoped maintenance/verification only
Lane M  reviewed-evidence maintenance only
Lane K4 separate Kick public activation gate
```

Lane M does not serialize or pause A-E/U. K4 cannot be inferred from completion of another lane.

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

A blocked production dependency in one lane does not stop safe work in another lane. The completed K2 authorization was consumed by #1249. The completed K3 authorization was consumed by #1252. Neither authorizes K4 or Twitch stable-ID persistence.

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

PR #1239 established the internal reviewed-evidence path:

```text
completed manual review results
-> terminal-only reviewed Country evidence
-> stable broadcaster_user_id join
-> deterministic Country response
```

Validated catalog:

```text
result files                  4
reviewed                    100
accepted Country              7
excluded non-person           3
no qualifying evidence       90
conflict unmapped             0
reconciliation passes       true
public activation           false
stable identity             broadcaster_user_id
```

The reviewed-evidence bridge keeps only the minimum terminal state needed for runtime Country placement. It drops slug/viewer/raw prose/source provenance and detail beyond reviewed Country. UI must not reconstruct dropped evidence fields.

### K2. Production stable identity — COMPLETE

PR #1249 retained `broadcaster_user_id` directly from the existing official `/public/v1/livestreams` response and persisted it through the existing minute-snapshot JSON path.

K2 added zero additional Kick API requests, no Channels lookup for stable identity, no D1 schema/binding change, no cadence change, no retention/backfill change and no Twitch collector change.

Provider-scoped deploy run `34008654160` proved Kick-only deployment and Twitch skip. Production API proof run `34008795931` observed 100/100 stable identities.

Draft #1083 is superseded by #1249 and closed.

### K3. Production runtime connection — COMPLETE

PR #1252 connects the real production snapshot to the reviewed Country catalog by `broadcaster_user_id` only.

Required properties are now enforced in code/CI:

- stable join uses `broadcaster_user_id` only;
- slug/login remains display metadata only;
- Twitch evidence is never reused;
- terminal states remain mapped / unmapped / excluded / conflict;
- accepted Country code is the only geography emitted for this surface;
- no City or Current inference;
- no creator coordinates;
- server-side runtime data contains only stable ID, terminal outcome and accepted Country code;
- public response strips `broadcaster_user_id` and `stableKickUserId` keys;
- public response omits City, Current, address, coordinate, evidence-prose and source-provenance fields;
- reconciliation covers every selected production stream.

The production route reports technical Country readiness while remaining `blocked_public_activation`. K3 therefore closes runtime connection only.

### K4. Public Kick Country activation — SEPARATE GATE / NOT AUTHORIZED

K4 requires a new explicit authorization after the accepted K3/KUI3b proof. Preactivation proof #1255 and the exact file-level cutover contract #1265 are complete, but neither changes the authorization state.

Only K4 may:

- create/activate canonical `/kick/map/`;
- add a public Kick Map navigation target;
- add the production Vite entry for a public Kick Map page;
- change `publicActivationAuthorized` to true in the production public contract;
- perform the final public browser/API/production acceptance for that activation.

K1-K3, KUI1-KUI3b, #1255 and #1265 do not implicitly authorize K4.

## 6. Kick Country — PRE-PUBLIC UI TRACK

### KUI1. Fail-closed preview shell — COMPLETE

PR #1241 added `apps/web/preview/kick-stream-map/` with `noindex,nofollow`, no public canonical URL and no `/kick/map/` public route.

### KUI2. Country aggregate visualization/results — COMPLETE

PR #1242 added:

- deterministic aggregation from `mappedStreams[].geography.countryCode` only;
- local Country GeoJSON region fill;
- Viewers / Streams intensity;
- Country selection and World view reset;
- mapped stream list;
- unmapped / excluded / conflict accounting;
- reconciliation display;
- keyboard focus and minimum tap-target treatment;
- no creator/country marker-as-creator placement;
- no Twitch evidence reuse, provider aggregation, City inference or Current promotion.

### KUI3a. Deterministic non-mutating browser proof — COMPLETE

PR #1244 extends the existing `Kick Stream Map Country Public Readiness` workflow rather than creating another workflow.

Accepted run `33978336854`:

```text
fixtures                       5
viewports                      2 (1440 / 390)
scenarios                     10
violations                     0
mobile horizontal overflow     0
minimum ready action target    44px
creator markers                0
Twitch API requests            0
public /kick/map/ links         0
canonical public URL           absent
```

### KUI3b. Real production-connected browser/API proof — COMPLETE

PR #1253 adds the read-only real-production proof to the same Kick Country readiness workflow.

The proof has two deliberately separate paths:

1. **unchanged production payload** — normal non-public preview remains `country_blocked`, renders no geography and keeps K4 false;
2. **local Chromium renderer proof** — clones that exact production payload and lifts only the K4 authorization flag inside the intercepted test payload, without replacing Country rows/accounting.

Acceptance requirements now proven:

- real production K3 payload is used; no fixture/demo geography substitution;
- Country aggregate totals equal production response accounting;
- mapped/unmapped/excluded/conflict reconciliation passes;
- stable identity fields are absent from the public payload;
- creator markers are zero;
- Twitch API requests are zero;
- City/Current/coordinate fields are absent;
- desktop and 390px mobile pass;
- visible action targets retain the 44px minimum;
- normal preview remains blocked while K4 is false.

Accepted post-merge main run: `34010502534`. Artifact: `9982308317`. Digest: `a97098e9902b2529fc8999b251858089142533934fc78699d7cc94aeba5f8666`.

KUI3b completes proof only and does not authorize K4.

## 7. Current Location / IRL — FAIL CLOSED

Ready in code:

- optional Twitch stable-ID consumption;
- stable-ID coverage state;
- fail-closed Current response core;
- Current public-readiness validator;
- disabled Current / IRL public control.

Latest September 6 bounded review:

```text
source run                               34036562297
artifact                                 9990351519
requested population                            300
unique stable identities measured               300
duplicate stable-ID page overlap dropped          0
reviewable candidates                             10
future/planned travel rejected                     2
accepted-class identity pairs reviewed            40
fresh qualifying evidence                          0
accepted Current placement                         0
no-fresh-qualifying outcomes                      10
true unresolved cross-country conflicts            0
same-country granularity conflicts closed          2
```

The two machine conflict rows were Japan + Tokyo same-country granularity differences, not unresolved competing-country evidence, and neither was promoted to a Current placement.

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

## 8. Shared UI / accessibility — CURRENT REGRESSION BATCH COMPLETE

PRs #1245-#1247 close the concrete September 6 shared Twitch Map UI findings without changing geography/evidence semantics:

```text
#1245  geography resolution controls
       44px minimum targets + focus-visible
       keyboard Country/City switching
       URL-state / aria-pressed / Current-disabled verification
       1440px + 390px Chromium coverage

#1246  compact Country controls and intensity legend
       geography/Streams/Viewers/World view/mobile targets hardened
       duplicate native metric select removed from keyboard interaction
       five-step log legend exposes active Streams/Viewers metric
       keyboard Viewers activation + legend update verified

#1247  City mobile controls
       selected-City actions/evidence filters/population selects/MapLibre controls hardened
       390px City reference-point browser proof enumerates visible enabled controls
       all measured City mobile targets >= 44px
```

PR #1259 adds the already-public `/twitch/map/` route to the permanent public-surface inventory, sitemap, four-viewport browser matrix and production smoke.

PR #1275 closes the stale-data fail-closed defect where a later API/population refresh failure could leave the prior successful Country/stream/count payload visible. PR #1276 completes the unavailable presentation contract: population state becomes `Unavailable`, compact accounting shows `Unmapped accounting unavailable`, and a fresh recovery restores current state. Candidate Public Browser Audit `34041133229` passed the 104-scenario matrix plus success → 503 → recovery with 3 API calls and 0 violations; artifact `9991741143`. Post-merge Primary Domain Production Smoke `34041371788` and Twitch Map Production Browser Smoke `34041371752` also passed; production artifact `9991785120` records Country/City `basemap-ready`, one canvas each, and zero page/console errors.

Further shared UI work is scoped regression/quality only. Shared mechanics may be reused, but evidence and geometry semantics remain provider/geography specific.

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

Material plan changes use a new version. Status synchronization may update the active plan without changing its accepted semantics.

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
DONE   Kick K1 reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate renderer/results #1242
DONE   Kick KUI3a deterministic browser proof #1244 / run 33978336854
DONE   Shared Twitch Map regression/accessibility batch #1245-#1247
DONE   Kick K2 production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
DONE   Kick K3 production reviewed-Country runtime connection #1252 / run 34010236817
DONE   Kick KUI3b real production-connected browser/API proof #1253 / main run 34010502534
DONE   Kick K4 preactivation proof #1255
DONE   Twitch Map permanent public-surface inventory #1259 / 104 scenarios
DONE   Kick exact K4 cutover contract #1265
DONE   Current live candidate probe sequence 4 #1272 / run 34036197901 / 300 -> 10 candidates
DONE   Current review queue refresh #1273 / run 34036562297 / 300 -> 10 reviewed -> 0 accepted
DONE   Twitch Map stale-data fail-closed recovery #1275
DONE   Twitch Map unavailable presentation closeout #1276 / run 34041133229 / artifact 9991741143
PAR    scoped shared Map regression/accessibility + reviewed-evidence maintenance
BLOCK  Kick K4 public /kick/map/ activation pending separate explicit authorization
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

There is no scheduled return to City C1-C5 and no weekly Top-20 serialization of the Map program.

## 13. Proof/state interpretation

Keep these concepts separate:

```text
review catalog total        fixed reviewed identities/outcomes
live reviewed rows          subset of current live snapshot matching catalog IDs
mapped live rows            live reviewed rows with accepted Country outcome
technical Country readiness K3 runtime is connected and reconciled
public activation           K4 explicit authorization; currently false
```

A live mapped count can change from snapshot to snapshot without changing the fixed reviewed catalog or K3 correctness.

## 14. Production/public safety after K3

Current production truth:

- `/api/kick-stream-map` is production-connected to reviewed Kick Country terminal states;
- stable identity is used internally but not published as a row field;
- `publicActivationAuthorized=false`;
- `/kick/map/` remains absent;
- no public canonical/nav/Vite entry exists for Kick Map;
- normal preview remains fail-closed under the real K4=false payload;
- KUI3b's activation lift exists only inside the local intercepted browser proof.

Any change to those public-activation facts is K4 work and requires a new explicit decision.

## 15. Historical accepted category-program state

The completed Twitch category/Heatmap rollout remains a historical accepted milestone and is not reopened by Stream Map work.

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
Keep parent category program #623 open
```

These retained anchors do not authorize Kick category UI, collector/cadence/storage changes, cross-provider aggregation or any Stream Map geography relaxation.
