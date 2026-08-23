# Twitch Stream Map fixed Top 20 external evidence yield — 2026-08-23

Status: accepted bounded measurement  
Provider: Twitch only  
Production mutation during sample/review: none

## Purpose

The preceding native-candidate remediation found only three Twitch geographic tag candidates in a 300-stream sample. Even perfect independent review of all three yielded a same-sample ceiling of 1.00%. This experiment removed that candidate-selection bias and asked a different question:

> In one fixed current Twitch Top 20, how many identities have explicit attributable external location evidence that can be accepted without geography inference?

This gate did not authorize persistent external crawling, City rollout, current-location inference, collector changes, D1 changes or Twitch/Kick aggregation.

## Stage A — fixed sample acquisition

Verification-only PR: `#989`  
Workflow run: `32587486403`  
Successful job: `97065978143`  
Artifact: `9479508093`  
Sample captured: `2026-08-22T17:28:10.752Z`

Read-only acquisition cost:

```text
token requests          1
/helix/streams requests 1
/helix/users requests   0
D1 writes               0
production deploy       no
```

The retained artifact contains only rank, Twitch user ID, login, display name and viewers. It does not retain title, tags, language, profile description or category.

Fixed sample:

```text
 1 caedrel          42,344
 2 ibai             40,509
 3 papaplatte       40,317
 4 ohnepixel        37,545
 5 chopperinho      28,266
 6 shadowkekw       27,704
 7 stableronaldo    26,545
 8 jynxzi           24,991
 9 stylishnoob4     22,138
10 ow_esports       20,791
11 eslcs            19,909
12 dangerlyoha      19,189
13 deepins02        18,764
14 ewc_stcarena_en  17,389
15 worldoftanks     17,218
16 hutchmf          16,420
17 realkatieb       14,064
18 otplol_          14,001
19 leva2k           12,831
20 v0kky            12,695
```

Total sample viewers: `473,630`.

## Stage B — bounded manual review result

Every sampled identity was reviewed under the same placement rules. Search-engine snippets, nationality, birthplace, language and weak aggregator profiles were not sufficient by themselves.

Final classification:

```text
sample identities                         20
accepted placeable person records          4
excluded non-person identities             5
person-eligible identities                15
person-eligible without accepted evidence 11
accepted current-location records          0
accepted country conflicts                 0
```

### Accepted placeable evidence

#### `ibai`

```text
source       official_external
source URL   https://www.totsantcugat.cat/actualitat/actualitat-esports/ibai-llanos-descobreix-installacions-junior-fc-no-sabia-existia_2239325102.html
country      ES / Spain
city         Sant Cugat del Valles (retained evidence only)
claim kind   declared_location
confidence   explicit
status       accepted
```

The attributable current article identifies Ibai and explicitly places him as a resident/neighbour of Sant Cugat. The retained city value does not activate City placement.

#### `papaplatte`

```text
source       official_external
source URL   https://www.maz-online.de/brandenburg/20-jahre-youtube-brandenburger-creator-mit-ueber-zwei-milliarden-aufrufen-3BLINWQELVAFNKT6TIXDFIAJO4.html
country      DE / Germany
city         Cologne (retained evidence only)
claim kind   declared_location
confidence   explicit
status       accepted
```

The attributable article explicitly states that Papaplatte now lives in Cologne. The retained city value does not activate City placement.

#### `ohnepixel`

```text
source       manual_review
source URL   https://www.twitchtranscripts.com/channel/ohnepixel/2716250276
country      NL / Netherlands
claim kind   declared_location
confidence   explicit
status       accepted
```

The retained transcript contains the streamer's direct response confirming that he lives in the Netherlands while distinguishing that residence from being German. Because the evidence is an intermediary transcript of a direct self-statement, the source remains `manual_review`, not `official_external`.

#### `hutchmf`

```text
source       official_external
source URL   https://x.com/HutchMF/with_replies
country      US / United States
claim kind   declared_location
confidence   explicit
status       accepted
```

The self-controlled profile identifies the Twitch creator and explicitly declares `USA`. A birthplace statement was not used as current/home placement evidence.

### Non-person identities

```text
ow_esports       event_broadcast
eslcs            event_broadcast
ewc_stcarena_en  event_broadcast
worldoftanks     organization
otplol_           organization
```

These rows remain part of observed/unmapped accounting but must not be placed as people.

### Reviewed but not accepted as placeable

```text
caedrel
chopperinho
shadowkekw
stableronaldo
jynxzi
stylishnoob4
dangerlyoha
deepins02
realkatieb
leva2k
v0kky
```

