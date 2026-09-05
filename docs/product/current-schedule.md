# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `d024276a9a478e488f15f507ffb736c091b5702c`  
Last updated: 2026-09-06

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick runtime/data, Kick pre-public UI, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

A blocked production dependency does not block preview-only UI, fixtures, validators, documentation, browser-safe preparation or unrelated safe lanes.

No schedule item silently authorizes production collector, D1, schema, cadence, retention or production-data mutation.

## 2. Completed mainline gates

### Step 0 — documentation source-of-truth reconciliation — COMPLETE

Completed in PR #1219.

### Step 1 — Twitch Country current product boundary — COMPLETE

Country choropleth, compact responsive UI, browser/OpenFreeMap verification and production proof are complete. Issue #1214 is closed as completed.

Country is now maintenance/scoped-defect work only and does not block City, Kick or Current/IRL.

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

Reviewed Country work is complete across 100 identities: 7 accepted, 3 excluded non-person, 90 no qualifying evidence.

### Step 5 — Current fresh Top300 temporal-evidence re-audit — COMPLETE

Fresh bounded run:

```text
workflow run                33961161696
population measured         300
reviewable candidates         8
machine conflict rows         3
future-travel rejects         0
invalid identity rows         0
```

Manual accepted-evidence review:

```text
identities reviewed            8
fresh qualifying evidence      0
accepted Current placement     0
no qualifying evidence         6
true unresolved conflicts      2
```

One machine conflict row was `Japan` + `Tokyo` same-country granularity and was closed as no qualifying evidence rather than a competing-country conflict. The two actual unresolved multi-country rows remain `conflict_unmapped`.

Current remains fail-closed. The same live probe is not scheduled to repeat immediately simply to seek a non-zero result.

### Step 6 — Kick K1 collector-independent reviewed-evidence runtime staging — COMPLETE

Completed by PR #1239.

Internal staged path:

```text
completed manual Kick Country review artifacts
-> buildKickReviewedCountryEvidence(...)
-> stable broadcaster_user_id join
-> buildKickCountryResponse(...)
```

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

Completed by PR #1241, merge `f592559699a03d52b9b063da332fbe5c9e38ddd4`.

KUI1 added the missing Kick Map UI lane without creating a public route:

```text
apps/web/preview/kick-stream-map/       exists
apps/web/kick/map/                      absent
production Vite Kick Map input          absent
public /kick/map/                       absent
```

The preview consumes real readiness/accounting from `/api/kick-stream-map`, is `noindex,nofollow`, has no public canonical target and requires both runtime readiness and explicit public activation authorization before geography may render.

The existing Kick Country Public Readiness workflow also proves that the UI preview stays non-public and fail-closed. No redundant workflow was added.

### Step 8 — Kick KUI2 Country aggregate visualization/results — COMPLETE

Completed by PR #1242, merge `6b8668492d2a35e9fb83e1d93929fef8b58de215`.

KUI2 added:

- aggregation only from `mappedStreams[].geography.countryCode`;
- Country-region choropleth from local GeoJSON;
- Viewers / Streams intensity;
- Country selection + World view reset;
- mapped stream results;
- unmapped / excluded / conflict accounting;
- reconciliation state;
- keyboard focus and minimum tap targets for new controls;
- deterministic validator in the existing Kick readiness workflow.

KUI2 does not use creator coordinates, map streamers to centroids, reuse Twitch evidence, infer City, promote Current or make `/kick/map/` public.

The current K1 bridge deliberately drops evidence/source prose beyond reviewed terminal Country. KUI2 therefore does not invent an Evidence-source filter that the runtime contract cannot support.

### Step 9 — Kick KUI3a non-mutating browser proof — COMPLETE

Completed by PR #1244. Accepted `Kick Stream Map Country Public Readiness` run: `33978336854`.

The existing Kick readiness workflow now runs fast fixture checks first and then, only after they pass, a local Vite + Chromium browser proof. No new workflow was added.

Accepted proof:

