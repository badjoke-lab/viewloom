# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone: Twitch Stream Map — reviewed-evidence maintenance policy + fixed Top 20 replication

Current accepted implementation baseline:

```text
main 27b1fb5fbedb9a3d5bf1923a941e7e657c16a5a1
```

The Twitch Stream Map has completed:

- source/yield audit — #964 / #965 / #966;
- entity/claim eligibility and initial reviewed evidence — #971;
- real latest-snapshot join — #972;
- public route, MapLibre, source/type filters and provenance badges — #974;
- read-only production route/API verification — #975, closed without merge;
- country selection/drilldown — #977;
- reason-aware Unmapped analysis — #979;
- population-filter contract — #980;
- server-side Top-N/min-viewer/category population filters — #981;
- ready-response population semantics repair — #983;
- production population coverage decision — #982, closed without merge;
- supported-source remediation candidate audit — #985, closed without merge;
- three bounded reviewed `official_external` acceptances — #986;
- post-#986 read-only production verification — #987, closed without merge;
- unbiased fixed Top 20 identity sample — #989, verification-only;
- fixed Top 20 reviewed evidence + country-only projection repair — #990.

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`

## Current public behavior

Population order:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side placement
-> evidence source/type filters
-> country drilldown
```

Public controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred
```

Evidence sources remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location types remain distinct:

```text
home_base
declared_location
current_location
```

Placement remains accepted-evidence-only. Language/category/name/timezone/IP never creates geography. Twitch and Kick remain separate.

Country-only public boundary after #990:

```text
reviewed evidence may retain region/city internally
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

City remains a separate blocked stage.

## Completed population coverage decision

Verification-only PR #982 showed that population narrowing alone cannot repair the evidence gap.

Baseline production snapshot:

```text
updatedAt        2026-08-22T16:00:18.854Z
observed streams 300
observed viewers 1,358,840
mapped streams   0
mapped viewers   0
```

Top 20/50/100/300, viewer thresholds and major-category slices all had zero mapped streams.

## Completed supported-source remediation

Verification-only PR #985 used supported Twitch surfaces in a non-production Worker version preview.

```text
sample streams                300
profile descriptions          280
profile candidates              0
strong-title candidates         0
tag-only candidates             3
unknown                        297
current-location candidates      0
```

The three Twitch tags were not accepted. They only bounded manual review.

Manual review accepted three independently attributable external records:

```text
payo     CA / Canada   official_external   declared_location
wirtual  NO / Norway   official_external   declared_location
knirpz   DE / Germany  official_external   declared_location
```

Knirpz retains Berlin internally, but City placement remains blocked.

Same-sample direct ceiling from this native-candidate lane:

```text
3 accepted / 300 sample streams = 1.00%
```

## Production verification after remediation

Verification-only PR #987 succeeded after #986:

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

Live mapped remediation records:

```text
wirtual  NO / Norway  9,816 viewers  official_external
payo     CA / Canada  2,586 viewers  official_external
```

This confirmed reviewed evidence was active but also showed that the Twitch-native candidate lane remained too sparse.

## Completed fixed Top 20 external/manual yield experiment

Verification-only PR #989 captured one fixed current Top 20 without selecting for geography candidates.

```text
capturedAt                       2026-08-22T17:28:10.752Z
sample identities               20
sample viewers             473,630
accepted placeable persons       4
excluded non-person identities   5
person-eligible identities      15
eligible persons unmapped       11
accepted current-location        0
accepted country conflicts       0
```

Accepted records implemented in #990:

```text
ibai        ES / Spain          official_external  declared_location
papaplatte  DE / Germany        official_external  declared_location
ohnepixel   NL / Netherlands    manual_review      declared_location
hutchmf     US / United States  official_external  declared_location
```

Retained city evidence that remains hidden from the country-only public API:

```text
ibai        Sant Cugat del Valles
papaplatte  Cologne
knirpz      Berlin
```

Measured fixed-sample yield:

```text
raw accepted coverage            4 / 20 = 20.00%
person-eligible accepted         4 / 15 = 26.67%
mapped viewers                  134,791
viewer coverage                         28.4591%
source official_external              3
source manual_review                   1
```

This is materially stronger than the native-candidate lane, so bounded external/manual review is worth preserving as a country-evidence method. One sample is not enough to establish temporal stability or operating cost.

Review minutes were not instrumented. The experiment therefore cannot yet support a recurring-cost claim.

## PR #990 boundary repair

During self-audit, #990 found that retained city/region evidence could have leaked through the public API if a reviewed streamer re-entered the live population. The PR added an explicit country-only public projection before merge.

The regression suite now verifies:

- internal city values remain retained;
- public `location.regions` and `location.cities` are empty;
- public evidence `region` and `city` are null;
- country mapping and provenance remain intact;
- current-location remains zero unless separately supported;
- the exact #989 sample yields mapped=4, non-person=5, eligible-unmapped=11.

#990 passed Typecheck, Build, all Stream Map gates and all Heatmap regression gates, plus Development policy.

## Current gate: reviewed-evidence maintenance policy + fixed Top 20 replication

Question:

> Can the 20% raw / 26.67% person-eligible fixed-sample yield be reproduced at a different observation time under an explicit maintenance policy, with measured manual cost?

First freeze the maintenance policy. It must define:

1. review population and sample selection;
2. accepted and rejected source classes;
3. source precedence and attribution requirements;
4. accepted-country conflict handling;
5. stale evidence and re-review intervals;
6. source deletion/change and evidence withdrawal handling;
7. non-person reclassification handling;
8. review-time measurement;
9. country-only public projection as a hard invariant;
10. no City/current-location activation by implication;
11. no persistent crawler by implication.

Then capture one second fixed Top 20 at a different observation time and apply the same rules.

Required comparison against #989:

```text
sample overlap
accepted raw coverage
accepted person-eligible coverage
viewer coverage
non-person share
source mix
conflicts
current-location yield
review minutes / reviewed identity
review minutes / accepted identity
```

Decision rule:

- if the replicated yield remains useful and measured review cost is acceptable, authorize a separately bounded recurring reviewed-evidence maintenance process;
- if the yield collapses or review cost is excessive, keep evidence maintenance curated/occasional and preserve honest Unmapped coverage;
- do not weaken evidence rules or substitute automated inference in either case.

## Following gates — blocked on maintenance/replication result

1. bounded recurring reviewed-evidence maintenance only if replication justifies it;
2. reliable city grouping only after broader accepted city coverage and a separate City spec/gate;
3. current-location freshness/expiry only if current-location evidence becomes useful;
4. IRL-oriented view only after useful current-location coverage exists;
5. separate Kick source audit and implementation;
6. location history/replay only after live semantics stabilize.

## Stream Map hard boundaries

- No language, timezone, name, category or IP inference for placement.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No nationality/birthplace-as-current/home inference.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No current-location claim from home/origin evidence.
- No City rollout from retained city evidence.
- No public region/city response before a separate City gate.
- No unsupported persistent external/social/panel crawler merely to increase coverage.
- No language population UI until an accepted retained-data contract supports it.
- No D1/schema/cadence/retention/permanent-acquisition change without a separate accepted gate.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted:

- accepted seven-day window completed at `2026-08-07T17:00:00.000Z`;
- `2016 / 2016` expected slots accepted;
- category-reference coverage `0.995353`;
- PR #740 published Category + Top controls;
- PR #741 repaired the 390px mobile overflow;
- accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- Twitch/Kick collector cadences remain five minutes;
- Kick category UI was not authorized by the Twitch rollout.
