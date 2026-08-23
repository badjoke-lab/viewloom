# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-23

## Current execution state

```text
Current program Twitch Stream Map
Current stage Reviewed-evidence maintenance policy + fixed Top 20 replication
Accepted main 27b1fb5fbedb9a3d5bf1923a941e7e657c16a5a1
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter contract frozen PR #980
Population filter runtime complete PR #981
Ready-response population semantics fixed PR #983
Production population coverage audit complete PR #982 closed without merge
Coverage remediation candidate audit complete PR #985 closed without merge
Reviewed evidence remediation complete PR #986
Reviewed evidence production verification complete PR #987 closed without merge
Fixed Top 20 sample complete PR #989 verification-only
Fixed Top 20 reviewed evidence + country-only projection complete PR #990
Public Twitch Map /twitch/map/
Real Twitch Map API /api/twitch-stream-map
Kick Map not authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/product/stream-map-spec-v0.5.md`
5. `docs/product/stream-map-implementation-plan-v0.4.md`
6. `docs/product/stream-map-population-filter-decision-v0.1.md`
7. `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
8. `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
9. `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
10. affected feature specification/plan and current WIP/handoff

For historical 12A/category rollout work, retain and consult the accepted 12A audit/decision files. They remain valid historical records but are no longer the current execution milestone.

## Current Stream Map contract

Evidence sources remain separate:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location types remain separate:

```text
home_base
declared_location
current_location
```

Population order:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side entity/evidence placement
-> client-side evidence source/type filters
-> country drilldown
```

