# Twitch Stream Map second fixed Top 20 replication — 2026-08-23

Status: bounded replication complete; recurring-cost gate not proven  
Provider: Twitch only  
Public placement scope: country only  
Production mutation during sample/review: none

## Purpose

This is the second fixed current Twitch Top 20 replication required by `stream-map-reviewed-evidence-maintenance-policy-v0.1.md` and `stream-map-top20-replication-plan-v0.1.md`.

The sample and review answer two separate questions:

1. does explicit attributable country evidence remain useful in a second unbiased Top 20 population;
2. is the manual review cost proven low enough to justify a separately scoped recurring-maintenance proposal.

The first question is measurable here. The second is **not proven**, because the original review-start timestamp was not durably recorded before research began in the prior thread. This audit does not invent a replacement timestamp.

No City, Current Location/IRL, Kick Map, persistent external crawler, collector cadence, D1 schema, retention or permanent acquisition change is authorized by this result.

## Stage A — fixed sample acquisition

Verification-only PR: `#995`  
Workflow run: `32612933797`  
Successful job: `97128705735`  
Artifact: `9486025639`  
Sample captured: `2026-08-23T02:28:43.300Z`

First sample `#989` captured: `2026-08-22T17:28:10.752Z`  
Seconds since first sample: `32,433`  
Interval: approximately 9 hours  
Required minimum: 6 hours  
Interval gate: **PASS**

Read-only acquisition boundary:

```text
token requests          1
/helix/streams requests 1
/helix/users requests   0
D1 writes               0
production deploy       no
```

The retained artifact contains only rank, Twitch user ID, login, display name and viewers. It does not retain title, tags, language, profile description or category.

The normal `Deploy Collector Workers` workflow also ran because the temporary audit PR touched the collector entrypoint. Run `32612933760` completed `verify` and `plan`; `deploy-twitch`, `deploy-kick` and `verify-remote-schema` were skipped. No production Worker deploy occurred.

Fixed sample:

```text
 1 dota2ti          72,710
 2 nix              60,587
 3 theburntpeanut   59,200
 4 dota2ti_ru       37,755
 5 ow_esports       32,574
 6 adinross         24,169
 7 stableronaldo    23,860
 8 xqc              18,818
 9 kato_junichi0817 18,571
10 lacy             17,524
11 ramzes           13,270
12 jasontheween     12,827
13 shroud           12,461
14 cinna            12,188
15 moonmoon         12,143
16 dota2ti_es       11,021
17 ddg              10,854
18 maximum          10,082
19 jerma985          9,830
20 loltyler1         9,735
```

Total sample viewers: `480,179`.

Overlap with #989:

```text
stableronaldo
ow_esports
```

Overlap count: `2 / 20`  
Overlap percent: `10.00%`

No refill or geography-based replacement was performed.

## Stage B — review-time instrumentation limitation

The accepted policy required the second replication to record `reviewStartedAt` immediately before external/manual research began.

The prior thread stated that the review clock had started, but no exact start timestamp was retained in a GitHub artifact, commit, issue, PR comment or other durable project record available during takeover. Recovery attempts did not produce an exact timestamp.

Therefore this audit records:

```text
reviewStartedAt             unavailable
reviewFinishedAt            2026-08-23T05:00:14.000Z
wallClockReviewMinutes      null / unproven
reviewedIdentities          20
acceptedIdentities          5
minutesPerReviewedIdentity  null / unproven
minutesPerAcceptedIdentity  null / unproven
```

Failed searches and source validation were not removed from the conceptual review burden; the issue is solely that the original start point cannot be reconstructed accurately.

The coverage result below must not be used to claim that the review-time threshold passed.

## Stage C — bounded review ledger

All identities remained within the frozen maximum of five distinct search attempts per identity. Search snippets and aggregators were used only as discovery aids. Nationality, birthplace, language, timezone, category, handle/name cues, organization HQ, event venue and temporary travel were not accepted as placement evidence.

