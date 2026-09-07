# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.8.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.11.md`  
Audited main baseline: `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Last updated: 2026-09-07

## 1. Current milestone

Twitch Country and Twitch City are complete at their current public boundaries. Kick Country K4 is also complete and public. The next main product-development lane is Kick City. Current/IRL remains fail-closed and parallel.

Accepted Kick K4 production state:

```text
PR                                 #1283
/kick/map/                         public / HTTP 200
publicActivationAuthorized         true
state                              ready
observedStreams                    100
stableIdentityStreams              100
reviewedIdentityStreams             35
mappedStreams                        4
mappedCountryCount                   4
reconciliation                     100/100 pass
stable identity published          false
City / Current / coordinates       not published
```

Production proof:

```text
Deploy Web Pages                    34048677710 success
Production Smoke                    34048677691 success
Kick Production API Smoke           34048677721 success
Production Smoke artifact           9993885992
Kick API proof artifact             9993884302
```

Current public inventory:

```text
Vite HTML inputs                    27
inventory entries incl. 404         28
indexable/sitemap routes            23
browser scenarios                  108
```

## 2. Lane state

| Lane | Current state | Next gate |
| --- | --- | --- |
| Twitch Country | complete at current boundary | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; reviewed aggregate references/list-only fallback public | scoped quality/coverage only |
| Kick Country | K1-K4 complete; `/kick/map/` public | maintenance only |
| Kick City | not implemented | KC1 contract/fixtures -> KC2 reviewed City evidence -> KC3 runtime/API -> KC4 browser proof -> KC5 public activation |
| Current / IRL | fail-closed; latest accepted review produced 0 fresh qualifying evidence / 0 accepted placements | separately gated stable-ID collector mutation + later justified evidence window |
| Shared Map UI | current regression batch complete through #1281 | newly discovered scoped defects only |
| Reviewed-evidence maintenance | bounded maintenance | never block Map lanes |

## 3. Twitch Country

Closed at current product boundary:

- accepted-evidence-only placement;
- Country choropleth primary;
- Streams/Viewers intensity;
- Country/list selection sync;
- explicit World view;
- unmapped diagnostics;
- no creator-coordinate semantics.

## 4. Twitch City

Closed at current product boundary:

- explicit City geography mode;
- Base City only from accepted `home_base` / `declared_location` evidence;
- Country-only evidence never promoted to City;
- Current/temporary evidence excluded;
- creator coordinates not published;
- reviewed aggregate reference geometry only;
- `no_geometry` remains list-only.

## 5. Kick Country

K4 is complete. The old `public_country_activation_not_authorized` blocker no longer applies to production.

Production remains provider-separated and fail-closed on precision:

- internal stable identity = `broadcaster_user_id`;
- slug/login is display metadata only;
- public response strips stable identity;
- Twitch evidence reuse forbidden;
- City/Current inference forbidden;
- precise address/coordinates forbidden;
- live selected population reconciles to mapped/unmapped/excluded/conflict accounting.

## 6. Kick City — next main lane

Kick City must not be inferred from the existing Country terminal catalog.

Required sequence:

```text
KC1  deterministic City contract + fixtures
KC2  Kick-only reviewed City evidence catalog keyed by broadcaster_user_id
KC3  explicit City runtime/API mode
KC4  City renderer + real production-connected desktop/mobile browser proof
KC5  separate public City activation
```

Accepted Base City claims are only `home_base` and `declared_location`. Country-only, Current/temporary, birthplace, nationality, event venue, language/timezone and organization HQ do not place Base City by themselves.

Public City output must not expose stable IDs, residential addresses, creator coordinates, GPS, Current location or inferred travel paths. Reviewed aggregate reference geometry is an aggregate UI target only. Missing reviewed geometry remains list-only.

## 7. Current / IRL

Latest accepted state remains:

```text
unique stable identities measured       300
reviewable identities                    10
accepted-class review pairs              40
fresh qualifying evidence                 0
accepted Current placement                0
true cross-country conflicts              0
```

Current remains fail-closed.

Production Twitch minute snapshots still do not retain `user_id` / `twitchUserId`. That mutation remains separately gated because it changes the production collector. Stable identity alone cannot clear the evidence gate while accepted Current evidence remains zero.

Do not rerun the same evidence window merely to search for nonzero output.

## 8. Scheduling rule

Kick City is now the main product-development lane. Current/IRL runs in parallel and does not serialize Map work. Reviewed-evidence maintenance never becomes a Map-wide wait state.

No roadmap item silently authorizes collector, D1/schema, cadence, retention, backfill or Current activation changes.
