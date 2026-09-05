# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.6.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
Audited runtime baseline: main `24cd444bfe564588b70c16a335f07d2c41627c0b`  
Last updated: 2026-09-05

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

No schedule item silently authorizes collector, D1, schema, cadence, retention or production mutation.

## 2. Immediate mainline

### Step 0 — documentation source-of-truth reconciliation — COMPLETE

Completed in PR #1219.

Accepted output:

- `stream-map-spec-v0.7.md` is the current normative Stream Map spec;
- `stream-map-implementation-plan-v0.6.md` is the active plan;
- `current-roadmap.md` and this schedule reflect implemented City state;
- `docs/README.md` points new Stream Map work at the current authority chain;
- the old execution snapshot is historical/superseded;
- Country and City implementation state is recorded;
- weekly Top-20 maintenance is a maintenance sublane only.

### Step 1 — Twitch Country closeout audit — COMPLETE

Country closeout found and repaired the last known marker-first source/test contradiction in PR #1220.

Accepted baseline:

```text
main                             24cd444bfe564588b70c16a335f07d2c41627c0b
Deploy Web Pages                 33934879891 success
Production Browser Smoke         33934879840 success
Country + City render smoke      success
```

Closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Country remains on scoped maintenance/accessibility/evidence-quality work only. Do not reopen the retired Markers/Regions A/B experiment.

### Step 2 — City visualization / interaction specification — COMPLETE ON MERGE

`docs/product/stream-map-city-visualization-spec-v0.1.md` freezes the City visualization boundary.

Key decision:

```text
primary semantic object    City aggregate
creator point layer        not authorized
list                       first-class exact-value/accessibility surface
map boundary/target        only from accepted public City reference geometry
missing geometry           list remains usable; no invented map target
```

Base City remains accepted `home_base` / `declared_location` only. Current/temporary, country-only, conflict and precise-location data do not become Base City placement.

### Step 3A — City C1 aggregate model and selection — NOW

Implement a provider-scoped deterministic City aggregate model before richer map geometry.

Required:

- aggregate key uses `countryCode + region + city`;
- identical City names in different places remain distinct;
- mapped aggregate stream/viewer totals reconcile exactly;
- country-only and Base City conflicts never enter mapped aggregate totals;
- Current/temporary rows never enter Base City aggregate totals;
- aggregate list works without MapLibre/geometry;
- City selection state is deterministic and independently testable;
- selection can drive the mapped-stream drilldown;
- selected-City detail can expose City/region/country, streams, viewers and source summary without coordinates.

Completion condition: core model + structural/UI tests green with no new geography inference.

### Step 3B — City C2 reference-geometry source audit — NOW / parallel with C1

Do not block C1 while auditing geometry.

Before any City map target is added, freeze:

- data source and license;
- update/hosting model;
- boundary vs aggregate reference-point semantics;
- deterministic matching from `countryCode + region + city`;
- ambiguity/collision handling;
- missing-geometry behavior;
- build/runtime/network cost;
- no silent fuzzy matching;
- no creator/Country-centroid/venue substitution.

Completion condition: an accepted geometry-source contract exists. If no acceptable source is found, City stays list-first and C3 map targets remain blocked.

### Step 4 — City C3 aggregate map renderer — AFTER C2

Implement only accepted City reference geometry.

Preserve:

- aggregate target semantics, not creator-location semantics;
- map/list selection synchronization;
- no automatic street-level precision implication;
- fail closed to list-only when geometry does not resolve;
- Country mode remains unchanged.

Completion condition: City aggregate map tests green for resolved and unresolved geometry.

### Step 5 — City C4 responsive/detail UI — AFTER/WITH C3

Implement:

- selected-City detail;
- mapped-stream drilldown;
- explicit country-only/conflict diagnostics;
- desktop hover/select where geometry exists;
- mobile list-first selection;
- compact filters;
- keyboard/focus/tap-target/accessibility requirements;
- no 390px horizontal overflow.

### Step 6 — City C5 production proof — AFTER C3/C4

Use stable structural browser assertions, not transient prose fragments.

Completion condition: accepted City contract passes applicable browser/deployment verification and production smoke, and Country remains unchanged.

## 3. Parallel lane — Kick Country

Kick work proceeds while City C1-C5 advance.

Current known baseline includes provider source/identity/response contracts, reviewed Country evidence bridge #1197 and review batches #1203.

Next sequence:

```text
re-audit current Kick stable-ID/persistence/response readiness
-> identify only missing provider-specific gate
-> deterministic/API verification
-> public Kick activation only after real Kick data path is ready
```

Do not:

- copy Twitch evidence;
- treat slug/login as stable identity;
- auto-accept geography;
- publish demo Kick geography;
- make collector/D1/cadence/retention changes by implication.

## 4. Parallel lane — Current Location / IRL

Current work proceeds while City C1-C5 advance.

Current baseline includes temporal contract/evaluator/candidate work and #1198 stable-ID snapshot adapter.

Next sequence:

```text
re-audit fresh accepted current/temporary evidence
-> if zero/usefulness insufficient: keep public Current disabled and continue evidence gate
-> if sufficient: freeze Current API contract
-> implement separate Current UI mode
-> expiry/conflict/browser verification
```

Current never becomes Base City and never survives expiry.

## 5. Parallel lane — reviewed-evidence maintenance

Existing maintenance policy continues under its own authorization/cadence rules.

This lane may pause itself between authorized runs. That pause does **not** pause City work, Kick work, Current/IRL work, documentation, fixtures, CI or preview-only verification.

Coverage quality is ongoing maintenance, not a serial prerequisite for every Map feature.

## 6. Parallel lane — shared UI/accessibility

Safe work that does not change geography semantics may proceed independently:

- keyboard/focus verification;
- mobile control density and tap targets;
- overflow/regression checks;
- map/legend labels;
- explicit empty/conflict/unmapped presentation;
- provider/geography URL-state verification.

If shared work would force different geography layers into one data model, stop and specify the semantic boundary first.

## 7. CI/deployment rule

CI waiting in one lane is not a reason to stop another safe lane.

A production-affecting merge remains subject to `docs/operations/development-and-deployment-policy.md` and the actual workflow triggers on current main.

City C1/C2 must not imply:

- production collector change;
- D1/schema/binding change;
- cadence/retention change;
- production data mutation;
- Current/IRL activation;
- Kick activation.

## 8. Current completion order

```text
DONE  docs reconciliation #1219
DONE  Country closeout + stale marker contract repair #1220
NOW   City C1 aggregate model/selection
NOW   City C2 reference-geometry source audit
NEXT  City C3 aggregate map renderer if C2 accepts a source
NEXT  City C4 responsive/detail UI
THEN  City C5 browser + production proof
```

Concurrently:

```text
Kick Country readiness/API/public lane
Current/IRL evidence/API/UI lane
maintenance sublane
shared accessibility/verification
```

The old schedule that made a weekly maintenance reservation the next global Stream Map event is superseded.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

The following strings remain historical category-rollout verifier anchors and are not the current Stream Map execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
