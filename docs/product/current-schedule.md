# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.8.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `13af00ce399bcf85d3699815730deda5cd78288f`  
Last updated: 2026-09-05

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs. It does not impose idle time on other safe work.

No schedule item silently authorizes production collector, D1, schema, cadence, retention or production-data mutation.

## 2. Completed mainline gates

### Step 0 — documentation source-of-truth reconciliation — COMPLETE

Completed in PR #1219.

### Step 1 — Twitch Country current product boundary — COMPLETE

Country choropleth, compact responsive UI, browser/OpenFreeMap verification and production proof are complete. Issue #1214 is closed as completed.

Country is now maintenance/scoped-defect work only and does not block City, Kick or Current/IRL.

### Step 2 — Twitch City C1-C6 — COMPLETE

Completed sequence:

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

`no_geometry` remains list-only. Reviewed points remain City aggregate references, never creator coordinates.

Current acceptance record:

`docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json`

No further C1-C6 implementation step is scheduled.

### Step 3 — Twitch Current current-main readiness re-audit — COMPLETE

PR #1234 added the current public-readiness gate without changing the production collector.

Current exact blockers:

```text
production_twitch_snapshot_does_not_retain_user_id
public_current_geography_mode_not_wired
no_fresh_reviewed_current_evidence
```

Common stable-ID consumption and the fail-closed Current response core are ready in code. Public Current / IRL remains disabled.

### Step 4 — Kick Country current-main readiness re-audit — COMPLETE

PR #1235 corrected the readiness model to the actual public snapshot source/adapter path.

Ready in code:

- optional `broadcaster_user_id` snapshot parsing;
- public stable-ID adapter without slug fallback;
- reviewed Country evidence bridge;
- stable-ID live join;
- Country response core.

Reviewed Country work is complete across 100 identities: 7 accepted, 3 excluded non-person, 90 no qualifying evidence.

Current exact blockers:

```text
production_livestream_snapshot_does_not_retain_broadcaster_user_id
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

## 3. Immediate lane — Kick Country

### Step K1 — collector-independent preparation — NOW

Allowed without production collector authorization:

- maintain/read-only-audit the stable-ID-capable snapshot source and public adapter;
- maintain the real 100-result reviewed-evidence reconciliation;
- maintain stable-ID live-join/response fixtures and validators;
- prepare clean current-main runtime integration without activating a public surface;
- keep provider-specific boundaries explicit.

### Step K2 — production stable identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required production dependency:

```text
Kick official livestream collection
-> retain official broadcaster_user_id in production minute snapshot
```

This is a production collector mutation. It is not authorized by this schedule.

Stale Draft #1083 must not be merged as-is. If authorization is later given, implement/re-audit the minimal change on current main.

### Step K3 — reviewed evidence runtime connection — AFTER K2

Once the production snapshot supplies stable IDs, connect only the existing Kick-reviewed Country evidence path to the public response core and verify reconciliation.

Do not reuse Twitch evidence or treat slug/login as stable identity.

### Step K4 — public Kick Country activation — SEPARATE GATE

Activation requires its own explicit decision and production/browser/API proof. K2/K3 do not automatically authorize it.

## 4. Immediate lane — Current Location / IRL

### Step R1 — evidence/readiness work — NOW

Allowed while collector activation is blocked:

- read-only fresh temporal-evidence review;
- expiry/conflict validator maintenance;
- Current response-core verification;
- explicit blocked-state readiness auditing;
- non-activating API/UI preparation.

### Step R2 — production stable Twitch identity — BLOCKED UNTIL EXPLICIT AUTHORIZATION

Required production dependency:

```text
Twitch Helix streams.user_id
-> retain twitchUserId in production minute snapshot
```

This is a production collector mutation. Stale Draft #1107 must not be merged as-is.

### Step R3 — fresh accepted Current evidence — BLOCKED BY CURRENT DATA STATE

The latest accepted acquisition result has zero fresh qualifying evidence and zero accepted Current placement.

Stable-ID persistence alone cannot clear this gate.

### Step R4 — public Current route/UI — ONLY AFTER R2 + R3

If fresh accepted temporal evidence exists and stable identity is available, freeze a separate Current API contract, add a separate Current UI mode, verify expiry/conflict behavior and then perform an explicit public activation decision.

Current never becomes Base City and never survives expiry.

## 5. Shared UI/accessibility lane

Safe independent work includes:

- keyboard/focus verification;
- mobile tap targets;
- overflow/regression checks;
- map/legend labels;
- explicit empty/conflict/unmapped presentation;
- geography URL-state verification;
- production/browser structural verification.

Do not force Country, City and Current into one geometry model.

## 6. Reviewed-evidence maintenance lane

Existing maintenance policy continues under its own authorization/cadence rules.

Its wait periods do **not** pause Kick/Current read-only work, docs, fixtures, CI, browser verification or other safe preparation.

## 7. CI/deployment rule

CI waiting in one lane is not a reason to stop another safe lane.

Nothing in this schedule implies:

- production collector change;
- D1/schema/binding change;
- cadence/retention change;
- backfill;
- production data mutation;
- Current/IRL activation;
- Kick activation.

## 8. Current completion order

```text
DONE   docs reconciliation #1219
DONE   Country current boundary + #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current readiness re-audit #1234
DONE   Kick Country readiness re-audit #1235
NOW    safe Kick/Current evidence, validation and non-mutating preparation
BLOCK  Kick production stable-ID persistence pending explicit collector authorization
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
