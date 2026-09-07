# ViewLoom Stream Map Specification v0.8

Status: current authoritative specification  
Supersedes: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.11.md`  
Audited main baseline: `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Date: 2026-09-07

## 1. Product role

Stream Map is ViewLoom's evidence-backed geographic observation surface.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

Unknown, conflicting, candidate-only, stale and rejected geography remains unmapped. Missing geography is never filled with demo or inferred creator location.

## 2. Provider separation

Twitch and Kick remain separate data products.

- no Twitch/Kick geographic aggregation;
- no Twitch evidence reuse for Kick;
- provider-specific stable identities remain provider-specific;
- `/twitch/map/` and `/kick/map/` are independent surfaces;
- provider switching never creates mixed totals.

## 3. Current public state

```text
Twitch Country            PUBLIC / COMPLETE AT CURRENT BOUNDARY
Twitch City               PUBLIC / COMPLETE AT CURRENT BOUNDARY
Kick Country              PUBLIC / K4 COMPLETE
Kick City                 NOT IMPLEMENTED / NEXT PRODUCT LANE
Current Location / IRL    DISABLED / FAIL CLOSED
```

Kick K4 completed in PR #1283 and production commit `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`.

Accepted K4 production proof:

```text
Deploy Web Pages                    34048677710 success
Production Smoke                    34048677691 success
Kick Production API Smoke           34048677721 success
Production Smoke artifact           9993885992
Kick API proof artifact             9993884302
public /kick/map/                    HTTP 200
publicActivationAuthorized          true
state                               ready
observedStreams                     100
stableIdentityStreams               100
reviewedIdentityStreams              35
mappedStreams                         4
mappedCountryCount                    4
reconciliation                      100 / 100 pass
stable identity published           false
City / Current / coordinates        not published
```

Public inventory after K4:

```text
Vite HTML inputs                    27
inventory entries incl. 404         28
indexable routes                    23
sitemap routes                      23
browser scenarios                  108 (27 × 4 viewports)
```

## 4. Country semantics

Country placement is accepted-evidence-only.

Base-capable claims:

- `home_base`
- `declared_location`

A valid `current_location` or `temporary_location` belongs only to Current/IRL. It never mutates Base Country or Base City.

Conflicting accepted countries remain unmapped unless a separately reviewed temporal supersession establishes a real change.

## 5. Country visualization

Country is an aggregate geographic chart.

- filled Country regions are primary;
- small-country aggregate fallback markers are permitted only as aggregate selectors;
- no creator pin semantics;
- Streams/Viewers use five positive log-scaled buckets;
- Country selection and Country list remain synchronized;
- selection does not implicitly move the camera;
- `World view` resets the camera explicitly.

Twitch and Kick may reuse provider-independent rendering mechanics, but never provider data or evidence.

## 6. Twitch City boundary

Twitch City remains Base City aggregation from explicit accepted Base evidence only.

Valid:

- accepted `home_base`
- accepted `declared_location`

Invalid for Base City:

- Country-only evidence;
- `current_location`;
- `temporary_location`;
- birthplace;
- nationality;
- event venue by itself;
- planned/future travel.

No creator address/GPS/precise coordinates are published. Reviewed City reference points are aggregate UI references only, not creator positions or municipal-boundary claims. `no_geometry` remains list-only.

## 7. Kick Country boundary

Kick Country is now public.

Production identity and evidence path:

```text
Kick official live population
-> broadcaster_user_id retained internally
-> Kick-only reviewed terminal Country catalog
-> deterministic stable-ID join
-> public projection strips stable ID
-> Country aggregate response/UI
```

The public Kick Country surface must continue to enforce:

- `broadcaster_user_id` is internal only;
- slug/login is display metadata only;
- Twitch evidence reuse is forbidden;
- provider aggregation is forbidden;
- City inference is forbidden;
- Current promotion is forbidden;
- precise address/coordinates are forbidden;
- every selected population row reconciles to mapped/unmapped/excluded/conflict accounting.

K4 authorization does not authorize any collector, D1, schema, cadence, retention or reviewed-catalog mutation.