| Rank | Login | Viewers | Entity kind | Outcome | Country | Retained city | Claim | Source | Review note |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | dota2ti | 72,710 | event_broadcast | non-person | — | — | — | — | Existing reviewed event-broadcast classification retained. |
| 2 | nix | 60,587 | person | no evidence | — | — | — | — | Spain rental/current-presence material did not establish a stable residence/base; aggregator Russia claim rejected. |
| 3 | theburntpeanut | 59,200 | person | no evidence | — | — | — | — | Current attributable interview established identity/home-room context but no explicit geography. |
| 4 | dota2ti_ru | 37,755 | event_broadcast | non-person | — | — | — | — | Existing reviewed event-broadcast classification retained. |
| 5 | ow_esports | 32,574 | event_broadcast | non-person | — | — | — | — | Existing reviewed event-broadcast classification retained. |
| 6 | adinross | 24,169 | person | accepted | US | Miami | home_base | official_external | School of Hard Knocks interview identifies the Miami mansion and Adin directly confirms it is his house. |
| 7 | stableronaldo | 23,860 | person | no evidence | — | — | — | — | Current material discussed possible California moves/travel but did not unambiguously establish a stable current base under the frozen rule. |
| 8 | xqc | 18,818 | person | accepted | US | Miami | declared_location | manual_review | Reviewed direct-self-statement transcript explicitly confirms living in Miami. |
| 9 | kato_junichi0817 | 18,571 | person | no evidence | — | — | — | — | Chiba origin and Tokyo/current-stream material were not converted into residence evidence. |
| 10 | lacy | 17,524 | person | accepted | US | Los Angeles | home_base | manual_review | Reviewed direct-self-statement transcript explicitly describes Los Angeles as home while away in San Francisco. |
| 11 | ramzes | 13,270 | person | no evidence | — | — | — | — | Monaco wording was hypothetical; no attributable current residence/base was accepted. |
| 12 | jasontheween | 12,827 | person | no evidence | — | — | — | — | Los Angeles IRL/current-presence material was not treated as residence/home evidence. |
| 13 | shroud | 12,461 | person | no evidence | — | — | — | — | Available recent transcript material was ambiguous/multi-speaker and did not yield an explicit attributable residence claim. |
| 14 | cinna | 12,188 | person | accepted | US | Austin | declared_location | manual_review | Reviewed direct-self-statement transcript rejects moving from Austin and explicitly affirms Austin as her chosen base. |
| 15 | moonmoon | 12,143 | person | no evidence | — | — | — | — | Current aggregator location claim was rejected; no qualifying direct/attributable source was accepted. |
| 16 | dota2ti_es | 11,021 | event_broadcast | non-person | — | — | — | — | The International Spanish broadcast channel; classified as event broadcast, not a person. |
| 17 | ddg | 10,854 | person | accepted | US | Los Angeles | home_base | official_external | Current Complex coverage identifies DDG and his Los Angeles mansion in an attributable interview context. |
| 18 | maximum | 10,082 | person | no evidence | — | — | — | Older affiliation/profile material did not provide a current qualifying residence/base claim. |
| 19 | jerma985 | 9,830 | person | no evidence | — | — | — | Las Vegas material found was community/older evidence beyond the accepted freshness boundary; no current qualifying claim accepted. |
| 20 | loltyler1 | 9,735 | person | no evidence | — | — | — | Missouri wording found was origin/from language, not an explicit current residence/base claim. |

### Accepted evidence provenance

#### `adinross`

```text
source       official_external
source URL   https://www.linkedin.com/posts/the-school-of-hard-knocks-llc_adin-ross-made-30-million-in-a-year-then-activity-7454650605471469569-jrI2
country      US / United States
city         Miami (retained evidence only)
claim kind   home_base
confidence   explicit
status       accepted
```

The attributable interview is presented as filmed at Adin Ross's Miami mansion and the transcript directly confirms the house belongs to him.

#### `xqc`

```text
source       manual_review
source URL   https://www.twitchtranscripts.com/channel/xqc/2768136341
source date  2026-05-09
country      US / United States
city         Miami (retained evidence only)
claim kind   declared_location
confidence   explicit
status       accepted
```

A reviewed transcript of a direct conversation explicitly asks whether xQc lives in Miami and records his affirmative response.

#### `lacy`

```text
source       manual_review
source URL   https://www.twitchtranscripts.com/channel/lacy/2690834581
source date  2026-02-06
country      US / United States
city         Los Angeles (retained evidence only)
claim kind   home_base
confidence   explicit
status       accepted
```

While temporarily in San Francisco, Lacy explicitly distinguishes that trip from going back home to Los Angeles.

#### `cinna`

```text
source       manual_review
source URL   https://www.twitchtranscripts.com/channel/cinna/2690801644
source date  2026-02-06
country      US / United States
city         Austin (retained evidence only)
claim kind   declared_location
confidence   explicit
status       accepted
```

The reviewed direct-self-statement transcript asks whether she will move from Austin; she rejects the move and explicitly affirms Austin.

#### `ddg`

