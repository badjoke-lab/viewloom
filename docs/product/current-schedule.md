# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-23

```text
Current program Twitch Stream Map
Current stage Reviewed-evidence maintenance policy + fixed Top 20 replication
Accepted main 27b1fb5fbedb9a3d5bf1923a941e7e657c16a5a1
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter decision frozen PR #980
Population filters complete PR #981
Ready-response population semantics fixed PR #983
Population coverage production audit complete PR #982 verification-only / closed without merge
Coverage remediation candidate audit complete PR #985 verification-only / closed without merge
Reviewed evidence remediation complete PR #986
Reviewed evidence production verification complete PR #987 verification-only / closed without merge
Fixed Top 20 sample complete PR #989 verification-only / close without merge after retained audit merge
Fixed Top 20 reviewed evidence + country-only projection repair complete PR #990
Production route/API verification complete PR #975 closed without merge
Twitch Map public route /twitch/map/
Twitch Map real API /api/twitch-stream-map
Kick Map not authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Completed Stream Map execution

1. Audited Twitch location evidence source availability and persistence boundaries in PR #964.
2. Added a bounded read-only live probe in PR #965.
3. Added title/tag candidate extraction and rejected future/planned travel wording in PR #966.
4. Ran temporary non-production profile/external acquisition work and closed #970 without merge.
5. Accepted person/entity and claim eligibility rules plus retained A4.1 evidence in PR #971.
6. Added the read-only latest-snapshot + reviewed-evidence join in PR #972.
7. Added `/twitch/map/`, MapLibre, six source filters, three type filters, provenance badges and live country markers in PR #974.
8. Verified the deployed production route and API through read-only verification-only PR #975, then closed it without merge.
9. Added true country selection and drilldown in PR #977.
10. Added reason-aware Unmapped analysis and reason reconciliation in PR #979.
11. Audited population-filter data availability and froze ordering/contracts in PR #980.
12. Added public server-side population filters in PR #981.
13. Verification-only PR #982 exposed a ready-response semantics omission; PR #983 fixed the response contract without changing placement/population logic.
14. PR #982 completed the production population-coverage decision and was closed without merge.
15. Verification-only PR #985 sampled supported Twitch sources for coverage remediation: 300 streams, 280 profile descriptions, 0 profile candidates, 0 strong-title candidates, 3 tag-only candidates, 297 unknown.
16. Bounded manual review of the three #985 candidates accepted three independent `official_external` records: Payo -> Canada, Wirtual -> Norway, Knirpz -> Germany with Berlin retained as evidence only.
17. PR #986 added only those three reviewed records plus live-join regression coverage and merged as `b0a99f480ec4f2320af09aa0329b044f8eeee3eb`.
18. PR #986 final Web checks passed Typecheck, Build, Stream Map live-join/source-filter/country-drilldown/Unmapped/population-filter gates and all Heatmap regressions.
19. Verification-only PR #987 confirmed the reviewed evidence in production with no writes. Retained audit: `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`.
20. Verification-only PR #989 captured one unbiased current Top 20 identity sample with one supported `/helix/streams` request and no production mutation.
21. All 20 identities were reviewed consistently. Four received accepted placeable evidence, five were classified non-person, and eleven person identities remained without accepted attributable location evidence.
22. PR #990 implemented the four accepted records and three new non-person classifications, added an exact fixed-sample regression verifier, and repaired the country-only public projection boundary before merge.
23. PR #990 merged as `27b1fb5fbedb9a3d5bf1923a941e7e657c16a5a1`; retained fixed-sample audit: `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`.

## Accepted evidence and drilldown semantics

```text
Sources: OR within selected sources
Types:   OR within selected types
Across evidence dimensions: Sources AND Types
No selected source/type: All accepted
Country selection: drilldown only; never creates or changes accepted evidence
Selected country + evidence filters: country AND active evidence-filter result
Selected country with zero matches: retain selection and show explicit zero state
```

Exact source vocabulary:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Exact type vocabulary:

```text
home_base
declared_location
current_location
```

## Accepted population ordering

```text
latest real Twitch Top 300 snapshot
-> overall Top N
-> minimum-viewer threshold
-> category
-> server-side placement gate
-> client-side evidence source/type filters
-> country drilldown
```

Public controls:

```text
Top N        20 | 50 | 100 | 300
Min viewers  any | 100 | 500 | 1,000 | 5,000 | 10,000
Category     all | one observed Twitch category
Language     deferred; current permanent snapshot does not retain it
```

`Top 100 + category X` means category-X rows inside the overall current Top 100. It does not refill from ranks 101-300.

Population API rules accepted in PR #981/#983:

- population selection occurs in `/api/twitch-stream-map` before placement;
- category refs are reconstructed against their original snapshot row index before Top-N slicing;
- `category=all` retains rows with missing category;
- unknown/unavailable selected categories use explicit zero states;
- mapped + unmapped equals the selected population;
- API unmapped-reason totals equal selected-population unmapped count;
- ready responses expose `populationFilterBeforeEvidenceFilter=true`;
- ready responses expose `languageUsedForPopulationFiltering=false`;
- source/type filters happen after population selection;
- country remains drilldown-only.

## Completed production coverage decision

Verification-only PR #982 measured production after PR #981/#983.

```text
workflow run      32583205617
successful job    97056168203
artifact          9478398925
snapshot updated  2026-08-22T16:00:18.854Z
Top 300 streams   300
Top 300 viewers   1,358,840
mapped streams    0
mapped viewers    0
```

Top 20/50/100/300, >=1k/5k/10k viewers and major-category slices all returned zero mapped streams. Population narrowing therefore did not solve geographic coverage.

## Completed bounded candidate remediation

Verification-only PR #985:

```text
workflow run                  32583840691
successful job                97057120474
artifact                      9478499570
sample streams                300
profile descriptions          280
profile candidates              0
strong-title candidates         0
tag-only candidates             3
unknown                        297
current-location candidates      0
```

Candidate-only Twitch geography remained unaccepted. Manual review produced three independently explicit external records:

```text
payo     CA / Canada   official_external   declared_location
wirtual  NO / Norway   official_external   declared_location
knirpz   DE / Germany  official_external   declared_location
```

Knirpz also has Berlin retained in reviewed evidence, but the current public Map remains country-level. The city value is not activated by this gate.

Same-sample maximum direct improvement from this candidate lane is `3 / 300 = 1.00%`.

## Latest retained production observation before fixed-sample expansion

Verification-only PR #987 final successful production audit:

```text
workflow run             32587130892
successful job           97065114836
artifact                 9479337312
updatedAt                2026-08-22T17:10:17.378Z
observedStreams          300
observedViewers          1508683
mappedStreams            2
unmappedStreams          298
mappedPercent            0.006667
mappedViewers            12402
mappedViewerPercent      0.00822
mappedCountryCount       2
currentLocationStreams   0
excludedNonPersonStreams 2
noReviewedEvidence       296
```

Mapped rows in that live snapshot:

```text
wirtual  9816 viewers  NO / Norway  official_external  declared_location
payo     2586 viewers  CA / Canada  official_external  declared_location
```

`knirpz` was not present as a live mapped row in that timestamped Top 300 snapshot.

## Completed fixed Top 20 external/manual yield experiment

Verification-only PR #989 captured a fixed sample at `2026-08-22T17:28:10.752Z`.

```text
sample identities                 20
sample viewers               473,630
accepted placeable persons         4
excluded non-person identities     5
person-eligible identities        15
eligible persons unmapped         11
mapped viewers               134,791
accepted current-location          0
accepted country conflicts         0
```

Accepted records implemented in PR #990:

```text
ibai        ES / Spain         official_external  declared_location
papaplatte  DE / Germany       official_external  declared_location
ohnepixel   NL / Netherlands   manual_review      declared_location
hutchmf     US / United States official_external  declared_location
```

Retained but not publicly exposed city values:

```text
ibai        Sant Cugat del Valles
papaplatte  Cologne
knirpz      Berlin (pre-existing reviewed evidence)
```

Measured yield:

```text
raw sample mapped coverage        4 / 20 = 20.00%
person-eligible mapped coverage   4 / 15 = 26.67%
mapped viewer coverage                    28.4591%
```

Review minutes were not instrumented, so recurring operating cost is not yet proven.

PR #990 also repaired the country-only public boundary. Until a separate City gate is accepted:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

Reviewed evidence may retain city/region internally for future gated use.

## Current order

### 1. Reviewed-evidence maintenance policy + fixed Top 20 replication — CURRENT

The fixed Top 20 experiment proves that bounded `official_external` / `manual_review` review can materially improve country coverage compared with Twitch-native candidate triggers. It does not yet prove stable yield or acceptable recurring review cost.

Next steps:

1. freeze a reviewed-evidence maintenance policy;
2. define accepted/rejected source classes and precedence;
3. define staleness/re-review and source-change handling;
4. define non-person reclassification handling;
5. require explicit review-time measurement;
6. retain the country-only public projection invariant;
7. capture a second fixed Top 20 at a different observation time;
8. apply the same review rules and compare overlap/yield/cost with #989.

Required replication report:

```text
sample size and overlap with #989
accepted country records
accepted retained city values
current-location records
non-person identities
no-explicit-location identities
source mix
conflicts
raw sample coverage
person-eligible coverage
viewer coverage
review minutes per reviewed identity
review minutes per accepted identity
```

Decision rule:

- authorize a bounded recurring reviewed-evidence maintenance process only if replicated yield remains useful and measured review cost is acceptable;
- otherwise keep reviewed evidence curated/occasional and preserve honest Unmapped coverage;
- neither outcome authorizes an unsupported persistent crawler.

### 2. Later stages — BLOCKED ON MAINTENANCE/REPLICATION GATE

- reliable city grouping only after broader accepted city evidence and a separate City spec/gate;
- current-location freshness/expiry only if current-location evidence becomes useful;
- IRL-oriented mode only if current-location coverage becomes useful;
- separate Kick source audit and implementation;
- history/replay after live semantics stabilize.

## Hard stops

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No nationality/birthplace-as-home/current inference.
- No non-person channel placement as a person.
- No silent conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo fallback geography.
- No current-location claim from home/origin evidence.
- No City rollout from retained city records.
- No public region/city fields before a separately accepted City gate.
- No unsupported persistent external/social/panel crawler.
- No client-only population filtering that cannot reconcile unmapped reasons.
- No language UI until an accepted snapshot persistence contract actually retains language.
- No collector cadence, retention, D1 schema, binding or permanent acquisition change without a separate accepted gate.
- No automatic Kick Map rollout from Twitch acceptance.
- Temporary PR #989 is verification-only and must close without merge after its retained audit is merged.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and should not be rewritten by Stream Map work.

## Historical category schedule anchors

The following strings are retained for completed category-rollout verifiers only; they are not the current execution schedule.

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
