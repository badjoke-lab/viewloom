# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.8.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.11.md`  
Audited main baseline: `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Last updated: 2026-09-07

## 1. Scheduling principle

Stream Map is not one serial queue.

Twitch Country, Twitch City, Kick Country, Kick City, Current/IRL and shared Map UI are parallel lanes. Reviewed-evidence maintenance governs only its own bounded work and never pauses otherwise-safe implementation.

No schedule item silently authorizes production collector, D1/schema, cadence, retention, backfill or Current activation changes.

## 2. Completed public gates

```text
Twitch Country       COMPLETE
Twitch City          COMPLETE at current boundary
Kick Country K1      COMPLETE
Kick Country K2      COMPLETE
Kick Country K3      COMPLETE
Kick KUI1-KUI3b      COMPLETE
Kick K4              COMPLETE / PUBLIC
```

K4 production acceptance:

```text
PR                                 #1283
main product commit                 ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b
Deploy Web Pages                    34048677710 success
Production Smoke                    34048677691 success
Kick Production API Smoke           34048677721 success
/kick/map/                          200
publicActivationAuthorized          true
state                               ready
reconciliation                      100/100 pass
```

The old K4 explicit-authorization blocker is closed and must not remain in future schedules as pending work.

## 3. Immediate mainline — Kick City

### Step KC1 — City contract + deterministic fixtures — NEXT

Define and test:

- `broadcaster_user_id` internal stable identity;
- slug/login display-only;
- accepted Base City claims only `home_base` / `declared_location`;
- Country-only evidence -> City unmapped;
- Current/temporary evidence -> not Base City;
- conflicts -> fail closed;
- missing stable ID -> fail closed;
- excluded non-person terminal state;
- stable ID removed from public output;
- no creator coordinates;
- complete reconciliation accounting.

Fixture cases must include accepted reference geometry, accepted list-only `no_geometry`, Country-only, conflict, Current-only, missing stable ID and excluded entity.

**Outcome:** Kick City behavior becomes deterministic before touching production runtime or public UI.

### Step KC2 — reviewed Kick City evidence catalog

Build a provider-specific City review catalog keyed by `broadcaster_user_id`.

Do not derive City from the Country terminal catalog. Do not reuse Twitch evidence. Do not infer from birthplace/nationality/language/timezone/organization HQ/event venue alone.

Keep runtime terminal City state minimal and public output free of raw review prose/provenance.

**Outcome:** real Kick identities have independently reviewed Base City outcomes.

### Step KC3 — City runtime/API

Add explicit City geography mode while preserving Country as default:

```text
/api/kick-stream-map?geography=country
/api/kick-stream-map?geography=city
```

Production path:

```text
live Kick snapshot
-> broadcaster_user_id join
-> reviewed Kick City terminal catalog
-> City aggregate grouping
-> reviewed aggregate reference geometry when available
-> public projection strips stable identity
```

No collector/D1/schema/cadence/retention change is implied.

**Outcome:** real production-connected Kick City aggregates are available behind the API contract.

### Step KC4 — City UI/browser proof

Add explicit Country/City resolution UI and prove:

- desktop + 390px mobile;
- keyboard/focus/44px actions;
- aggregate reference geometry only;
- `no_geometry` list-only;
- mapped/unmapped/excluded/conflict accounting;
- Twitch requests = 0;
- stable ID/Current/coordinates absent.

Keep City non-public until these checks pass.

**Outcome:** actual Kick City UX is proven against provider data before activation.

### Step KC5 — public Kick City activation

After KC1-KC4 acceptance:

- expose City mode from `/kick/map/`;
- keep Country default;
- extend public browser/production acceptance;
- verify exact production SHA;
- verify reconciliation and privacy boundaries.

**Outcome:** users can move from Kick Country overview to reviewed City aggregates.

## 4. Current / IRL parallel lane

### R2 — production stable Twitch identity — BLOCKED / SEPARATE AUTHORIZATION

Required future mutation if explicitly authorized:

```text
Twitch Helix streams.user_id
-> retain twitchUserId in production minute snapshot
```

This is a production collector change and is not authorized by Kick work.

### R3 — fresh accepted Current evidence — BLOCKED BY DATA STATE

Latest accepted state remains zero fresh qualifying evidence and zero accepted Current placements.

Do not repeatedly rerun the same evidence window merely to seek a nonzero result.

### R4 — Current API/UI/public activation

Only after both stable identity availability and a justified later review with fresh accepted Current evidence.

Current never mutates Base/Home/City and expired evidence never survives as placement.

## 5. Maintenance lanes

Twitch Country, Twitch City and Kick Country are maintenance-only unless a concrete new product requirement appears.

Safe scoped work includes newly discovered accessibility, overflow, empty/conflict/unmapped, status/legend and production/browser regressions.

## 6. Immediate order

```text
P0   post-K4 source-of-truth sync        NOW
KC1  Kick City contract + fixtures       IMMEDIATELY AFTER P0
KC2  reviewed Kick City evidence         PARALLEL AFTER KC1
KC3  Kick City runtime/API               AFTER KC1 + usable KC2 data
KC4  Kick City UI/browser proof          PARALLEL ONCE CONTRACT STABLE
KC5  Kick City public activation         AFTER KC1-KC4
R2/R3 Current                            PARALLEL / separately gated
```

CI waiting in one lane is not a reason to stop safe work in another lane.
