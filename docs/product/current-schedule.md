# ViewLoom current schedule

Status: source of truth for immediate Stream Map sequencing  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a`  
Last updated: 2026-09-06

## 1. Scheduling principle

Stream Map work is not one serial queue.

Country, City, Kick runtime/data, Kick pre-public UI, Current Location / IRL and shared Map UI are parallel lanes. The reviewed-evidence Top-20 cadence governs only its own maintenance runs and never imposes idle time on other safe work.

A blocked or authorization-gated production dependency does not block preview-only UI, fixtures, validators, documentation, read-only audits or unrelated safe lanes.

No schedule item silently authorizes production collector, D1/schema/binding, cadence, retention, backfill, production runtime connection or public activation.

## 2. Completed Stream Map sequence

```text
DONE  Country closeout / issue #1214
DONE  Twitch City C1-C6 through #1233
DONE  Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE  Kick K1 reviewed-evidence runtime staging #1239
DONE  Kick KUI1 fail-closed preview #1241
DONE  Kick KUI2 Country aggregate preview #1242
DONE  Kick KUI3a non-mutating browser proof #1244
DONE  Shared geography controls #1245
DONE  Shared compact Country controls/legend #1246
DONE  Shared City mobile targets #1247
DONE  Kick K2 production stable-ID persistence #1249
DONE  Kick K2 production acceptance #1250 / run 34008795931
```

## 3. Step K2 — COMPLETE IN PRODUCTION

K2 is no longer a blocker.

Implementation #1249:

```text
existing /public/v1/livestreams request
-> retain broadcaster_user_id directly
-> existing minute snapshot JSON write
```

No additional Kick API request was added. No Channels enrichment was required. Draft #1083 is superseded and closed.

Production deploy run `34008654160`:

```text
Kick deploy     success
Twitch deploy   skipped
provider scope  Kick only
remote schema   success
```

Production proof run `34008795931`:

```text
updatedAt                    2026-09-06T03:21:00.627Z
observedStreams              100
stableIdentityStreams        100
missingStableIdentityStreams   0
stableIdentityPercent          1
mappedStreams                  0
mappedCountryCount             0
state                         blocked_reviewed_evidence
```

This closes only the stable-identity prerequisite. It does not authorize K3 or K4.

## 4. Immediate Kick runtime lane — K3 NEXT / SEPARATE AUTHORIZATION REQUIRED

K3 is technically unblocked by K2 but remains a separate production runtime behavior change.

If separately authorized, K3 scope is strictly:

```text
production Kick minute snapshot
-> broadcaster_user_id stable join
-> existing Kick-only reviewed Country evidence
-> deterministic terminal reviewed Country state
-> production Kick Country response
```

K3 must not:

- use slug/login as stable identity;
- reuse Twitch evidence;
- infer City or Current geography;
- emit creator coordinates;
- reconstruct dropped evidence provenance;
- activate canonical `/kick/map/`;
- add public navigation;
- authorize K4.

Current exact Kick blockers after K2:

```text
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

## 5. Kick UI lane — KUI3b WAITS FOR K3

Pre-public UI state:

```text
KUI1  COMPLETE #1241
KUI2  COMPLETE #1242
KUI3a COMPLETE #1244 / 10 browser scenarios / 0 violations
KUI3b WAIT until K3 real production-connected reviewed rows exist
```

KUI3b must use real production data. Fixtures do not satisfy it.

Required KUI3b proof after K3:

- production Country totals reconcile with API;
- mapped/unmapped/excluded/conflict accounting reconciles;
- no fixture/demo geography;
- no creator coordinates;
- no Twitch evidence;
- empty/blocked states explicit;
- desktop/mobile/browser verification.

KUI3b does not authorize K4 by itself.

## 6. Kick public activation lane — K4 BLOCKED / SEPARATE GATE

Until a separate K4 decision:

```text
/apps/web/kick/map/  absent
/kick/map/           not public
public navigation    unchanged
production Vite      no canonical Kick Map input
public activation    false
mapped public rows   0
```

Only K4 may create/activate the public route after K3 and KUI3b proof.

## 7. Current / IRL lane — FAIL CLOSED

Fresh September 5 state:

```text
population measured          300
reviewable candidates          8
reviewed identities             8
fresh qualifying evidence       0
accepted Current placement      0
no qualifying evidence          6
true unresolved conflicts       2
```

Current blockers remain:

```text
production Twitch snapshot does not retain user_id / twitchUserId
public Twitch geography route has no Current mode
fresh reviewed Current evidence = 0 accepted placements
```

Kick K2 authorization does not apply to Twitch. Draft #1107 remains stale and must not merge as-is.

A later Current review requires a justified new signal/window rather than repeating the same probe merely to seek a non-zero result.

## 8. Twitch Country / City lanes — CLOSED AT CURRENT BOUNDARY

Country remains choropleth-first with accepted-evidence-only placement and no creator-coordinate semantics.

City remains aggregate-first with only accepted Base City evidence, no Country-to-City inference, no creator points and no Current-to-Base mutation.

Shared regression closeout:

```text
#1245 geography controls / keyboard / URL state / 44px
#1246 Country compact controls + five-step legend
#1247 City selected-City/filter/population/MapLibre mobile targets >=44px
```

Further work is scoped maintenance only.

## 9. Reviewed-evidence maintenance lane

Top-20 reviewed-evidence maintenance remains a bounded safety/quality sublane. Its cadence never schedules the Map program as a whole.

## 10. Parallel safe work while K3 is unauthorized

Safe work includes:

- read-only K3 current-main audit;
- deterministic K3 contract fixtures;
- validator preparation that does not connect production runtime;
- KUI3b fixture/structure preparation that does not pretend to be real production proof;
- documentation consistency;
- scoped accessibility/browser regression;
- reviewed-evidence maintenance.

Safe preparation must not silently cross the K3 or K4 gates.

## 11. Current exact execution order

```text
DONE   Kick K2 direct stable-ID persistence #1249
DONE   production K2 proof #1250 / run 34008795931 / 100 of 100 stable IDs
NEXT   K3 production reviewed-evidence runtime connection — separate authorization required
WAIT   KUI3b real production-connected browser/API proof until K3
BLOCK  K4 canonical /kick/map/ activation pending separate authorization/proof
BLOCK  Current Twitch stable-ID persistence pending its own authorization
BLOCK  Current public route/evidence gates remain unresolved
PAR    scoped safe audits/fixtures/docs/UI maintenance
```

## 12. Production safety

The K2 authorization is consumed. It does not authorize:

- K3 production runtime connection;
- K4 public activation;
- Twitch stable-ID persistence;
- new upstream requests unrelated to the accepted K2 direct field retention;
- D1 schema/binding changes;
- cadence changes;
- retention/backfill changes.

## Historical accepted category-program state

These lines are retained for the accepted development-policy verifier and do not override the current Stream Map schedule.

Twitch category stability + Heatmap public rollout complete

Public production acceptance run 31244148651 success

Historical scheduling instruction: keep #623 open as the parent category program. This is retained as historical category-program state only.
