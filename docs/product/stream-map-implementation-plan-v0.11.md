# ViewLoom Stream Map Implementation Plan v0.11

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.8.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.10.md`  
Audited main baseline: `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Date: 2026-09-07

## 1. Current position

Twitch Country and Twitch City are closed at their current public boundaries. Kick Country K4 is complete and public. Current/IRL remains fail-closed. The next main product lane is Kick City.

Accepted K4 production proof:

```text
PR                                 #1283
main product commit                 ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b
Deploy Web Pages                    34048677710 success
Production Smoke                    34048677691 success
Kick Production API Smoke           34048677721 success
Production Smoke artifact           9993885992
Kick API proof artifact             9993884302
/kick/map/                          200
publicActivationAuthorized          true
state                               ready
observedStreams                     100
stableIdentityStreams               100
reviewedIdentityStreams              35
mappedStreams                         4
mappedCountryCount                    4
reconciliation                      100/100 pass
stable identity published           false
```

Current public inventory after K4:

```text
Vite HTML inputs                    27
inventory entries incl. 404         28
indexable/sitemap routes            23
browser scenarios                  108
```

## 2. Execution rule

Country, City, Kick City, Current/IRL and shared Map UI remain parallel lanes. Reviewed-evidence maintenance is never a Map-wide serial blocker.

No step silently authorizes collector, D1/schema, cadence, retention, backfill or Current activation changes.

## 3. Closed lanes

### Twitch Country — CLOSED

Only scoped regressions/accessibility/evidence-quality maintenance remain.

### Twitch City — CLOSED AT CURRENT BOUNDARY

C1-C6 are complete. Reviewed aggregate reference geometry remains separate from creator location. `no_geometry` remains list-only.

### Kick Country — K4 COMPLETE

K1-K3, KUI1-KUI3b, preactivation, cutover contract and K4 activation are complete. `/kick/map/` is public and permanently included in public inventory/sitemap/production smoke.

Future Kick Country work is maintenance only unless a separately accepted new product requirement appears.

## 4. Kick City lane

Kick City is not an extension of Country evidence. It is a separate reviewed-data and activation path.

### KC1 — contract and fixture model

Create a deterministic Kick City contract that fixes:

- internal stable identity = `broadcaster_user_id`;
- slug/login = display metadata only;
- accepted Base City claims = `home_base` / `declared_location` only;
- Country-only evidence does not imply City;
- Current/temporary evidence excluded;
- conflicts fail closed;
- no creator coordinates;
- no Twitch evidence reuse;
- public stable ID removal;
- mapped/unmapped/excluded/conflict reconciliation.

Add deterministic fixtures covering at least:

1. accepted City with reviewed aggregate reference geometry;
2. accepted City with `no_geometry` list-only state;
3. Country-only evidence -> City unmapped;
4. conflicting Base City evidence -> conflict/unmapped;
5. current/temporary evidence -> not Base City;
6. missing stable ID -> fail closed;
7. excluded non-person entity.

**Result:** City semantics become testable before any production or review-catalog mutation.

### KC2 — reviewed City evidence catalog

Create a Kick-only reviewed City catalog keyed by `broadcaster_user_id`.

Rules:

- do not reconstruct City from the existing Country terminal catalog;
- do not reuse Twitch evidence;
- do not infer City from nationality, birthplace, language, timezone, organization HQ or event venue alone;
- preserve terminal reviewed City outcome only for runtime;
- raw review prose/source detail remains outside public response.

Initial review population must be bounded and independently reviewable. The exact batch size can follow existing reviewed-evidence safety limits without making its maintenance cadence a global blocker.

**Result:** real Kick identities can be classified for Base City without contaminating Country or Current semantics.

### KC3 — runtime/API connection

Extend the provider-separated Kick Stream Map API with an explicit City geography mode.

Target behavior:

```text
/api/kick-stream-map?geography=country   -> existing K4 Country response
/api/kick-stream-map?geography=city      -> new City response
```

City runtime:

```text
live Kick snapshot
-> broadcaster_user_id stable join
-> reviewed Kick City terminal catalog
-> City aggregate grouping
-> reviewed aggregate reference geometry when available
-> public projection strips stable identity
```

Country remains the default. City mode must not change Country behavior.

**Result:** real production-connected City aggregates exist while Country remains stable.

### KC4 — City renderer and preview proof

Reuse provider-independent UI mechanics where safe, not data/evidence.

Required UI behavior:

- explicit Country/City resolution control;
- City aggregate list and selection;
- reference geometry only where separately reviewed;
- `no_geometry` list-only fallback;
- no creator pin semantics;
- mapped/unmapped/excluded/conflict accounting;
- mobile 390px and desktop browser proof;
- keyboard/focus/tap-target coverage;
- Twitch network requests = 0.

Keep this stage non-public until runtime and browser proof pass.

**Result:** actual Kick City UX is proven against real provider data before activation.

### KC5 — public activation gate

Only after KC1-KC4 acceptance:

- expose City mode from `/kick/map/`;
- preserve Country default;
- update canonical browser scenarios and production smoke;
- verify exact production deployment;
- verify no stable ID/coordinates/Current leakage;
- verify reconciliation against live production response.

This gate must not include collector, D1/schema, cadence, retention/backfill or Twitch changes.

**Result:** Kick gains a public Country -> City exploration path backed by reviewed Kick-only evidence.

## 5. Current / IRL lane

Latest accepted state remains:

```text
unique stable identities measured       300
reviewable identities                    10
fresh qualifying evidence                 0
accepted Current placement                0
```

### R2 — production Twitch stable identity

Still blocked pending explicit production collector authorization.

Required mutation if later authorized:

```text
Twitch Helix streams.user_id
-> retain twitchUserId in production minute snapshot
```

This does not itself authorize public Current.

### R3 — fresh accepted Current evidence

Still blocked by data state. Do not repeatedly rerun the same review window solely to seek nonzero results.

### R4 — Current API/UI/public activation

Only after stable identity is available and a justified later review produces fresh accepted Current evidence.

## 6. Shared Map UI lane

Only newly discovered scoped defects are active work. Existing September 6 regression batch through #1281 is closed.

Safe work includes:

- keyboard/focus regressions;
- mobile overflow/tap-target regressions;
- legend/status/empty/conflict/unmapped presentation regressions;
- structural production/browser proof;
- fail-closed recovery behavior.

## 7. Documentation and proof

Every product-boundary change must record:

- PR and merge SHA;
- applicable CI run IDs;
- production deployment SHA when public/runtime-facing;
- production smoke artifact IDs;
- changed inventory counts when routes change;
- confirmation that prohibited collector/D1/precision/provider-crossing boundaries were untouched.

## 8. Immediate execution sequence

```text
P0  post-K4 source-of-truth synchronization       NOW
KC1 Kick City contract + deterministic fixtures   NEXT
KC2 Kick City reviewed evidence catalog           PARALLEL AFTER KC1
KC3 Kick City runtime/API                         AFTER KC1 + usable KC2 terminal data
KC4 Kick City renderer/browser proof              PARALLEL WITH KC3 once contract stable
KC5 Kick City public activation                   AFTER KC1-KC4
R2/R3 Current                                     PARALLEL / independently gated
```

Do not return to a serial wait on weekly evidence maintenance.
