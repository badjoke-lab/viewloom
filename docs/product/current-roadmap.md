# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone: Twitch Stream Map — fixed Top 20 external evidence yield

Current accepted implementation baseline:

```text
main b0a99f480ec4f2320af09aa0329b044f8eeee3eb
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
- supported-source remediation candidate audit — #985, verification-only;
- three bounded reviewed `official_external` acceptances — #986;
- post-#986 read-only production verification — #987, verification-only.

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`

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

Verification-only PR #985 used only supported Twitch surfaces in a non-production Worker version preview.

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

Knirpz also retains Berlin in the reviewed evidence record, but this milestone does not activate City placement.

PR #986 added only those three records and regression coverage. It did not change placement rules, collector behavior, D1, cadence, retention or acquisition runtime.

Same-sample direct ceiling from this native-candidate lane:

```text
3 accepted / 300 sample streams = 1.00%
```

This proves the review method is valid but the native candidate trigger is too sparse to produce useful geographic coverage by itself.

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

`knirpz` was not in the live mapped Top 300 snapshot. The public model kept city/region arrays empty for the live mapped rows and current-location coverage remained zero.

This is the first retained production snapshot after remediation with reviewed evidence overlapping the current live Top 300, but coverage remains below 1% by streams.

## Current gate: fixed Top 20 official_external / manual_review yield experiment

The next measurement deliberately does **not** depend on Twitch geographic tags/title/profile candidate extraction.

Question:

> Among a fixed current Top 20, how many streamers have explicit attributable self/official external location evidence that can be accepted without inference?

Execution boundary:

1. obtain one Top 20 identity sample read-only from the supported Twitch stream surface;
2. retain only the identities needed for the bounded review artifact, not a permanent raw crawl;
3. review all 20 consistently for explicit self-controlled or official external location statements;
4. record `official_external` versus `manual_review` provenance separately;
5. record explicit country, explicit city, current location, no-location, conflicts and review burden;
6. make no permanent acquisition pipeline change during the experiment.

Required output:

```text
sample size
accepted country evidence
accepted city evidence
current-location evidence
no explicit location evidence
source provenance
review burden
conflicts
same-sample mapped percentage
```

Decision rule:

- if fixed-sample explicit evidence materially raises coverage at acceptable bounded review cost, design a separately gated update/acquisition model;
- if it remains sparse or manual cost is too high, stop geography expansion and keep the Map honest;
- do not weaken evidence rules in either case.

## Following gates — blocked on fixed Top 20 result

1. acquisition/update model only if the fixed Top 20 experiment justifies it;
2. reliable city grouping only after broader accepted city coverage exists;
3. current-location freshness/expiry only if current-location evidence becomes useful;
4. IRL-oriented view only after useful current-location coverage exists;
5. separate Kick source audit and implementation;
6. location history/replay only after live semantics stabilize.

## Stream Map hard boundaries

- No language, timezone, name, category or IP inference for placement.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No current-location claim from home/origin evidence.
- No City rollout from one retained city record.
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
