# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `bea33532001989c71dde289e570752985d34f600`  
Last updated: 2026-09-06

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick runtime/data, Kick pre-public UI, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

A blocked production dependency does not block preview-only UI, fixtures, validators, documentation, browser-safe preparation or unrelated safe lanes.

No schedule item silently authorizes production collector, D1, schema, cadence, retention, production-data mutation or public activation.

## 2. Completed mainline gates

### Step 0 — documentation source-of-truth reconciliation — COMPLETE

Completed in PR #1219.

### Step 1 — Twitch Country current product boundary — COMPLETE

Country choropleth, compact responsive UI, browser/OpenFreeMap verification and production proof are complete. Issue #1214 is closed as completed.

Country is maintenance/scoped-defect work only and does not block City, Kick or Current/IRL.

### Step 2 — Twitch City C1-C6 — COMPLETE

```text
C1  City aggregate model + selection                                   #1222
C2  reference-geometry source contract                                #1223
C3  bounded reviewed reference-geometry registry/review               #1224-#1226
C4  reviewed aggregate reference-point rendering                     #1227
C5  public activation + production structural verification           #1228-#1229
C6  result ordering/filter/layout cleanup + public acceptance         #1230-#1233
```

Current City registry:

```text
reference_point  8
no_geometry      1
```

`no_geometry` remains list-only. Reviewed points remain City aggregate references, never creator coordinates. No further C1-C6 implementation step is scheduled.

### Step 3 — Twitch Current current-main readiness re-audit — COMPLETE

PR #1234 added the current public-readiness gate without changing the production collector. Common stable-ID consumption and the fail-closed Current response core are ready in code. Public Current / IRL remains disabled.

### Step 4 — Kick Country current-main readiness re-audit — COMPLETE

PR #1235 corrected the readiness model to the actual public snapshot source/adapter path.

Reviewed Country work is complete across 100 identities: 7 accepted, 3 excluded non-person, 90 no qualifying evidence, 0 conflict.

### Step 5 — Current fresh Top300 temporal-evidence re-audit — COMPLETE / FAIL CLOSED

Fresh bounded run measured 300 streams and produced 8 reviewable identities. Manual accepted-evidence review found zero fresh qualifying evidence and zero accepted Current placements; 6 rows were no qualifying evidence and 2 remained true unresolved conflicts.

Current remains fail-closed. The same live probe is not scheduled to repeat immediately simply to seek a non-zero result.

### Step 6 — Kick K1 collector-independent reviewed-evidence runtime staging — COMPLETE

Completed by PR #1239.

Validated against the real four result files:

```text
result files                  4
reviewed                    100
accepted                      7
excluded non-person           3
no qualifying evidence       90
conflict unmapped             0
runtime staging connected   true
reconciliation passes       true
public activation           false
```

No collector, D1, schema, cadence or retention change was made.

### Step 7 — Kick KUI1 fail-closed pre-public shell — COMPLETE

Completed by PR #1241.

```text
apps/web/preview/kick-stream-map/       exists
apps/web/kick/map/                      absent
production Vite Kick Map input          absent
public /kick/map/                       absent
```

The preview consumes real readiness/accounting from `/api/kick-stream-map`, is `noindex,nofollow`, has no public canonical target and remains gated.

### Step 8 — Kick KUI2 Country aggregate visualization/results — COMPLETE

Completed by PR #1242.

KUI2 aggregates only `mappedStreams[].geography.countryCode`, paints Country regions, provides Streams/Viewers intensity and mapped/unmapped/excluded/conflict accounting, and contains no creator-coordinate semantics, Twitch evidence reuse, City inference or Current promotion.

### Step 9 — Kick KUI3a deterministic browser proof — COMPLETE

Completed by PR #1244. Accepted run `33978336854`:

```text
fixtures                       5
viewports                      2
browser scenarios             10
violations                     0
mobile horizontal overflow     0
ready-state action targets     44px minimum
creator markers                0
Twitch API requests            0
public /kick/map/ links         0
public canonical               absent
```

### Step 10 — Shared Twitch Map accessibility/regression closeout — COMPLETE AT CURRENT BOUNDARY

Completed by PRs #1245, #1246 and #1247.

Accepted shared UI proof includes 44px geography/action targets, focus-visible keyboard behavior, Country/City URL-state verification, compact Country controls/legend and 390px City action-target verification. No placement semantics changed.

### Step 11 — Kick K2 production stable identity — COMPLETE

Completed by PR #1249. Production acceptance recorded by PR #1250 and production API smoke run `34008795931`.

Implementation path:

```text
existing official /public/v1/livestreams request
-> retain broadcaster_user_id directly
-> existing minute snapshot JSON path
```

K2 added zero additional Kick API requests and no Channels lookup. It did not change D1 schema/bindings, cadence, retention/backfill or Twitch collection.

Production proof observed 100/100 stable identities. Draft #1083 is superseded and closed.

### Step 12 — Kick K3 production reviewed-Country runtime connection — COMPLETE

Completed by PR #1252.

Production path:

```text
real production Kick snapshot
-> broadcaster_user_id stable join
-> terminal-only reviewed Country catalog
-> public projection strips stable ID
-> mapped / unmapped / excluded / conflict Country response
```

The runtime catalog is exactly the four completed reviewed batches:

```text
reviewed                    100
accepted Country              7
excluded non-person           3
no qualifying evidence       90
conflict unmapped             0
```

Accepted production proof:

