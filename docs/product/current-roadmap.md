# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone state

**Twitch Stream Map — fresh bounded reviewed-evidence review-cost measurement: PREPARATION ACTIVE.**

Current accepted implementation baseline:

```text
main 276705a6db11f2246c82d7a7ed3639dcd74fe192
```

Current governance:

```text
Parent cost-measurement gate  Issue #998
Preparation package           Issue #999
Sample not before             2026-08-23T08:28:43.300Z
Asia/Tokyo                    2026-08-23 17:28:43.300 JST
Recurring acquisition         not authorized
City                          not authorized
Current Location / IRL        not authorized
Kick Map                      not authorized
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
- first unbiased fixed Top 20 identity sample — #989, verification-only / closed without merge;
- first fixed Top 20 reviewed evidence + country-only projection repair — #990;
- reviewed-evidence maintenance policy freeze — #994;
- second unbiased fixed Top 20 identity sample — #995, verification-only / closed without merge;
- second fixed Top 20 reviewed evidence + retained replication audit — #996;
- replication closeout source-of-truth synchronization — #997.

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-top20-replication-plan-v0.1.md`
- `docs/product/stream-map-review-cost-measurement-plan-v0.1.md`
- `docs/audits/twitch-stream-map-review-cost-measurement-contract-v0.1.json`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-replication-2026-08-23.md`

## Active review-cost measurement gate — #998 / #999

The only unproven part of the reviewed-evidence maintenance decision is recurring manual review cost. Coverage and evidence-quality thresholds passed in #995/#996, but the exact pre-research `reviewStartedAt` was not durably retained, so cost remained unproven and recurring acquisition remained unauthorized.

The new measurement closes only that instrumentation gap.

### Fresh-population rule

Do not deliberately reuse #989 or #995 as the review population. Prior research would create familiarity bias and make the measured operating cost artificially low.

Use one new unbiased current Twitch Top 20 sample after the hard not-before time:

```text
2026-08-23T08:28:43.300Z
```

This is exactly six hours after the #995 sample.

### Timing rule

Before the first external/manual research action, durably retain exact UTC `reviewStartedAt`.

After the twentieth identity reaches a terminal outcome, durably retain exact UTC `reviewFinishedAt`.

Do not estimate or reconstruct either timestamp later. A missing/late start timestamp makes the measurement invalid rather than merely failing a threshold.

### Frozen limits

```text
sample identities                         exactly 20
token requests                            <= 1
/helix/streams requests                   <= 1
/helix/users requests                     = 0
D1 writes                                 = 0
production deploy                         false
search attempts per identity              <= 5
wall-clock review                         <= 120 minutes
minutes per accepted identity             <= 30 minutes
raw accepted country coverage             >= 10%
person-eligible accepted country coverage >= 15%
accepted evidence quality                 100% explicit attributable
silent country conflicts                  0
```

Passing this measurement may authorize only a separate recurring-maintenance proposal. It does not authorize recurring execution.

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

Placement remains accepted-evidence-only. Language/category/name/timezone/IP never creates geography. Nationality and birthplace do not become residence/base. Twitch and Kick remain separate.

Country-only public boundary:

```text
reviewed evidence may retain region/city internally
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

City remains a separate blocked stage.

## First fixed Top 20 baseline — #989 / #990

```text
capturedAt                       2026-08-22T17:28:10.752Z
sample identities               20
sample viewers             473,630
accepted placeable persons       4
excluded non-person identities   5
person-eligible identities      15
eligible persons unmapped       11
raw accepted coverage        20.00%
person-eligible accepted     26.67%
mapped viewer coverage       28.4591%
official_external                 3
manual_review                      1
current-location                   0
country conflicts                  0
review cost             not instrumented
```

Accepted records:

```text
ibai        ES / Spain          official_external  declared_location
papaplatte  DE / Germany        official_external  declared_location
ohnepixel   NL / Netherlands    manual_review      declared_location
hutchmf     US / United States  official_external  declared_location
```

## Second fixed Top 20 replication — #995 / #996

Verification-only PR #995 captured the second sample at `2026-08-23T02:28:43.300Z`, 32,433 seconds after #989. Acquisition used one `/helix/streams` request, zero `/helix/users` requests, zero D1 writes and no production deploy.

```text
sample identities                       20
sample viewers                     480,179
overlap with #989                         2
overlap percent                       10.00%
accepted placeable persons               5
excluded non-person identities           4
person-eligible identities              16
eligible persons unmapped               11
raw accepted coverage                25.00%
person-eligible accepted             31.25%
mapped viewer coverage               17.4004%
official_external                         2
manual_review                              3
current-location                           0
country conflicts                          0
```

Accepted records implemented in #996:

```text
adinross  US / United States  official_external  home_base
xqc       US / United States  manual_review      declared_location
lacy      US / United States  manual_review      home_base
cinna     US / United States  manual_review      declared_location
ddg       US / United States  official_external  home_base
```

Retained city evidence remains internal only:

```text
adinross  Miami
xqc       Miami
lacy      Los Angeles
cinna     Austin
ddg       Los Angeles
```

`dota2ti_es` was classified as `event_broadcast` and is not placed as a person.

## Replication decision

The frozen recurring-maintenance decision required every threshold to pass:

```text
raw accepted country coverage             >= 10%   PASS
person-eligible accepted country coverage >= 15%   PASS
wall-clock review time                     <= 120m  UNPROVEN
minutes per accepted identity              <= 30m   UNPROVEN
accepted evidence quality                  100%     PASS
silent country conflicts                   0        PASS
```

The prior review thread did not durably retain the exact pre-research `reviewStartedAt`. The project does not reconstruct or invent that value after the fact.

Therefore:

**Recurring reviewed-evidence acquisition is NOT AUTHORIZED from the two-sample gate.**

The replication does establish that bounded explicit external/manual review remains useful for country coverage, but it does not establish recurring operating cost.

## Current roadmap boundary

Allowed now:

- prepare and verify the #998 cost-measurement contract;
- after the not-before time, use separately scoped verification-only infrastructure to capture one fresh Top 20;
- retain and curate already accepted reviewed evidence;
- apply the accepted 180-day re-review target and 365-day hard-stale boundary;
- keep explicit provenance and conflict handling;
- keep honest Unmapped states;
- retain publicly declared city/region internally while stripping them from the public API.

Not authorized now:

- recurring/persistent external acquisition;
- automatic search-result acceptance;
- City public grouping;
- Current Location activation;
- IRL mode;
- Kick Map rollout;
- Twitch/Kick geographic aggregation;
- collector cadence changes;
- D1 schema/binding changes;
- retention expansion;
- permanent acquisition changes.

## Later gates — each requires separate acceptance

1. **Recurring reviewed-evidence maintenance proposal**, only if the fresh cost measurement passes every frozen threshold.
2. **City evidence/spec gate**, only if accepted city coverage is broad enough to justify it. Internal retained cities alone do not authorize public City fields.
3. **Current Location freshness/expiry gate**, only if explicit current-location evidence becomes useful.
4. **IRL-oriented view gate**, only after useful Current Location coverage exists.
5. **Separate Kick source audit and implementation gate**. Twitch evidence acceptance does not transfer to Kick.
6. **Location history/replay gate**, only after live location semantics remain stable.

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
- No automatic search-result acceptance.
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

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete.

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
