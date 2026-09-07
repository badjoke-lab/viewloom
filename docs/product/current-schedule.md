# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.8.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.11.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Last updated: 2026-09-07

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick Country, Kick City, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

A blocked production dependency does not block preview-only UI, fixtures, validators, documentation, browser-safe preparation or unrelated safe lanes.

No schedule item silently authorizes production collector, D1, schema, cadence, retention, production-data mutation or Current public activation.

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

The latest September 6 bounded refresh supersedes the earlier September 6 evidence window for current readiness. Review-queue run `34036562297` measured 300 unique stable Twitch identities, produced 10 reviewable identities, rejected 2 future/planned-travel rows before review and produced two machine conflict rows.

Accepted-class review covered all 10 identities × 4 accepted evidence classes = 40 identity/class pairs. It found zero fresh qualifying temporal evidence and zero accepted Current placements. All 10 reviewed identities remain no-fresh-qualifying outcomes. The two machine conflicts (`robcdee` and `joeykaotyk`: Japan + Tokyo) are same-country granularity differences, not true competing-country conflicts.

```text
requested population                    300
unique stable identities measured       300
duplicate stable-ID rows dropped           0
reviewable identities                     10
future/planned travel rejected             2
machine conflict rows                       2
accepted-class review pairs                40
fresh qualifying evidence                   0
accepted Current placement                  0
no-fresh-qualifying outcomes               10
true unresolved cross-country conflicts     0
same-country granularity conflicts closed   2
```

Current remains fail-closed. This refresh did not authorize production stable-ID persistence, public Current routing/UI or Home/Base mutation.

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

### Step 7 — Kick KUI1 fail-closed pre-public shell — COMPLETE / HISTORICAL PRE-K4 STAGE

Completed by PR #1241.

At that pre-K4 stage:

```text
apps/web/preview/kick-stream-map/       exists
apps/web/kick/map/                      absent
production Vite Kick Map input          absent
public /kick/map/                       absent
```

Those absence assertions were correct before K4 and are historical now. The preview consumed real readiness/accounting from `/api/kick-stream-map`, was `noindex,nofollow`, had no public canonical target and remained gated.

### Step 8 — Kick KUI2 Country aggregate visualization/results — COMPLETE

Completed by PR #1242.

KUI2 aggregates only `mappedStreams[].geography.countryCode`, paints Country regions, provides Streams/Viewers intensity and mapped/unmapped/excluded/conflict accounting, and contains no creator-coordinate semantics, Twitch evidence reuse, City inference or Current promotion.

### Step 9 — Kick KUI3a deterministic browser proof — COMPLETE / HISTORICAL PRE-K4 STAGE

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

The last two assertions describe the intentionally gated pre-K4 state and are retained as historical prerequisite proof.

### Step 10 — Shared Twitch Map accessibility/regression closeout — COMPLETE AT CURRENT BOUNDARY

Completed by PRs #1245, #1246 and #1247.

Accepted shared UI proof includes 44px geography/action targets, focus-visible keyboard behavior, Country/City URL-state verification, compact Country controls/legend and 390px City action-target verification. No placement semantics changed.

The already-public `/twitch/map/` route is permanently included in the public-surface inventory, sitemap, four-viewport browser matrix and production smoke through PR #1259.

Later scoped regression work #1275/#1276 closed the stale-data error path without changing geography semantics. Candidate Public Browser Audit `34041133229` passed the then-current 104-scenario matrix plus success -> 503 -> recovery with 3 API calls and 0 violations; artifact `9991741143`. Post-merge main also passed Primary Domain Production Smoke `34041371788` and Twitch Map Production Browser Smoke `34041371752`; artifact `9991785120` records Country/City `basemap-ready` and zero page/console errors.

Shared collector-state and production-proof maintenance #1279-#1281 is also complete. #1279 keeps real `partial` status available instead of showing `Collector status unavailable`; its post-merge production checks include Deploy Web Pages `34043914846`, Production Smoke `34043914776`, Primary Domain Production Smoke `34043914876` and Twitch Map Production Browser Smoke `34043914798`. #1280 makes permanent Twitch Map production smoke wait for Country MapLibre `loaded()` before accepted screenshots; post-merge smoke `34044472299` and artifact `9992672074` capture the fully loaded world basemap. #1281 extends the same availability distinction to real `empty` status results; candidate Public Browser Audit `34045610303` passed all then-current 104 scenarios, and post-merge Deploy Web Pages `34045809819`, Production Smoke `34045809904`, Primary Domain Production Smoke `34045809822` and Twitch Map Production Browser Smoke `34045809886` all passed. Artifact `9993068572` records ready Country/City and zero page/console errors.

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