```text
production commit            0e7b6b0682df21864551b6d47d9520209f42829f
Deploy Web Pages             34010236812 success
Country readiness            34010236815 success
Production API Smoke         34010236817 success
observedStreams              100
stableIdentityStreams        100
state                         blocked_public_activation
publicActivationAuthorized   false
reconciliation               pass
stable identity published    false
```

K3 changes no collector behavior, D1 schema/binding, cadence, retention or Twitch data. It does not authorize K4.

### Step 13 — Kick KUI3b real production-connected browser/API proof — COMPLETE

Completed by PR #1253. Accepted post-merge main readiness run: `34010502534`.

The proof first validates the unchanged real production payload and confirms the normal non-public preview remains K4-gated with geography hidden. It then clones the same production payload only inside local Chromium and lifts only the K4 authorization flag so the existing Country renderer can be compared against real production-connected rows. Production is never mutated and Country rows/accounting are not substituted.

Accepted sample:

```text
production deployment commit  0e7b6b0682df21864551b6d47d9520209f42829f
observedStreams               100
stableIdentityStreams         100
reviewedIdentityStreams         9
mappedStreams                   2
mappedViewers               12848
mappedCountryCount              2
mappedCountryCodes          BR, PL
reconciliation                pass
stable identity published     false
viewports                       2
browser scenarios               4
violations                      0
artifact                 9982308317
digest                   a97098e9902b2529fc8999b251858089142533934fc78699d7cc94aeba5f8666
```

Live reviewed/mapped counts are snapshot-dependent. The fixed review catalog remains 100/7/3/90/0.

KUI3b does not authorize K4.

## 3. Immediate Kick gate — K4 public activation

### Step K4 — public Kick Country activation — BLOCKED / SEPARATE EXPLICIT AUTHORIZATION REQUIRED

K1-K3 and KUI1-KUI3b are complete. The remaining Kick public gate is K4 only.

Current production/public state:

```text
/api/kick-stream-map                 K3 production-connected
publicActivationAuthorized           false
apps/web/kick/map/                   absent
/kick/map/                           not public
public Kick Map canonical            absent
public Kick Map navigation target    absent
production Kick Map Vite entry       absent
```

Only a separate explicit K4 decision may authorize:

- creating/activating canonical `/kick/map/`;
- adding public navigation;
- adding a production Vite entry;
- setting the production public activation contract to authorized;
- final public API/browser/production acceptance.

Do not reinterpret K3 technical readiness or KUI3b's test-only local activation lift as K4 permission.

## 4. Current Location / IRL lane

### Step R1 — fresh evidence re-audit — COMPLETE / FAIL CLOSED

The September 5 review established zero fresh accepted Current placements. Do not immediately rerun the same probe absent a justified new signal or later review window.

### Step R2 — production stable Twitch identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required production dependency:

```text
Twitch Helix streams.user_id
-> retain twitchUserId in production minute snapshot
```

This is a production collector mutation. Stale Draft #1107 must not be merged as-is.

### Step R3 — fresh accepted Current evidence — BLOCKED BY CURRENT DATA STATE

```text
fresh qualifying evidence    0
accepted Current placement   0
```

Stable-ID persistence alone cannot clear this gate.

### Step R4 — public Current route/UI — ONLY AFTER R2 + R3

If a later justified review produces fresh accepted temporal evidence and stable identity is available, freeze a separate Current API contract, add a separate Current UI mode, verify expiry/conflict behavior and then perform an explicit public activation decision.

Current never becomes Base City and never survives expiry.

## 5. Shared UI/accessibility lane — SAFE SCOPED WORK ONLY

The concrete keyboard/focus/mobile-target/legend/URL-state regressions identified in the September 6 audit are closed by #1245-#1247.

Further safe scoped work may include newly discovered keyboard/focus defects, overflow regression checks, map/legend label regressions, explicit empty/conflict/unmapped presentation regressions and structural production/browser verification.

These are maintenance/quality tasks, not a new serial product phase.

## 6. Reviewed-evidence maintenance lane

Existing maintenance policy continues under its own authorization/cadence rules.

Its wait periods do **not** pause shared Map work, docs, fixtures, CI, browser verification or other safe preparation.

## 7. CI/deployment rule

CI waiting in one lane is not a reason to stop another safe lane.

Nothing in this schedule implies:

- any new production collector change beyond completed authorized Kick K2;
- D1/schema/binding change;
- cadence/retention change;
- backfill;
- Current/IRL activation;
- Kick K4 public activation;
- Twitch stable-ID persistence authorization.

## 8. Current completion order

```text
DONE   docs reconciliation #1219
DONE   Country current boundary + #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current readiness re-audit #1234
DONE   Kick Country readiness re-audit #1235
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed pre-public shell #1241
DONE   Kick KUI2 Country aggregate renderer/results #1242
DONE   Kick KUI3a deterministic browser proof #1244 / run 33978336854
DONE   Shared Twitch Map regression/accessibility #1245-#1247
DONE   Kick K2 production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
DONE   Kick K3 production reviewed-Country runtime #1252 / run 34010236817
DONE   Kick KUI3b real production-connected proof #1253 / main run 34010502534
PAR    scoped Map regression/accessibility work + maintenance only
BLOCK  Kick K4 canonical /kick/map/ activation pending separate explicit authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

There is no scheduled return to City C1/C2/C3/C4/C5.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

The following strings remain historical category-rollout verifier anchors and are not the current Stream Map execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
