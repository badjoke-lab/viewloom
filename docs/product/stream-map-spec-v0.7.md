# ViewLoom Stream Map Specification v0.7

Status: current authoritative specification  
Platform scope: Twitch and Kick remain provider-separated  
Supersedes: `docs/product/stream-map-spec-v0.6.md`  
Implementation baseline: main `6ee0402d38aa47856e7d841b2c4a4544959b70c6`  
Last updated: 2026-09-05

## 1. Product role

Stream Map is ViewLoom's evidence-backed geographic observation view.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

Unknown, conflicting, candidate-only, stale and rejected geography remains unmapped. A missing place is not filled with demo, inferred or approximate creator geography.

## 2. Source-of-truth and scheduling rule

This file is the normative Stream Map product/data/UI specification. The current execution plan is `docs/product/stream-map-implementation-plan-v0.6.md`. Current status and immediate sequencing live in `current-roadmap.md` and `current-schedule.md`.

Older versioned specifications/plans remain historical records and must not override this specification.

Country, City, Kick, Current Location / IRL and Map UI are parallel product lanes. The weekly Top-20 reviewed-evidence maintenance harness is a bounded maintenance mechanism only. It is not the global Stream Map development schedule and must not block safe City/Kick/IRL/UI/spec/audit/fixture work.

No lane silently inherits another lane's production authority.

## 3. Current implementation state

### Twitch Country

```text
real public Map/API                  DONE
population filters                   DONE
evidence source/type filters         DONE
country selection/drilldown          DONE
reason-aware unmapped accounting     DONE
reviewed evidence path               LIVE
Country choropleth renderer          DONE
Streams/Viewers intensity            DONE
5-step log intensity legend          DONE
small-country aggregate fallback     DONE
bounded World/Country camera         DONE
compact desktop/mobile Country UI    DONE
production structural smoke          DONE
```

The Country choropleth was finalized by #1213. Country UI density and interaction behavior were finalized by #1218. Production structural smoke was updated through #1215-#1217.

### Twitch City

```text
City evidence semantics              DONE
City confidence/ambiguity contract   DONE
explicit ?geography=city API         DONE
stable-ID City contract/state        DONE
City UI state verification           DONE
City renderer/isolation              DONE
production structural smoke          DONE
precise creator coordinates          NOT PUBLISHED / NOT INFERRED
Current/IRL use for Base City        DISABLED
```

### Kick

```text
source audit                         DONE
bounded official-source probe        DONE
provider join/evidence contracts     DONE
Kick Country response/core work      DONE
reviewed Country evidence bridge     DONE (#1197)
review batches 03-04                  DONE (#1203)
public Kick Stream Map activation    NOT AUTHORIZED BY THESE STEPS
Twitch evidence reuse                FORBIDDEN
```

### Current Location / IRL

```text
freshness/TTL contract               DONE
retained-evidence audit              DONE
deterministic freshness evaluator    DONE
candidate/reviewability work         DONE through current execution line
snapshot stable-ID adapter           DONE (#1198)
public Current/IRL placement          DISABLED unless fresh accepted evidence exists
Base/Home mutation from Current       FORBIDDEN
```

## 4. Provider separation

Twitch and Kick remain separate at every geography layer.

- no Twitch/Kick geographic aggregation;
- no copying Twitch evidence into Kick records from name/login similarity;
- provider-specific stable identities remain provider-specific;
- `/twitch/map/` and any future `/kick/map/` are independent data surfaces;
- provider-specific coverage, limitations and provenance remain visible;
- a provider switch, if exposed, selects a provider surface rather than creating mixed totals.

## 5. Evidence vocabulary

Evidence sources remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location claim kinds remain distinct:

```text
birthplace
nationality
historical_residence
home_base
declared_location
temporary_location
current_location
event_venue
```

Only claims meeting the active layer's acceptance contract may place a stream.

Field presence is not acceptance. Language, timezone, name cues, category, IP, nationality, birthplace, team/organization headquarters and event venue alone never prove a person's current/base geography.

## 6. Identity boundary

### Twitch

A Twitch login is display/lookup metadata, not a stable identity substitute.

When a real stable Twitch user ID is present in the current snapshot path, internal Stream Map models may retain it. City contract accounting exposes stable-ID availability as coverage state rather than fabricating an ID:

```text
stableIdentityStreams
missingStableIdentityStreams
stableTwitchUserIdState = unavailable | partial | available
```

The public Country response must not expose internal stable Twitch IDs merely because City needs them internally.

### Kick

Kick live identity follows the accepted provider join:

```text
Livestreams V2 channel.slug
-> unique Channels slug match
-> broadcaster_user_id
```