```text
fixtures                       5
viewports                      2 (1440 desktop / 390 mobile)
browser scenarios             10
violations                     0
mobile horizontal overflow     0 in every scenario
ready-state action targets     44px minimum
MapLibre canvas                1 in ready state
creator markers                0
Twitch API requests            0
public /kick/map/ links         0
public canonical               absent
```

Covered states: blocked stable identity, ready mixed terminal-state accounting, ready empty Country, unsafe response contract and API error. The ready path also exercises metric switching, keyboard Country selection and World view reset.

KUI3a remains fixture-based non-public proof. It does not satisfy KUI3b and does not authorize K2/K3/K4.

## 3. Immediate lane — Kick Country runtime/data

### Step K1 — collector-independent reviewed-evidence runtime preparation — COMPLETE

Completion condition is satisfied: the internal runtime path deterministically consumes the real reviewed Kick Country evidence when a stable `broadcaster_user_id` is supplied by the staged snapshot, without slug fallback and without public activation.

### Step K2 — production stable identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required production dependency:

```text
Kick official livestream collection
-> retain official broadcaster_user_id in production minute snapshot
```

This is a production collector mutation. It is not authorized by this schedule.

Stale Draft #1083 must not be merged as-is. If authorization is later given, implement/re-audit the minimal change on current main.

### Step K3 — production runtime connection — AFTER K2

Once the production snapshot supplies stable IDs, connect only the already-staged provider-specific reviewed Country path to production runtime and verify production reconciliation.

Do not reuse Twitch evidence or treat slug/login as stable identity. K3 does not authorize public activation.

### Step K4 — public Kick Country activation — SEPARATE GATE

Activation requires its own explicit decision and production/browser/API proof. Only this stage may create/activate canonical `/kick/map/`, add it to public navigation and add a production Vite input.

## 4. Immediate lane — Kick pre-public UI

### Step KUI1 — fail-closed shell — COMPLETE

Completed #1241.

### Step KUI2 — Country aggregate renderer/results — COMPLETE

Completed #1242.

### Step KUI3a — non-mutating proof preparation — COMPLETE

Completed #1244 / browser run `33978336854` with 10 scenarios and zero violations.

KUI3a has frozen deterministic browser expectations for mapped / unmapped / excluded / conflict accounting, blocked/empty/error/unsafe states, 390px overflow, 44px targets, keyboard behavior, MapLibre rendering, creator-marker absence and provider separation.

### Step KUI3b — real production-connected browser/API proof — AFTER K3

Required chain:

```text
real production Kick snapshot
-> broadcaster_user_id stable join
-> reviewed Kick Country terminal states
-> Country aggregate UI
-> desktop/mobile/API/browser reconciliation
```

Do not substitute fixture/demo geography for KUI3b.

KUI3b completion still does not authorize K4 by itself.

## 5. Immediate lane — Current Location / IRL

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

## 6. Shared UI/accessibility lane — SAFE INDEPENDENT WORK

Safe immediate work includes:

- keyboard/focus verification;
- mobile tap targets;
- overflow/regression checks;
- map/legend labels;
- explicit empty/conflict/unmapped presentation;
- geography URL-state verification;
- production/browser structural verification.

Shared mechanics may be reused but provider/geography evidence models remain separate.

## 7. Reviewed-evidence maintenance lane

Existing maintenance policy continues under its own authorization/cadence rules.

Its wait periods do **not** pause shared Map regression/accessibility work, later justified Current evidence review, docs, fixtures, CI, browser verification or other safe preparation.

## 8. CI/deployment rule

CI waiting in one lane is not a reason to stop another safe lane.

Nothing in this schedule implies:

- production collector change;
- D1/schema/binding change;
- cadence/retention change;
- backfill;
- production data mutation;
- Current/IRL activation;
- Kick activation.

## 9. Current completion order

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
DONE   Kick KUI3a non-mutating browser proof #1244 / run 33978336854
PAR    shared Map regression/accessibility work + maintenance
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
WAIT   Kick K3 production runtime connection until K2
WAIT   Kick KUI3b real production-connected proof until K3
BLOCK  Kick K4 canonical /kick/map/ activation pending separate authorization/proof
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