Accepted K3 production proof:

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

The blocked state is historical K3 proof and was superseded by K4 activation. K3 itself changed no collector behavior, D1 schema/binding, cadence, retention or Twitch data.

### Step 13 — Kick KUI3b real production-connected browser/API proof — COMPLETE

Completed by PR #1253. Accepted post-merge main readiness run: `34010502534`.

The proof first validated the unchanged real K3 production payload and confirmed the normal non-public preview remained K4-gated. It then cloned that payload only inside local Chromium and lifted only the K4 authorization flag so the existing Country renderer could be compared against real production-connected rows. Production was never mutated and Country rows/accounting were not substituted.

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

### Step 14 — Kick K4 preactivation and exact cutover contract — COMPLETE / CONSUMED BY K4

PR #1255 froze the accepted K2/K3/KUI3b evidence. PR #1265 froze the exact file-level K4 cutover contract.

The frozen contract required:

- explicit route -> adapter/runtime authorization with false remaining the default;
- canonical `apps/web/kick/map/index.html` plus separate public entry module;
- production Vite input, Kick home target and sitemap entry;
- Kick readiness/API/browser proof;
- public-surface inventory/browser/production-smoke updates.

It explicitly excluded collector directories, migrations, the reviewed Country runtime catalog and the four canonical Country review result files.

Those preparation gates did not themselves authorize K4; the later explicit user authorization was consumed by PR #1283.

### Step 15 — Kick K4 public Country activation — COMPLETE #1283

Accepted production cutover:

```text
product commit                       ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b
Deploy Web Pages                     34048677710 success
Production Smoke                     34048677691 success
Production Smoke artifact            9993885992
Kick Production API Smoke            34048677721 success
Kick API proof artifact              9993884302
/kick/map/                           HTTP 200
publicActivationAuthorized           true
state                                ready
observedStreams                      100
stableIdentityStreams                100
reviewedIdentityStreams               35
mappedStreams                          4
mappedCountryCount                     4
reconciliation                       100/100 pass
stable identity published            false
City / Current / coordinates         absent
```

Current public inventory after K4:

```text
Vite HTML inputs                 27
inventory entries incl. 404      28
indexable routes                 23
sitemap routes                   23
browser viewports                 4
browser scenarios               108
```

K4 is closed. Its authorization is consumed.

## 3. Immediate mainline — Kick City

### Step KC1 — City contract + deterministic fixtures — NEXT

Define and test:

- internal stable identity = `broadcaster_user_id`;
- slug/login is display metadata only;
- accepted Base City claims are only `home_base` / `declared_location`;
- Country-only evidence -> City unmapped;
- Current/temporary evidence -> not Base City;
- Base City conflicts -> fail closed;
- missing stable ID -> fail closed;
- excluded non-person state remains excluded;
- public output strips stable identity;
- no creator coordinates;
- mapped/unmapped/excluded/conflict reconciliation covers the selected population.

Deterministic fixtures must cover at least:

1. accepted City with reviewed aggregate reference geometry;
2. accepted City with `no_geometry` list-only state;
3. Country-only evidence -> City unmapped;
4. conflicting Base City evidence -> conflict/unmapped;
5. current/temporary evidence -> not Base City;
6. missing stable ID -> fail closed;
7. excluded non-person entity.

**Outcome:** Kick City semantics become testable before production runtime or public UI work.

### Step KC2 — reviewed Kick City evidence catalog

Build a provider-specific City review catalog keyed by `broadcaster_user_id`.

Do not derive City from the Country terminal catalog. Do not reuse Twitch evidence. Do not infer from birthplace/nationality/language/timezone/organization HQ/event venue alone.

Keep runtime terminal City state minimal and public output free of raw review prose/provenance.

**Outcome:** real Kick identities receive independently reviewed Base City outcomes.

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

**Outcome:** real production-connected Kick City aggregates exist behind the provider-separated API contract.

