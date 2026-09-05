# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.6.md`  
Baseline: main `6ee0402d38aa47856e7d841b2c4a4544959b70c6`  
Last updated: 2026-09-05

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

No schedule item silently authorizes collector, D1, schema, cadence, retention or production mutation.

## 2. Immediate mainline

### Step 0 — documentation source-of-truth reconciliation — IN PROGRESS

Bring active repository documentation up to the actual current main state.

Required output:

- `stream-map-spec-v0.7.md` becomes the current normative spec;
- `stream-map-implementation-plan-v0.6.md` becomes the active plan;
- `current-roadmap.md` and this schedule stop claiming City is unauthorized;
- `docs/README.md` points new work at current documents;
- old execution snapshot is marked superseded/currently non-authoritative;
- Country #1213/#1218 behavior and City #1199-#1217 behavior are recorded;
- weekly Top-20 maintenance is explicitly a maintenance sublane only.

Completion condition: documentation-only PR merges with no runtime change and no active source-of-truth file contradicts known current Stream Map state.

### Step 1 — Twitch Country closeout audit — NEXT

Compare current main against spec v0.7.

Verify at minimum:

- Country region source/fill/outline path exists;
- ordinary Country aggregate markers are suppressed under normal choropleth operation;
- small-country fallback markers remain aggregate fallbacks only;
- Streams/Viewers control and five log buckets are intact;
- mobile world view and Country max zoom remain bounded;
- selecting Country does not automatically move camera;
- `World view` resets camera while `Clear country` clears selection;
- Country/map/list selection synchronization remains intact;
- effective Country content order is Map → selected Country → mapped countries/streams → unmapped diagnostics;
- City isolation remains unaffected;
- browser tests and production smoke represent the current structural behavior rather than retired marker/copy assumptions.

Completion condition: no spec/code/test contradiction. Any defect becomes a scoped issue/PR; do not reopen the retired Markers/Regions A/B experiment.

### Step 2 — City visualization / interaction specification — AFTER STEP 1

Do not begin a richer City renderer from assumptions.

Freeze:

- accepted City evidence and provenance display;
- City conflict/country-only/empty states;
- stable-ID availability semantics;
- whether the user sees grouped City rows, City boundaries, point targets, clusters or a zoom-dependent combination;
- allowed geometry/coordinate sources;
- prohibition on Country-centroid creator placement;
- desktop hover/select;
- mobile tap/detail;
- population/evidence filter behavior;
- URL/geography state;
- accessibility;
- browser and production smoke contract.

Completion condition: a testable City spec exists before implementation changes City visualization semantics.

### Step 3 — City implementation — AFTER STEP 2

Implement only the accepted City specification.

Preserve current hard boundaries:

- Country-only evidence never becomes City;
- only accepted Base City `home_base` / `declared_location` can place Base City;
- Current/temporary evidence does not mutate Base City;
- login is not a stable Twitch ID;
- no address/GPS/private precise location;
- no Country centroid or invented coordinate as creator City position.

Completion condition: City API/UI/renderer tests green on desktop/mobile with explicit empty/conflict behavior.

### Step 4 — City production proof — AFTER STEP 3

Use stable structural browser assertions, not transient prose fragments.

Completion condition: accepted current City contract passes the applicable deployment/browser verification and Country remains unchanged.

## 3. Parallel lane — Kick Country

Kick work may proceed while Steps 1-4 advance.

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

Current work may proceed while Steps 1-4 advance.

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

This lane may pause itself between authorized runs. That pause does **not** pause Country closeout, City work, Kick work, Current/IRL work, documentation, fixtures, CI or preview-only verification.

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

For documentation-only reconciliation:

- no `apps/web/**` runtime change;
- no collector change;
- no D1/schema change;
- no cadence/retention change;
- no production data mutation.

## 8. Current completion order

```text
NOW   docs reconciliation
NEXT  Country closeout
THEN  City spec
THEN  City implementation + proof
```

Concurrently:

```text
Kick Country readiness/API/public lane
Current/IRL evidence/API/UI lane
maintenance sublane
shared accessibility/verification
```

The old schedule that made a weekly maintenance reservation the next global Stream Map event is superseded.
