# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.7.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `801860483b50bf418d8edfb5295542244e69c138`  
Last updated: 2026-09-05

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

No schedule item silently authorizes collector, D1, schema, cadence, retention or production mutation.

## 2. Completed mainline gates

### Step 0 — documentation source-of-truth reconciliation — COMPLETE

Completed in PR #1219.

### Step 1 — Twitch Country closeout — COMPLETE

Completed through #1220 and the accepted closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Accepted production proof:

```text
main                             24cd444bfe564588b70c16a335f07d2c41627c0b
Deploy Web Pages                 33934879891 success
Production Browser Smoke         33934879840 success
Country + City render smoke      success
```

Country is now maintenance/scoped-defect work only and does not block City, Kick or Current/IRL.

### Step 2 — City visualization / interaction specification — COMPLETE

`docs/product/stream-map-city-visualization-spec-v0.1.md` fixes:

```text
primary semantic object    City aggregate
creator point layer        not authorized
list                       first-class exact-value/accessibility surface
map boundary/target        only from reviewed City reference geometry
missing geometry           list remains usable; no invented map target
```

## 3. Immediate City mainline

### Step 3A — City C1 aggregate model and selection — IN REVIEW #1222

Implementation PR #1222 adds:

- deterministic `countryCode + region + city` aggregate keys;
- same-name collision separation;
- exact stream/viewer/source totals;
- list-first City aggregate selection;
- selected-City stream drilldown using the existing provenance rows;
- retained zero state when filters remove the selected City;
- population/category payload refresh handling;
- desktop/mobile browser verification;
- no City geometry or creator coordinates.

Completion condition: #1222 CI green, merge, then current production Country+City structural smoke green.

### Step 3B — City C2 reference-geometry source audit — COMPLETE ON #1223 MERGE

Source audit:

`docs/audits/twitch-stream-map-city-reference-geometry-source-audit-2026-09-05.md`

Contract:

`docs/product/stream-map-city-reference-geometry-contract-v0.1.md`

Accepted strategy:

```text
City evidence acceptance
-> exact C1 City aggregate key
-> reviewed static geometry registry
   -> reviewed geoBoundaries gbOpen City/municipal polygon when semantically valid
   -> otherwise reviewed Natural Earth Populated Places aggregate reference point when unambiguous
   -> otherwise no_geometry / list-only
```

Explicit decisions:

- no automatic global City-name resolver;
- no fixed `ADM level = City` rule;
- no fuzzy matching;
- no Country/region centroid fallback;
- no venue/creator coordinate substitution;
- no public/runtime Nominatim dependency;
- Overture Divisions deferred for v0.1 pending a separate ODbL/coverage decision;
- public runtime calls no external geometry API.

### Step 3C — review current City aggregate geometry registry — NEXT / may run beside C1

After #1223 merges, review geometry only for City aggregate keys that ViewLoom can actually place.

For each aggregate:

1. attempt an explicit reviewed geoBoundaries gbOpen municipal/City boundary match;
2. if no suitable polygon exists, attempt an explicit reviewed Natural Earth City point match;
3. retain source feature ID/version/URL/license/attribution;
4. unresolved or ambiguous City stays `no_geometry`;
5. generate no world-scale bulk municipal dataset.

Completion condition: bounded reviewed registry + validator + static artifact for accepted entries.

### Step 4 — City C3 aggregate map renderer — AFTER C2 + REGISTRY ENTRIES

Render only accepted registry geometry.

Required:

- exact aggregate-key join only;
- boundary as City aggregate area;
- reference point as visibly non-creator aggregate target;
- map/list selection synchronization;
- no automatic street-level precision implication;
- no target when geometry is absent/unresolved;
- list/drilldown remains complete without geometry;
- Country mode unchanged.

### Step 5 — City C4 responsive/detail UI — AFTER/WITH C3

Implement remaining City detail/diagnostic/accessibility work:

- explicit country-only/conflict states;
- desktop hover/select where geometry exists;
- mobile list-first selection;
- compact filters;
- keyboard/focus/tap-target requirements;
- no 390px horizontal overflow.

### Step 6 — City C5 production proof — AFTER C3/C4

Use structural browser assertions, not transient prose fragments.

Completion condition: accepted City contract passes browser/deployment verification and production smoke while Country remains unchanged.

## 4. Parallel lane — Kick Country

Kick proceeds independently.

```text
re-audit current Kick stable-ID/persistence/response readiness
-> identify only missing provider-specific gate
-> deterministic/API verification
-> public Kick activation only after real Kick data path is ready
```

Do not copy Twitch evidence, treat slug/login as stable identity, auto-accept geography, publish demo geography or imply collector/D1/cadence/retention expansion.

## 5. Parallel lane — Current Location / IRL

Current remains separate from Base City.

```text
re-audit fresh accepted current/temporary evidence
-> insufficient: remain disabled/fail closed
-> sufficient: freeze Current API contract
-> separate Current UI mode
-> expiry/conflict/browser verification
```

Current never becomes Base City and never survives expiry.

## 6. Parallel lane — reviewed-evidence maintenance

Existing maintenance policy continues under its own authorization/cadence rules.

Its wait periods do **not** pause City C1/C2/C3 work, Kick, Current/IRL, docs, fixtures, CI or preview-only verification.

## 7. Shared UI/accessibility lane

Safe independent work includes:

- keyboard/focus verification;
- mobile tap targets;
- overflow/regression checks;
- map/legend labels;
- explicit empty/conflict/unmapped presentation;
- geography URL-state verification.

Do not force Country, City and Current into one geometry model.

## 8. CI/deployment rule

CI waiting in one lane is not a reason to stop another safe lane.

City C1/C2/C3 do not imply:

- production collector change;
- D1/schema/binding change;
- cadence/retention change;
- backfill;
- production data mutation;
- Current/IRL activation;
- Kick activation.

## 9. Current completion order

```text
DONE      docs reconciliation #1219
DONE      Country closeout #1220
DONE      City visualization spec #1221
IN REVIEW City C1 aggregate model/selection #1222
IN REVIEW City C2 source contract #1223
NEXT      bounded reviewed City geometry registry/artifact
NEXT      City C3 aggregate renderer
NEXT      City C4 responsive/detail UI
THEN      City C5 production proof
```

Concurrently:

```text
Kick Country readiness/API/public lane
Current/IRL evidence/API/UI lane
maintenance sublane
shared accessibility/verification
```

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

The following strings remain historical category-rollout verifier anchors and are not the current Stream Map execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