### Step KC4 — City UI/browser proof

Add explicit Country/City resolution UI and prove:

- desktop + 390px mobile;
- keyboard/focus/44px actions;
- reviewed aggregate reference geometry only;
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

## 4. Current Location / IRL lane

### Step R1 — fresh evidence re-audit — COMPLETE / FAIL CLOSED

The latest September 6 review is canonical for Current readiness:

```text
run                              34036562297
artifact                         9990351519
unique stable identities                300
reviewable identities                    10
accepted-class review pairs              40
fresh qualifying evidence                 0
accepted Current placement                0
no-fresh-qualifying outcomes             10
true cross-country conflicts              0
same-country granularity conflicts        2
```

The two machine conflicts were Japan + Tokyo for `robcdee` and `joeykaotyk`; both are same-country granularity differences and neither was promoted to a Current placement.

### Step R2 — production stable Twitch identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required production dependency:

```text
Twitch Helix streams.user_id
-> retain twitchUserId in production minute snapshot
```

This is a production collector mutation. Draft #1107 is closed unmerged and must not be revived as authorization.

### Step R3 — fresh accepted Current evidence — BLOCKED BY CURRENT DATA STATE

```text
fresh qualifying evidence    0
accepted Current placement   0
```

Stable-ID persistence alone cannot clear this gate. Do not repeatedly rerun the same evidence window solely to seek a non-zero result.

### Step R4 — public Current route/UI — ONLY AFTER R2 + R3

If a later justified review produces fresh accepted temporal evidence and stable identity is available, freeze a separate Current API contract, add a separate Current UI mode, verify expiry/conflict behavior and then perform an explicit public activation decision.

Current never becomes Base City and never survives expiry.

## 5. Shared UI/accessibility lane — SAFE SCOPED WORK ONLY

The concrete keyboard/focus/mobile-target/legend/URL-state regressions identified in the September 6 audit are closed by #1245-#1247. The later stale-data/unavailable-presentation regression is closed by #1275/#1276. Shared collector-state presentation and permanent Map screenshot reliability are closed through #1279-#1281.

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
- Twitch stable-ID persistence authorization;
- future Kick City collector/storage mutation.

Kick K4 authorization was consumed by #1283 and does not transfer to other lanes.

## 8. Current completion order

```text
DONE   docs reconciliation #1219
DONE   Country current boundary + #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current readiness re-audit #1234
DONE   Kick Country readiness re-audit #1235
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed pre-public shell #1241
DONE   Kick KUI2 Country aggregate renderer/results #1242
DONE   Kick KUI3a deterministic browser proof #1244 / run 33978336854
DONE   Shared Twitch Map regression/accessibility #1245-#1247
DONE   Kick K2 production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
DONE   Kick K3 production reviewed-Country runtime #1252 / run 34010236817
DONE   Kick KUI3b real production-connected proof #1253 / main run 34010502534
DONE   Kick K4 preactivation readiness #1255
DONE   Twitch public-surface inventory includes /twitch/map/ #1259 / 104 scenarios
DONE   Kick exact K4 cutover contract #1265
DONE   Current live candidate probe sequence 4 #1272 / run 34036197901 / 300 -> 10 candidates
DONE   Current review queue refresh #1273 / run 34036562297 / 300 -> 10 reviewed -> 0 accepted
DONE   Twitch Map stale-data fail-closed recovery #1275
DONE   Twitch Map unavailable presentation closeout #1276 / run 34041133229 / artifact 9991741143
DONE   Shared collector partial-status presentation #1279 / production smoke 34043914798
DONE   Twitch Map production screenshot tile-readiness #1280 / run 34044472299 / artifact 9992672074
DONE   Shared collector empty-status presentation #1281 / production smoke 34045809886 / artifact 9993068572
DONE   Kick K4 public Country activation #1283 / ffe6b28 / production API smoke 34048677721 / 108 scenarios
NEXT   Kick City KC1 deterministic contract + fixtures
PAR    Kick City KC2 evidence preparation after KC1
PAR    scoped Map regression/accessibility work + maintenance only
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

There is no scheduled return to Twitch City C1/C2/C3/C4/C5. Kick City is a new provider-specific lane, not a reopening of Twitch City implementation.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

The following strings remain historical category-rollout verifier anchors and are not the current Stream Map execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