The bounded review found some tempting nationality/origin/aggregator/location-adjacent material for several of these identities, but not enough attributable explicit placeable evidence under the accepted contract. They therefore remain `no_reviewed_evidence` in the fixed-sample model rather than being inferred onto the Map.

## Stage C — measured same-sample yield

Implementation PR: `#990`  
Merged main: `27b1fb5fbedb9a3d5bf1923a941e7e657c16a5a1`

The exact #989 sample is retained as a regression fixture in `verify-twitch-stream-map-top20-reviewed-evidence.mjs`.

Measured result:

```text
raw sample coverage                  4 / 20 = 20.00%
person-eligible coverage             4 / 15 = 26.67%
accepted mapped viewers             134,791
sample viewers                      473,630
mapped viewer coverage               28.4591%
excluded non-person viewers          89,308
accepted country records                  4
accepted retained city values             2
accepted current-location records         0
accepted country conflicts                0
source official_external                  3
source manual_review                       1
```

This is substantially higher than the 1.00% same-sample ceiling of the Twitch-native candidate-triggered lane, so explicit external/manual review is useful for country coverage. It is not proof that a persistent crawler is justified.

## Review burden

End-to-end review minutes were not instrumented, so no precise review-time metric is claimed. The review required multiple source searches and source-quality decisions across all 20 fixed identities. The result therefore demonstrates evidence yield, but does not yet establish scalable operating cost.

A future maintenance design must measure review effort explicitly before claiming an affordable recurring acquisition process.

## Stage D — country-only public boundary repair

During #990 self-audit, an existing boundary bug was found: reviewed evidence could retain region/city values, and the API core model also carried them. If a streamer such as Knirpz re-entered the live population, those retained city fields could have been returned publicly even though the City stage had not been authorized.

PR #990 repaired this before merge by adding a country-only public projection:

```text
reviewed evidence storage/model:
  region/city may remain retained for a later gated City stage

public /api/twitch-stream-map response:
  location.regions = []
  location.cities  = []
  evidence.region  = null
  evidence.city    = null
```

The dedicated verifier proves this for the new Ibai/Papaplatte city values and the previously retained Knirpz/Berlin value. Country codes and provenance remain available; City placement remains blocked.

Final #990 Web checks passed:

- Typecheck;
- Build;
- Stream Map live join;
- source filters;
- country drilldown;
- reason-aware Unmapped;
- population filters;
- fixed Top 20 reviewed-evidence verifier;
- all existing Heatmap regression gates.

Development policy also passed.

## Decision

The fixed-population method materially improves country evidence yield compared with Twitch-native candidate triggers:

- candidate-triggered bounded lane: `3 / 300 = 1.00%` same-sample ceiling;
- unbiased fixed Top 20 review: `4 / 20 = 20.00%` raw-sample accepted coverage;
- after excluding five non-person identities: `4 / 15 = 26.67%` person-eligible accepted coverage.

However, one 20-identity sample does not establish stability across time, and review cost was not instrumented.

Therefore:

1. accept bounded `official_external` / `manual_review` review as a useful country-evidence lane;
2. do not introduce an unsupported persistent crawler;
3. do not weaken evidence eligibility;
4. do not proceed to City or Current Location/IRL;
5. define a reviewed-evidence maintenance policy with source precedence, staleness/re-review rules, privacy/public-projection boundaries and explicit review-cost measurement;
6. run one second independently captured fixed Top 20 replication under that policy before authorizing a recurring acquisition process.

## Next gate

**Reviewed-evidence maintenance policy + fixed Top 20 replication.**

The next accepted specification must define:

```text
review population and sampling rule
accepted/rejected source classes
source precedence
country-claim conflict handling
staleness / re-review interval
evidence withdrawal/change handling
non-person reclassification handling
review-time measurement
country-only public projection invariant
no City/current-location activation
no persistent crawler by implication
```

Then capture a second fixed Top 20 at a different observation time and apply the exact same rules. Compare:

```text
sample overlap
accepted raw coverage
accepted person-eligible coverage
viewer coverage
non-person share
source mix
conflicts
current-location yield
review minutes per reviewed identity
review minutes per accepted identity
```

Only after replication should the project decide whether recurring bounded reviewed-evidence maintenance is operationally worthwhile.

## Hard boundaries retained

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No nationality/birthplace-as-current/home inference.
- No non-person-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No current-location claim from home/origin evidence.
- No City rollout from retained city values.
- No unsupported persistent external/social/panel crawler.
- No collector cadence, retention or D1 change from this measurement.