Public population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred; permanent minute snapshot does not retain it
```

Evidence-filter semantics:

```text
source selections: OR
type selections: OR
source dimension AND type dimension
empty source/type selection: All accepted
```

Country semantics:

```text
country selection: drilldown only
selected country AND active population/evidence result
selected country with zero matches: retain selection and show explicit zero state
reviewed evidence may retain city/region internally
public location.regions/cities remain empty until a separate City gate
public evidence region/city remain null until a separate City gate
```

Reason-aware Unmapped semantics:

```text
API unmappedReasons describe the selected server-side population
sum(API unmappedReasons) = API unmappedStreams
source/type filters may derive filtered_out_accepted_evidence
sum(current-view reasons) = current-view unmapped streams
country selection does not alter unmapped accounting
```

Placement invariants:

- candidate-only evidence does not map;
- tag-only geography does not map;
- language does not map;
- category does not map;
- nationality/birthplace does not become home/current placement;
- organization/event-broadcast channels do not map as people;
- conflicting accepted countries remain unmapped;
- provenance remains separated by source;
- current-location is not derived from home/origin evidence;
- no demo geography substitutes for failed real data;
- Twitch and Kick geography remain separated.

## Completed population-filter and coverage-decision gates

PR #981 added server-side population selection; PR #983 fixed ready-response semantics; verification-only PR #982 measured production.

PR #982 retained baseline:

```text
workflow run      32583205617
successful job    97056168203
artifact          9478398925
snapshot updated  2026-08-22T16:00:18.854Z
300 streams
1,358,840 viewers
0 mapped streams
0 mapped viewers
```

Top 20/50/100/300, viewer thresholds and major-category slices all had zero mapped streams. Population narrowing therefore did not solve geographic coverage.

## Completed supported-source remediation

Verification-only PR #985 sampled 300 current Twitch streams through supported read-only Twitch surfaces in a non-production Worker preview:

```text
profile descriptions          280
profile candidates              0
strong-title candidates         0
tag-only candidates             3
unknown                        297
current-location candidates      0
```

The Twitch tags were candidate triggers only. They were not accepted.

Bounded manual review produced three independent explicit `official_external` records, implemented in PR #986:

```text
payo     CA / Canada   declared_location
wirtual  NO / Norway   declared_location
knirpz   DE / Germany  declared_location
```

Same-sample maximum from the native candidate lane is `3 / 300 = 1.00%`.

## Retained production verification before fixed-sample expansion

Verification-only PR #987 final successful read-only production audit:

```text
workflow run          32587130892
successful job        97065114836
artifact              9479337312
snapshot updatedAt    2026-08-22T17:10:17.378Z
observed streams      300
observed viewers      1,508,683
mapped streams        2
mapped percent        0.6667%
mapped viewers        12,402
mapped viewer percent 0.8220%
mapped countries      2
current-location      0
```

Mapped rows were Wirtual/Norway and Payo/Canada. Knirpz was not present in that live Top 300 snapshot.

## Completed fixed Top 20 external/manual review

Verification-only PR #989 captured one unbiased Top 20 identity sample at `2026-08-22T17:28:10.752Z` with one `/helix/streams` request, zero D1 writes and no production deploy.

Review result implemented in PR #990:

```text
sample identities                       20
sample viewers                     473,630
accepted placeable persons               4
excluded non-person identities           5
person-eligible identities              15
eligible persons without acceptance     11
accepted current-location                0
accepted country conflicts               0
```

Accepted placeable records:

```text
ibai        ES / Spain          official_external
papaplatte  DE / Germany        official_external
ohnepixel   NL / Netherlands    manual_review
hutchmf     US / United States  official_external
```

Measured yield:

```text
raw sample accepted coverage          20.00%
person-eligible accepted coverage     26.67%
accepted mapped viewers              134,791
viewer coverage                       28.4591%
```

Review minutes were not instrumented, so recurring review cost is not yet proven.

PR #990 also fixed an existing country-only projection gap. Internal reviewed evidence may retain Ibai/Sant Cugat, Papaplatte/Cologne and Knirpz/Berlin, but the current public API strips all region/city values until a separately accepted City gate.

## Current order

1. Freeze a reviewed-evidence maintenance policy covering source classes, precedence, conflicts, staleness/re-review, source changes, non-person reclassification, public country-only projection and review-time measurement.
2. Capture a second independent fixed Top 20 at a different observation time.
3. Review it under exactly the same policy and measure actual review minutes.
4. Compare sample overlap, raw/person-eligible/viewer coverage, source mix, conflicts, non-person share and review cost with #989.
5. Authorize recurring bounded reviewed-evidence maintenance only if replicated yield remains useful and measured manual cost is acceptable.
6. Keep City and Current Location/IRL blocked regardless of the country-coverage result until their own evidence gates are satisfied.
7. Audit and implement Kick separately.
8. Add location history/replay only after live semantics stabilize.

## Maintenance/replication boundary

Allowed:

- supported Twitch stream surface for a bounded fixed identity sample;
- self-controlled profiles and official/attributable external sources;
- manual review with source URL provenance;
- explicit review-time measurement;
- internally retained city evidence while public response remains country-only.

Not authorized:

- persistent unsupported Twitch panel/social crawling;
- inferred location from language/category/name/timezone/IP;
- nationality/birthplace-as-home/current inference;
- tag-only acceptance;
- automatic acceptance from search results;
- City/current-location activation;
- permanent acquisition/storage changes before the replication decision.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`

## Retained Twitch category rollout

The completed Twitch category/Heatmap rollout remains a historical accepted milestone:

- final seven-day audit accepted `2016 / 2016` expected slots;
- category-reference coverage was `0.995353`;
- PR #740 exposed Category + Top;
- PR #741 repaired the rejected 390px mobile overflow;
- accepted production SHA was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- no Kick category UI was authorized by the Twitch rollout.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Global invariants

- Provider-scoped identities remain provider-separated.
- No combined-provider geography, category totals or rankings unless separately specified and accepted.
- Twitch/Kick collectors remain on existing five-minute cadences unless a separate gate changes them.
- No retention expansion, backfill, D1/binding change, permanent acquisition expansion or production mutation is implied by UI/API work.
- Current-main documents and accepted contracts override cached handoffs and superseded draft PR documents.
