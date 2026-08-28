# ViewLoom Stream Map Current Execution Overlay v0.1

Status: current Stream Map execution override  
Applies to: Stream Map sections of `current-roadmap.md` and `current-schedule.md`  
Specification: `stream-map-spec-v0.6.md`  
Implementation plan: `stream-map-implementation-plan-v0.5.md`  
Last updated: 2026-08-28

## Why this overlay exists

The existing `current-roadmap.md` and `current-schedule.md` retain detailed historical maintenance records and verifier anchors. Those records must not be deleted or rewritten merely to change the current Stream Map execution order.

For Stream Map only, when the old files describe the weekly fixed-Top-20 reviewed-evidence maintenance cadence as the current/next global Map stage, this overlay supersedes that scheduling interpretation.

The weekly maintenance contract itself remains valid for that maintenance workflow.

## Current Map program

```text
Twitch Country Map
  public map                         DONE
  source/type filters                DONE
  country drilldown                  DONE
  unmapped reasons                   DONE
  population filters                 DONE
  reviewed evidence                  LIVE
  Top300 review queue A-L            DONE
  canonical application              PARTIAL / PROD-DEPLOY-GATED

City
  evidence semantics                 DONE
  existing-evidence audit            DONE
  live coverage gate                 DONE
  explicit ?geography=city API       DONE
  public geography UI                DONE
  Current/IRL mixing                 DISABLED

Kick
  source audit                       DONE
  bounded official-source probe      DONE
  provider join/evidence contract    DONE
  Country API                        NOT YET
  Country Map                        NOT YET

Current Location / IRL
  freshness/TTL contract             DONE
  retained-evidence audit            DONE
  deterministic evaluator            DONE
  retained current/temporary rows    0 at last audit
  live candidate coverage            NEXT / PARALLEL
  current-location API layer         NOT YET
  public Current / IRL mode           NOT YET

Map UI
  Twitch source/type multi-select    DONE
  country drilldown                  DONE
  City geography mode                DONE
  source badges / provenance         DONE
  Home/Base vs Current separation    ENFORCED
  provider-separated Twitch/Kick UI  ENFORCED
  Kick public map controls           WAITING ON KICK COUNTRY API
```

## Execution rule

Map development proceeds in parallel lanes:

```text
Lane A  Twitch Country canonical closeout + future reviewed coverage maintenance
Lane B  City contract/UI follow-up and City evidence quality
Lane C  Kick Country API + provider-specific Map path
Lane D  Current Location / IRL live-candidate measurement + separate API/UI
Lane E  Map UI control/provenance refinement across provider-separated surfaces
```

The existing weekly Top-20 maintenance harness is a maintenance/re-review sublane. Its one-week cadence does not pause specification, read-only audit, deterministic tooling, fixtures, verification, Country review batches outside that harness, or separately accepted implementation work in the Map lanes.

## Lane A — Twitch Country

The one-shot Top300 recovery source run `32704826743` produced 297 queued stable Twitch identities in 12 bounded batches A-L. As of 2026-08-28, all A-L review-result batches are complete.

Review execution remains separate from canonical application. A review result never mutates canonical data by itself.

Current canonical boundary:

- A-D applications are already retained on main;
- PR #1068 is the next canonical application branch and remains unmerged because it changes `apps/web/**`;
- repository `Deploy Web Pages` deploys production on `main` pushes touching `apps/web/**`;
- therefore #1068 and subsequent canonical application PRs must not be merged without the required production-deploy authorization;
- this production boundary does not pause City, Kick, IRL, UI, docs, validator or read-only work.

## Lane B — City

City is no longer a future-only contract.

Merged state:

- accepted base City semantics and retained-evidence audit are complete;
- public API activates City only with explicit `?geography=city`;
- default `/api/twitch-stream-map` remains Country behavior;
- base City accepts only `home_base` / `declared_location` semantics;
- country-only rows are not guessed into a City;
- base City conflicts fail closed;
- current/temporary claims do not place the base City layer;
- address, latitude, longitude and GPS are not introduced;
- public geography UI can explicitly select City while Current / IRL remains disabled.