Slug/login is not a stable identity. Missing or ambiguous stable identity fails closed. Twitch stable identity/evidence is not reused for Kick.

## 7. Country placement semantics

Country placement is accepted-evidence-only.

Base-capable claims:

- `home_base`
- `declared_location`

A separately valid `current_location` or `temporary_location` belongs only to Current/IRL when that layer is active. It does not mutate Base Country or City.

Conflicting accepted countries remain unmapped unless an explicit reviewed temporal supersession establishes a real change.

Country selection is a drilldown/filtering state over already accepted geography. It does not change population membership or evidence acceptance.

## 8. Country visualization contract

Country aggregate visualization is a choropleth, not a street-navigation map and not a field of creator pins.

### 8.1 Primary renderer

- accepted Country aggregates are rendered as filled country regions;
- there is no public Markers/Regions A/B switch;
- ordinary Country aggregate markers are hidden while region geometry is available;
- a small country/territory may use an aggregate fallback marker only when the local polygon geometry cannot provide a practical region target;
- that fallback is an aggregate Country selector, never a creator location/current-location pin.

If Country geometry fails to load, the renderer may fail safe back to aggregate markers rather than presenting an empty false-success map.

### 8.2 Intensity

The public Country toolbar exposes:

```text
Streams
Viewers
```

Positive values use five log-scaled buckets so heavy-tail populations remain readable. Zero/no mapped value is not painted as a positive bucket.

The visible legend is five steps from Low to High and represents the currently selected metric.

### 8.3 Basemap and camera

Country is a geographic data chart. The basemap supplies geographic context rather than street-level navigation. Roads/buildings/POIs are not the primary Country context.

Camera contract:

- desktop world overview starts at the bounded world view;
- mobile world overview uses zoom 0;
- Country mode max zoom is bounded at 4.2;
- selecting a Country does **not** automatically move the camera;
- `World view` explicitly resets the camera to the full world view;
- `Clear country` clears Country selection only and does not redefine the camera command;
- hover is informational and does not replace persistent selection.

### 8.4 Country selection

Click/tap on a painted Country region selects the same Country drilldown state as the Country list. The selected Country outline remains visibly distinct. Country-list and map selection stay synchronized.

## 9. Country public UI composition

For Country mode the effective runtime content order is:

```text
Map
-> selected country (when selected)
-> mapped countries / mapped streams
-> unmapped diagnostics
```

This order is established by the Country UI runtime introduced in #1218; the base HTML may contain a different static source order before enhancement.

Additional current behavior:

- population/evidence controls are compacted for the Country view;
- mobile exposes a compact Filters toggle;
- Streams/Viewers are segmented controls in the public UI;
- mapped Country and stream results use a bounded split presentation with internal scrolling where appropriate;
- per-stream evidence is available on demand rather than permanently expanded;
- unmapped diagnostics are summarized and expandable;
- selected Country includes a compact totals summary and a `Show streams` action;
- desktop hover exposes Country totals without changing selection.

The full mapped Country/stream list remains part of the product for exact values, keyboard/accessibility paths and cases where geometry is not a sufficient interaction target. It is secondary to the geographic overview, not a replacement for it.

## 10. City semantics

City is city-level grouping from explicit accepted Base evidence. It is not precise creator geolocation.

Base City claims:

- accepted `home_base`
- accepted `declared_location`

Not valid for Base City:

- `current_location`
- `temporary_location`
- birthplace
- nationality
- historical residence unless explicitly current as Base evidence under the applicable review contract
- event venue without qualifying Base evidence
- planned/future travel

Country never implies City.

Examples:

```text
born in Osaka                  -> no Base City placement
Japanese streamer              -> no Base City placement
playing at an event in Paris   -> no Base City placement
moving to Tokyo next month     -> no Base City placement
lives in Tokyo                 -> potential Base City placement
currently streaming from Seoul -> Current/IRL candidate only
```

## 11. Current City implementation boundary

City activates only with explicit:

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Default Twitch Map behavior remains Country-oriented.

Current City UI/renderer behavior:

- heading and results change to City semantics;
- Country aggregate markers are suppressed;
- Country aggregate result card is hidden;
- selected-Country panel is hidden;
- only mapped rows containing accepted City-level Base evidence are grouped into City places;
- country-only evidence remains accounted but is not promoted;
- Current-location placement count remains zero in Base City mode;
- creator City coordinates are not published;
- no Country centroid is used as a creator/City marker;
- the basemap may remain as geographic context without pretending a precise City coordinate exists.

The City confidence contract describes evidence consistency rather than a probability score. Conflicting qualifying Base City evidence fails closed. Precise-location keys such as address/GPS/latitude/longitude are invalid for the public City placement path.