```text
source       official_external
source URL   https://www.complex.com/music/a/jaelaniturnerwilliams/ddg-loses-100k-dollars-tour-money
source date  2026-05-30
country      US / United States
city         Los Angeles (retained evidence only)
claim kind   home_base
confidence   explicit
status       accepted
```

The current attributable publication identifies DDG and describes his Los Angeles mansion in the context of a filmed house tour.

All retained cities remain internal evidence only. The public Stream Map continues to return country-only geography.

## Stage D — replication metrics

Final classification:

```text
sample identities                         20
sample viewers                       480,179
sample overlap with #989                   2
sample overlap percent                 10.00%
accepted placeable persons                  5
excluded non-person identities              4
person-eligible identities                 16
eligible persons without acceptance        11
accepted country conflicts                  0
accepted current-location records           0
official_external accepted                  2
manual_review accepted                       3
mapped viewers                          83,553
```

Measured yield:

```text
raw accepted coverage                 5 / 20 = 25.00%
person-eligible accepted coverage     5 / 16 = 31.25%
mapped viewer coverage           83,553 / 480,179 = 17.4004%
non-person viewer share          154,060 / 480,179 = 32.0839%
```

Comparison with #989:

```text
                                 #989 first sample    #995 replication
sample identities                       20                  20
sample viewers                     473,630             480,179
accepted persons                         4                   5
non-person identities                    5                   4
person-eligible                         15                  16
eligible unmapped                       11                  11
raw accepted coverage               20.00%              25.00%
person-eligible coverage            26.67%              31.25%
mapped viewer coverage              28.4591%            17.4004%
official_external                         3                   2
manual_review                              1                   3
current-location                           0                   0
country conflicts                          0                   0
review cost                         uninstrumented        unproven start
```

The second sample reproduced useful raw/person-eligible country-evidence yield. Viewer coverage was lower because all five accepted rows in the replication were US channels lower in this particular Top 20 ordering, while the four accepted #989 rows included several higher-ranked streams.

## Stage E — frozen recurring-maintenance gate

The precommitted gate is evaluated one threshold at a time:

| Threshold | Required | Result | Status |
| --- | ---: | ---: | --- |
| Raw accepted country coverage | >= 10% | 25.00% | PASS |
| Person-eligible accepted country coverage | >= 15% | 31.25% | PASS |
| Wall-clock review time | <= 120 min / 20 | unavailable | **UNPROVEN** |
| Minutes per accepted identity | <= 30 min | unavailable | **UNPROVEN** |
| Accepted evidence quality | 100% explicit attributable | 5 / 5 | PASS |
| Silent country conflicts | 0 | 0 | PASS |

Overall recurring-maintenance proposal gate: **NOT PASSED / NOT AUTHORIZED**.

Reason: the frozen rule requires every threshold to pass. Two cost thresholds cannot be proven because the review start time was not durably captured before research began. Coverage success cannot substitute for missing cost instrumentation.

This outcome does **not** reject reviewed evidence as a useful country-evidence lane. It means the two-sample record still does not authorize recurring acquisition. Existing reviewed evidence remains curated under the accepted 180-day re-review target / 365-day hard-stale policy.

## Stage F — implementation boundary

The five accepted records and `dota2ti_es` non-person classification are implemented through a dedicated reviewed-evidence PR.

Regression coverage fixes the exact #995 sample result:

```text
mapped streams             5
excluded non-person        4
eligible unmapped         11
mapped viewers        83,553
non-person viewers   154,060
mapped countries           1
current-location           0
official_external          2
manual_review              3
```

Country-only public projection remains mandatory:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No collector, D1, cadence, retention or acquisition runtime change is part of the implementation.

## Decision

1. The second unbiased fixed Top 20 confirms that bounded explicit external/manual review can again produce useful country coverage: `25.00%` raw and `31.25%` person-eligible.
2. The strict recurring review-cost requirement remains unproven because the exact pre-research start timestamp is missing.
3. Therefore **do not authorize recurring bounded acquisition from this two-sample gate**.
4. Do not introduce a persistent crawler or automatic search-result acceptance.
5. Keep City, Current Location/IRL and Kick Map blocked behind their own separate gates.
6. Continue honoring country-only public projection and evidence staleness/re-review rules.
7. If recurring maintenance is reconsidered later, run a new independently clocked bounded cost measurement rather than retroactively repairing this missing timestamp.

## Verification-only PR closeout

PR #995 is temporary verification-only infrastructure. After this audit and reviewed-evidence implementation are retained on main and checks are green, #995 must be closed without merge.