## 8. Kick City — next product lane

Kick City is a separate product lane and is not implied by Kick Country.

### 8.1 Identity

Kick City uses `broadcaster_user_id` as the internal stable identity. Slug/login is not a stable identity substitute.

### 8.2 Evidence

Kick City requires a **separate reviewed City evidence catalog** keyed by Kick stable identity.

The Country terminal catalog must not be expanded back into City claims. Country-only acceptance never implies City.

Accepted Base City claim kinds are limited to:

- `home_base`
- `declared_location`

Current/temporary evidence remains excluded from Base City.

### 8.3 Geography output

Public Kick City output may expose aggregate City labels and reviewed aggregate reference geometry only.

It must not expose:

- `broadcaster_user_id`;
- creator latitude/longitude;
- residential/street/postal address;
- GPS or travel path;
- Current/IRL location;
- evidence prose or raw source provenance unless separately specified.

A City without reviewed aggregate geometry remains list-only.

### 8.4 Activation

Kick City is not public merely because this specification exists. Its runtime/API, reviewed City catalog, preview/browser proof and public activation require their own execution gates in v0.11.

## 9. Current Location / IRL

Current remains separate from Base/Home.

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Latest accepted review state remains:

```text
unique stable identities measured       300
reviewable identities                    10
accepted-class review pairs              40
fresh qualifying evidence                 0
accepted Current placement                0
true cross-country conflicts              0
```

Current remains fail-closed.

Production Twitch minute snapshots still do not retain `user_id` / `twitchUserId`; changing that is a production collector mutation and requires separate explicit authorization. Stable identity alone cannot clear the evidence gate while fresh accepted Current evidence remains zero.

Do not repeatedly rerun the same evidence review merely to seek a nonzero result; a new run requires a justified new signal/window.

## 10. Population and filters

Twitch Country/City population order remains:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> geography layer
-> evidence placement gate
-> evidence source/type filters
-> geography drilldown
```

Twitch controls remain Top N 20/50/100/300, minimum viewers, category and evidence dimensions as already implemented.

Kick City must define its own provider-appropriate population contract before public activation and must not silently inherit Twitch Top300 semantics.

## 11. Unmapped/excluded accounting

Unmapped is first-class product state.

At minimum preserve explicit accounting for:

- no qualifying reviewed evidence;
- candidate-only evidence;
- conflicting accepted geography;
- Country-only evidence at City resolution;
- missing/ambiguous stable identity where required;
- excluded non-person/event/organization entities under the active contract;
- expired/future/conflicting Current evidence when Current is evaluated.

## 12. Privacy and precision

Do not publish or infer through Stream Map:

- residential/street/postal address;
- exact creator latitude/longitude from private/base evidence;
- GPS trace;
- private venue/hotel/room detail;
- inferred travel path.

Country polygons and City aggregate reference geometry are UI targets, not creator coordinates.

## 13. Operational boundaries

Separately gated unless explicitly authorized:

- production collector behavior;
- collector cadence;
- D1 writes/schema/bindings;
- retention/backfill;
- permanent acquisition expansion;
- Current/IRL activation.

Read-only audits, fixtures, validators, PR CI, docs and preview/browser-safe work do not wait for reviewed-evidence maintenance cadence.

## 14. Execution lanes

```text
Lane A   Twitch Country scoped maintenance only
Lane B   Twitch City scoped maintenance only
Lane KC  Kick Country scoped maintenance after K4
Lane KCI Kick City specification -> reviewed evidence -> runtime -> UI -> activation
Lane D   Current/IRL fail-closed readiness
Lane E   shared Map UI/accessibility/production verification
Lane M   reviewed-evidence maintenance only; never global blocker
```

The main product-development lane after K4 is **KCI Kick City**. Current/IRL remains parallel and must not serialize the Map program.

## 15. Documentation sync

A normative behavior change must synchronize the current specification, execution plan, roadmap and schedule. Versioned documents remain historical; material changes create a new version rather than silently rewriting prior accepted meaning.
