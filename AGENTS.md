# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current program: Stream Map
Audited runtime baseline: ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a
Twitch Country: closed at current public product boundary
Twitch City: C1-C6 complete / public accepted
Shared Twitch Map regression: #1245-#1247 complete
Kick Country runtime: K1 complete / K2 complete in production
Kick K2 implementation: #1249
Kick K2 production proof: run 34008795931 / 100 observed / 100 stable IDs / 0 mapped
Kick current API state: blocked_reviewed_evidence
Kick K3: next technical gate / separate production-runtime authorization required
Kick Map pre-public UI: KUI1 #1241 + KUI2 #1242 + KUI3a #1244 complete
Kick KUI3a browser proof: 10 scenarios / 0 violations
Kick KUI3b: waits for K3 real production-connected reviewed Country rows
Kick canonical /kick/map/: absent / not public
Kick K4: separate public activation gate
Current / IRL: fail-closed / 0 accepted fresh placements
Top20 reviewed-evidence cadence: maintenance sublane only
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

The active Stream Map execution plan is `docs/product/stream-map-implementation-plan-v0.10.md`. Country, City, Kick runtime/data, Kick pre-public UI, Current / IRL and shared Map UI are parallel lanes. A blocked or authorization-gated production dependency in one lane does not pause safe work in another lane.

## Mandatory authorities

Before every branch and merge, read current-main `docs/README.md`, `docs/product/current-roadmap.md`, `docs/product/current-schedule.md`, `docs/operations/development-and-deployment-policy.md`, the affected current specification/implementation plan, relevant lane contracts and current implementation/tests.

Historical category-program evidence remains accepted but does not override the current Stream Map authority chain. Cached chat summaries, old handoffs and branch-local historical copies are not authorization.

## Stream Map hard boundaries

- Provider identity/evidence remains separated; no Twitch/Kick aggregation.
- Kick stable identity is `broadcaster_user_id`, never slug/login.
- No Twitch evidence reuse for Kick.
- No language/timezone/name/category/IP geography inference.
- No candidate-only geography placement.
- No City inference from Country.
- No Current inference from Country/Home/Base.
- Home/Base and Current/IRL never overwrite each other automatically.
- No Country/region centroid as a creator City coordinate.
- No creator residential address/GPS/precise-coordinate publication.
- No inferred travel path.
- No production collector, D1/schema/binding, cadence, retention or backfill mutation without its separate authorization/gate.
- Preview-only Kick UI does not authorize or create `/kick/map/`.
- K2 authorization was consumed by #1249 and does not authorize K3, K4 or Twitch stable-ID persistence.

## Current execution order

1. Preserve the accepted Twitch Country and Twitch City public boundaries.
2. Preserve the completed shared Twitch Map regression baseline through #1247.
3. Treat Kick K1 as complete internal reviewed-evidence staging.
4. Treat Kick K2 as complete in production through #1249; production proof run `34008795931` observed 100/100 stable identities with zero mapped geography.
5. Do **not** connect K3 production reviewed-evidence runtime without a separate authorization. K2 completion only removes its stable-ID prerequisite.
6. After separately authorized K3, run KUI3b against real production-connected reviewed Country rows; fixtures do not satisfy KUI3b.
7. Create/activate canonical `/kick/map/` only through separate K4 public authorization and production/browser/API proof.
8. Keep Current / IRL fail-closed until both separately authorized Twitch production identity and fresh accepted temporal evidence exist.
9. Continue scoped Map accessibility/regression and bounded reviewed-evidence maintenance in parallel.

## Kick K2 accepted production proof

PR #1249 retained `broadcaster_user_id` directly from the existing official `/public/v1/livestreams` response. No additional Channels request was added.

Production collector deployment run `34008654160` proved provider scope:

```text
deployKick      true
deployTwitch    false
deploy-kick     success
deploy-twitch   skipped
remote schema   success
```

Production API proof run `34008795931` proved:

```text
updatedAt                    2026-09-06T03:21:00.627Z
observedStreams              100
stableIdentityStreams        100
missingStableIdentityStreams   0
stableIdentityPercent          1
mappedStreams                  0
state                         blocked_reviewed_evidence
```

Exact remaining Kick blockers:

```text
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

Draft #1083 is superseded by #1249 and closed.

## Kick KUI3a accepted proof

PR #1244 added non-mutating browser proof to the existing `Kick Stream Map Country Public Readiness` workflow. Accepted candidate run: `33978336854`.

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

KUI3a proves only the non-public fixture contract and cannot substitute for KUI3b real production-connected proof.

## Kick K3/K4 boundary

K3 is technically unblocked by K2 but remains unauthorized until separately approved. If approved, K3 may connect only the already-staged Kick reviewed Country evidence by `broadcaster_user_id`. It must not infer City/Current geography, emit creator coordinates, reuse Twitch evidence or activate a public canonical route.

K4 is a separate gate. Until K4:

```text
/apps/web/kick/map/  absent
/kick/map/           not public
public activation    false
mapped public rows   0
```

## Current / IRL boundary

Current / IRL remains fail-closed:

```text
population measured          300
reviewed identities             8
fresh qualifying evidence       0
accepted Current placement      0
true unresolved conflicts       2
```

Current blockers remain production Twitch stable-ID persistence, the absence of a public Current geography mode, and zero fresh accepted temporal placements. Kick K2 authorization does not apply to Twitch. Draft #1107 remains stale and must not merge as-is.

## Historical accepted category-program state

The completed category rollout remains accepted historical product evidence and is not reopened by Stream Map work.

```text
Twitch category stability + Heatmap public rollout complete
Historical runtime gate: viewloom-12a2-current-gate-state-v33 retained as immutable accumulation evidence
Final audit accepted: PR #736
Final-mode decision accepted: PR #737
Hidden production revalidation accepted: PR #739
Public cutover: PR #740
Mobile overflow repair: PR #741
Accepted production SHA: b006f45d0676c9ff3e05e5d6727458e43802de53
Pages deploy run: 31244148642 success
Public production acceptance run: 31244148651 success
Twitch Heatmap public category-filter exposure: active
Kick category UI: unauthorized
Keep parent category program #623 open
```

Accepted category decisions remain preserved:

- Provider-scoped category identity is `(provider, categoryProviderId)`.
- Only source pairs with both provider ID and category name create a category reference.
- Incomplete source pairs remain null coverage; no synthetic, name-only, or cross-provider mapping is allowed.
- The final seven-day Twitch audit accepted `2016 / 2016` expected five-minute slots with no missing or consecutive-missing buckets.
- Twitch Heatmap Category + Top controls are accepted on the normal `/twitch/heatmap/` route.
- Public defaults are `All categories` and `Top 50`; allowed Top values are `20`, `50`, and `100`; category filtering occurs before Top-N slicing.
- The first public candidate was correctly rejected for 390px mobile overflow (`474 / 390`); PR #741 repaired the presentation-only width defect.
- Accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53` passed deployed public acceptance with 390px `scrollWidth=390`.

## Production safety

- `main` is production; no direct push.
- Do not recreate retired observation/final-audit execution paths without a new governed decision.
- No backfill, threshold relaxation, synthetic category mapping, or cross-provider identity/totals/rankings.
- No automatic Kick, Day Flow, or History category UI rollout from the Twitch Heatmap acceptance.
- Existing Twitch and Kick five-minute collector cadences, D1 boundaries, bindings, and retention remain unchanged unless separately authorized.
