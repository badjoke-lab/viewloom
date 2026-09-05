# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current program: Stream Map
Audited runtime baseline: d024276a9a478e488f15f507ffb736c091b5702c
Twitch Country: closed at current public product boundary
Twitch City: C1-C6 complete / public accepted
Kick Country runtime: K1 complete / K2 blocked pending explicit collector authorization
Kick Map pre-public UI: KUI1 #1241 + KUI2 #1242 + KUI3a #1244 complete
Kick KUI3a browser proof: 10 scenarios / 0 violations
Kick canonical /kick/map/: absent / not public
Kick KUI3b: waits for K3 real production-connected reviewed Country rows
Kick K3: waits for authorized production broadcaster_user_id persistence
Kick K4: separate public activation gate
Current / IRL: fail-closed / 0 accepted fresh placements
Top20 reviewed-evidence cadence: maintenance sublane only
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

The active Stream Map execution plan is `docs/product/stream-map-implementation-plan-v0.10.md`. Country, City, Kick runtime/data, Kick pre-public UI, Current / IRL and shared Map UI are parallel lanes. A blocked production dependency in one lane does not pause safe work in another lane.

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

## Current execution order

1. Preserve the accepted Twitch Country and Twitch City public boundaries.
2. Treat Kick KUI1/KUI2/KUI3a as completed pre-public preparation; preserve the fail-closed browser proof and do not promote it to a public route.
3. Do not implement Kick K2 production `broadcaster_user_id` persistence without explicit collector authorization.
4. After an authorized K2, connect only the staged Kick reviewed Country path in K3 and verify reconciliation.
5. Run KUI3b against real production-connected reviewed Country rows only after K3; fixtures do not satisfy KUI3b.
6. Create/activate canonical `/kick/map/` only through separate K4 public authorization and production/browser/API proof.
7. Keep Current / IRL fail-closed until both separately authorized production identity and fresh accepted temporal evidence exist.
8. Continue shared Map accessibility/regression work and bounded reviewed-evidence maintenance in parallel.

## Kick KUI3a accepted proof

PR #1244 adds a non-mutating browser proof to the existing `Kick Stream Map Country Public Readiness` workflow. The accepted candidate run is `33978336854`.

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

The proof covers blocked stable identity, ready mixed terminal states, ready empty Country state, unsafe response contract and API error. The ready case exercises metric switching, keyboard Country selection and World view reset. KUI3a proves only the non-public UI contract; it does not substitute for KUI3b real production-connected proof.

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