Country choropleth behavior does not automatically define the eventual richer City visualization. City visualization must be specified from City data semantics, not copied from Country by default.

## 12. Current Location / IRL boundary

Current Location is separate from Home/Base.

```text
Home/Base    where accepted base evidence places the person
Current/IRL  where fresh, explicitly time-bounded accepted evidence places the person now
```

Accepted current/temporary claims require attributable provenance and temporal bounds including `observedAt` and `expiresAt`.

Fresh Current evidence may place only the Current layer. Expired evidence returns to Unknown. Future claims do not place early. Overlapping contradictory fresh claims fail closed. Event venue alone never proves presence.

Forbidden transitions include:

```text
current_location -> home_base
temporary_location -> declared_location
event attendance -> home_base
expired current claim -> historical/base placement
```

The stable-ID snapshot adapter added by #1198 does not by itself authorize public Current placement. Public Current/IRL remains disabled until fresh accepted evidence and its own API/UI activation gate support it.

No travel path is inferred.

## 13. Kick boundary

Kick work must preserve the accepted official-source and identity contracts.

The current line includes source audit, bounded official probe, stable-ID join/response work, a reviewed Country evidence bridge (#1197) and subsequent reviewed Country batches (#1203).

Those steps do not authorize:

- automatic geography acceptance;
- Twitch evidence reuse;
- slug-only canonical identity;
- public Kick Map activation without its own gate;
- unbounded raw title/tag/profile retention;
- D1/schema/cadence/retention changes by implication.

Any future Kick public Country renderer may reuse provider-independent UI mechanics, but it must consume Kick-only accepted evidence and preserve Kick-only accounting.

## 14. Population and evidence filter contract

Twitch Country/City population order remains:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> geography layer
-> entity/evidence placement gate
-> evidence source/type filters
-> geography drilldown
```

Public population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
```

Language is not a placement control.

Evidence-filter semantics remain:

```text
source selections: OR
type selections: OR
source dimension AND type dimension
empty source/type selection: All accepted
```

Geography selection must not silently rewrite population or evidence-filter state.

## 15. Unmapped and excluded accounting

Unmapped is a first-class state, not an error to hide.

The product must preserve explicit accounting for at least:

- missing qualifying accepted evidence;
- candidate-only evidence;
- conflicting accepted geography;
- accepted evidence hidden by active client evidence filters;
- Country-only evidence at City resolution;
- expired/future/conflicting Current evidence when Current is evaluated;
- missing/ambiguous stable identity where the active provider/layer requires it.

Confirmed organizations/event-broadcast channels are excluded from person placement and remain visible in accounting rather than being placed as people.

## 16. Privacy and precision

Public Base/Current geography is bounded to Country/Region/City semantics supported by the relevant contract.

Do not publish or infer through Stream Map:

- residential/street/postal address;
- exact latitude/longitude for a creator from private/base evidence;
- GPS trace;
- hotel/room/private venue detail;
- inferred travel path.

Country polygon geometry and aggregate fallback points describe geographic aggregate UI targets; they are not creator coordinates.

## 17. Operational boundaries

A Map UI/spec/API change does not silently authorize infrastructure mutation.

Separately gated unless an explicit accepted change says otherwise:

- collector provider behavior;
- collector cadence;
- D1 writes or schema/bindings;
- raw retention;
- permanent acquisition expansion;
- backfills;
- production deploys where repository policy requires separate authorization.

Read-only audits, fixtures, validators, PR CI and preview-only probes may proceed without waiting for the weekly evidence-maintenance clock.

## 18. Specification-sync rule

A merged change that alters a normative Stream Map behavior must keep current documentation synchronized.

Before merge, evaluate at minimum:

```text
spec impact
roadmap/status impact
schedule impact
Country/City/Current/Kick boundary impact
collector impact
D1/schema impact
retention/cadence impact
production impact
```

Do not merge a normative behavior change and leave a known contradictory `source of truth` document behind. If a versioned specification changes materially, create the next version and mark the older version superseded rather than silently rewriting historical meaning.

## 19. Next execution lanes

```text
Lane A  Country closeout audit against this v0.7 specification
Lane B  City normative visualization/interaction specification, then City refinement
Lane C  Kick Country evidence/API/public-activation work under provider separation
Lane D  Current/IRL fresh accepted-evidence/API/UI gate
Lane E  cross-mode Map UI/accessibility/production verification
Lane M  reviewed-evidence maintenance only; not a Map-wide blocker
```

No lane waits for Lane M's weekly cadence before doing otherwise-safe work.
