# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.6.md`  
Baseline: main `6ee0402d38aa47856e7d841b2c4a4544959b70c6`  
Last updated: 2026-09-05

## 1. Current milestone

**Twitch Country is functionally complete at the current product boundary; documentation reconciliation and Country closeout precede the next richer City implementation.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | public API/map, filters, drilldown, unmapped accounting, choropleth and compact UI implemented | closeout audit against spec v0.7 |
| Twitch City | explicit API/UI, stable-ID coverage states, renderer isolation and production structural smoke implemented | freeze richer City visualization/interaction spec before further renderer work |
| Kick Country | source/identity/response foundations plus reviewed evidence bridge and review batches advanced | re-audit actual main readiness, then complete Kick-only API/public activation gates |
| Current / IRL | temporal contract/evaluator/candidate work plus stable-ID snapshot adapter implemented | re-audit fresh accepted evidence; public layer remains separate and fail-closed |
| Shared Map UI | Country mobile/desktop density and interaction work implemented | accessibility/cross-mode verification as each lane advances |
| Reviewed-evidence maintenance | bounded maintenance process | continue under its own policy only; not a Map-wide blocker |

## 3. Twitch Country — current accepted state

### Data and filtering

- real Twitch population only;
- Top N / minimum viewers / category population controls;
- evidence source and location-type filters;
- accepted-evidence-only placement;
- Country drilldown;
- explicit unmapped/excluded accounting;
- reviewed evidence/provenance remains inspectable.

### Renderer

#1213 finalized the Country choropleth:

- filled Country regions are the primary renderer;
- ordinary aggregate Country markers are not an alternate public mode;
- small-country fallback markers are aggregate interaction fallbacks only where polygon geometry is impractical;
- Streams/Viewers can drive intensity;
- positive values use five log-scaled buckets;
- Country map is geographic context, not street navigation;
- mobile/world camera is bounded;
- Country geometry/fallbacks are not creator coordinates.

### UI

#1218 finalized the current Country interaction model:

```text
Map
-> selected Country when present
-> mapped countries / mapped streams
-> unmapped diagnostics
```

Current behavior includes:

- Streams/Viewers segmented controls;
- five-step Low→High legend;
- persistent Country selection independent of camera;
- no automatic camera fit on Country selection;
- explicit `World view` camera reset;
- `Clear country` clears selection only;
- informational desktop hover;
- compact selected-Country totals plus `Show streams`;
- bounded/scrollable mapped results;
- collapsible per-stream evidence and detailed unmapped diagnostics;
- compact mobile Filters control.

#1215-#1217 moved production smoke from transient copy/marker assumptions to structural Country-region and City-isolation checks.

### Country next step

Country does **not** return to the retired Markers/Regions experiment. Next step is a closeout audit against spec v0.7, then only scoped defects/accessibility work and ongoing evidence quality maintenance.

## 4. Twitch City — current accepted state

City is already beyond the old `NOT authorized` roadmap state.

Implemented:

- explicit `/api/twitch-stream-map?geography=city`;
- explicit `/twitch/map/?geography=city` runtime mode;
- City confidence/ambiguity semantics;
- no City inference from Country;
- Base City only from accepted `home_base` / `declared_location` evidence;
- current/temporary evidence excluded from Base City;
- stable Twitch identity retained internally when actually available;
- login is not a stable-ID substitute;
- City stable-ID coverage state exposed as `unavailable | partial | available` rather than fabricated;
- City UI state matrix/verifier (#1200-#1202);
- City renderer (#1204) suppresses Country aggregate markers and Country centroid placement;
- no creator City coordinates are published or inferred;
- country-only evidence remains accounted but is not promoted;
- Current-location placement remains zero in Base City mode;
- structural production smoke is current (#1217).

### City next step

Do not copy the Country choropleth into City by assumption.

Before richer City rendering, write and freeze a City visualization/interaction specification covering:

- data/evidence eligibility;
- conflict/country-only/empty states;
- allowed boundary/coordinate sources;
- grouped-list vs city-area vs point/cluster semantics;
- desktop hover/select;
- mobile tap/detail;
- filters and URL state;
- accessibility and browser/production smoke.

Then implement only what that specification authorizes.

## 5. Kick Country — parallel lane

Current accepted direction remains Kick-only:

```text
Kick live population
-> unique official Channels join
-> broadcaster_user_id
-> Kick-only reviewed evidence
-> Country terminal state
-> future Kick API/UI activation
```

Recent merged progress includes:

- #1197 reviewed Kick Country evidence bridge;
- #1203 reviewed Country batches 03-04 on current main line.

This does not authorize Twitch evidence reuse, slug-only stable identity, automatic geography acceptance or public Kick Map activation by itself.

Next: re-audit current Kick persistence/response/public-readiness from main, then close only the missing provider-specific gates.

## 6. Current Location / IRL — parallel lane

Current remains separate from Home/Base and City.

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Temporal evaluator and candidate/reviewability work are already established. #1198 added a Twitch current-snapshot stable-ID adapter.

That adapter is identity plumbing only. It does not create accepted Current geography.

Public Current stays disabled unless fresh accepted current/temporary evidence exists and its own API/UI gate is accepted.

Hard boundary:

- no Home/Base mutation from Current;
- no expired Current placement;
- no future claim placed early;
- no event venue as presence proof by itself;
- no inferred travel path;
- no precise residential/GPS publication.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 reviewed-evidence maintenance policy remains valid for its own purpose.

It is **not** the Stream Map roadmap scheduler.

A weekly maintenance wait never blocks otherwise-safe:

- Country closeout/audits;
- City specification/fixtures/UI work;
- Kick read-only/evidence/API work;
- Current/IRL read-only/evidence work;
- UI/accessibility work;
- documentation and CI work.

Automatic geography acceptance and an unsupported persistent crawler remain unauthorized.

## 8. Shared operational boundaries

Unless a separate accepted gate explicitly changes them, Stream Map feature work does not authorize:

- collector provider behavior changes;
- collector cadence changes;
- D1 schema/binding mutation;
- raw retention expansion;
- backfill;
- automatic recurring acquisition;
- production mutation outside the applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence.

## 9. Current execution order

Mainline:

```text
1. documentation source-of-truth reconciliation
2. Country closeout audit against spec v0.7
3. City visualization/interaction specification
4. City implementation from that specification
5. City browser/production proof
```

Parallel throughout:

```text
Kick Country provider-specific readiness/API/public path
Current/IRL fresh accepted-evidence/API/UI path
reviewed-evidence maintenance under its own bounded policy
shared Map accessibility/verification
```

## 10. Authoritative current records

Read these for new Stream Map work:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.6.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant lane contract, such as City confidence, Current/IRL, or Kick live-join contracts
7. current implementation/tests on `main`

Older `stream-map-spec-v0.6.md` and earlier versions, older implementation plans, and pre-v0.7 execution snapshots are historical/superseded for current execution. They must not override the list above.

## 11. Documentation synchronization rule

A normative behavior change is incomplete if an active `source of truth` document remains knowingly contradictory.

Every Stream Map PR must consider spec, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact. Material spec changes should create a new versioned spec/plan rather than silently changing historical versions.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