City confidence/ambiguity stays independent from Country. A Country placement never implies a City.

## Lane C — Kick

Kick has progressed beyond source-audit planning.

Merged state:

- collector/provider source audit complete;
- bounded read-only official probe package complete;
- successful bounded real probe retained;
- current contract uses Livestreams V2 population with one request and Channels with at most ten requests;
- stable Kick identity is `broadcaster_user_id` when present; slug/login is not a stable ID;
- `custom_tags` absence in the measured run is explicit and must not be backfilled from the deprecated legacy public path;
- provider-specific evidence contract/join fixture is complete;
- no D1 write, production deployment, legacy fallback or automatic geography acceptance is authorized by those probe/contract steps.

Next product step is a Kick-only Country population/evidence join/API, then `/kick/map/`. Twitch evidence is not copied automatically and Twitch/Kick geography is never aggregated.

## Lane D — Current Location / IRL

The freshness contract and deterministic evaluator are already implemented.

Current rules:

- Home/Base and Current/temporary are separate layers;
- accepted current/temporary placement requires provenance, country, `observedAt` and `expiresAt`;
- expired evidence returns to Unknown instead of sticking;
- future claims do not place early;
- overlapping fresh contradictory claims fail closed as `conflicting_current_location`;
- current/temporary evidence never mutates home/base automatically;
- public precision is Country/City only; no address, GPS trace or precise coordinates.

The last retained-evidence audit found zero accepted `current_location` and zero accepted `temporary_location` rows, so public Current / IRL mode is still not ready. Next safe work is read-only live candidate coverage measurement, followed by a separate API/UI gate if evidence supports it.

## Lane E — Map UI

The public Twitch Map already has evidence-source/type multi-select controls, distinct source badges/provenance, country drilldown and explicit City geography mode.

Further UI work must preserve these rules:

- Country and City are independently selectable geography resolutions;
- Home/Base and Current Location are visibly distinct concepts;
- provider selection/switching never causes Twitch/Kick data aggregation;
- source classes remain individually filterable while an all-sources view remains possible;
- candidate presence is not presented as canonical geography;
- language remains supplemental metadata only and never proves Country;
- unmapped, conflicts and excluded non-person rows remain explicit;
- provenance/evidence strength must remain inspectable.

Kick-facing provider controls remain gated on a real Kick Country API rather than demo geography.

## Historical maintenance records remain intact

The following existing maintenance rules remain true for the existing harness and are not deleted by this overlay:

- fixed Twitch Top 20 per maintenance run;
- manual `workflow_dispatch`;
- separate one-run authorization;
- at most once per week / rolling-30-day ceiling;
- search-attempt and wall-clock ceilings;
- no automatic schedule;
- no automatic evidence acceptance;
- no City/Kick/current-location public activation from a maintenance run.

They do not define the scheduling cadence of the entire Stream Map product program.

## Shared hard boundaries

- no geography inference from language/timezone/name/category/IP;
- no nationality/birthplace-as-residence;
- no City inference from Country;
- no Current Location inference from Country or Home/Base;
- no non-person-as-person placement;
- no silent conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no current-location placement after TTL expiry;
- no collector/D1/cadence/retention mutation without its own accepted gate;
- no production deployment without the required authorization.

## Precedence

For Stream Map execution order:

1. `stream-map-spec-v0.6.md`
2. `stream-map-implementation-plan-v0.5.md`
3. this execution overlay
4. older Stream Map scheduling statements in `current-roadmap.md`, `current-schedule.md`, `stream-map-spec-v0.5.md`, and `stream-map-implementation-plan-v0.4.md`

Historical measurements, audit findings, run IDs, maintenance ceilings and prior acceptance records in those older files remain historical facts and are not rewritten by this precedence rule.
