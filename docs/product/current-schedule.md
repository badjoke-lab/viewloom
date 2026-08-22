# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-23

```text
Current program Twitch Stream Map
Current stage Coverage remediation / supported evidence acquisition gate
Accepted main b58981735a947f0ed4c711bcc8363b8f4430abc7
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter decision frozen PR #980
Population filters complete PR #981
Ready-response population semantics fixed PR #983
Population coverage production audit complete PR #982 verification-only / close without merge
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
13. PR #981 implements overall Top N, minimum viewers and category before placement, while evidence source/type filters and country drilldown remain downstream.
14. PR #981 reuses existing `category-source-v1` refs and `provider_category_dictionary`; it adds no collector, D1 schema, cadence, retention or Twitch acquisition change.
15. PR #981 passed Typecheck, Build, Stream Map live-join/source-filter/country-drilldown/Unmapped/population-filter gates and all existing Heatmap regressions before merge.
16. Verification-only PR #982 exposed a ready-response semantics omission; PR #983 fixed the response contract without changing placement/population logic.
17. PR #983 passed the full Web checks including the population verifier and merged as `b58981735a947f0ed4c711bcc8363b8f4430abc7`.
18. PR #982 then completed a read-only production coverage audit successfully. Retained evidence: `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`.

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
- unknown selected category returns an explicit zero population;
- unavailable category contract plus a selected category returns explicit zero rather than silently using all categories;
- mapped + unmapped equals the selected population;
- API unmapped-reason totals equal selected-population unmapped count;
- ready responses explicitly expose `populationFilterBeforeEvidenceFilter=true`;
- ready responses explicitly expose `languageUsedForPopulationFiltering=false`;
- source/type filters still happen after population selection;
- country remains drilldown-only.

## Completed evidence coverage decision

Verification-only PR #982 measured production after PR #981/#983 using read-only GET requests only.

Successful evidence:

```text
workflow run      32583205617
successful job    97056168203
artifact          9478398925
snapshot updated  2026-08-22T16:00:18.854Z
report generated  2026-08-22T16:01:56Z
```

Baseline Top 300:

```text
streams                         300
viewers                         1,358,840
mapped streams                  0
mapped viewers                  0
mapped countries                0
current-location streams        0
excluded non-person streams     1
excluded non-person viewers     20,413
no reviewed evidence            298
context-only/unaccepted         1
conflicting accepted evidence   0
unknown-category streams        1
dictionary-missing items        0
```

All audited scopes returned `mappedStreams=0`:

- Top 20 / Top 50 / Top 100 / Top 300;
- Top 300 with >=1,000 / >=5,000 / >=10,000 viewers;
- Top 300 Fortnite / Counter-Strike / Just Chatting / League of Legends / IRL;
- Top 100 Fortnite / Counter-Strike / Just Chatting.

Therefore population narrowing does not solve the current live coverage problem. The dominant blocker is lack of reviewed evidence overlapping the current live population, not accepted-country conflicts.

## Current order

### 1. Coverage remediation / supported evidence acquisition — CURRENT

Run a separately bounded experiment to determine whether attributable, reviewable sources can materially increase accepted live overlap without weakening placement rules.

Keep source lanes separate:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Required report for each lane/combination:

- live population sampled;
- candidate streamers;
- accepted streamers;
- incremental accepted streamers beyond existing evidence;
- mapped percentage if accepted;
- request cost / manual-review burden;
- source overlap;
- conflicts;
- freshness/expiry requirement;
- unsupported/private API dependency, if any.

Hard decision rule:

- supported/reviewable evidence may proceed only if the bounded experiment shows material incremental live coverage at acceptable request/review cost;
- tag/title candidates remain candidates unless they make an explicit eligible claim;
- unsupported persistent Twitch panel/social crawling remains unauthorized;
- language/category/name/timezone/IP inference remains prohibited;
- if bounded remediation still cannot produce useful coverage, keep the low-coverage map honest and do not proceed to City/Current/IRL merely to create activity.

### 2. Later stages — BLOCKED ON REMEDIATION RESULT

- reliable city grouping only if accepted evidence supports it;
- current-location freshness/expiry only if current-location evidence becomes useful;
- IRL-oriented mode only if current-location coverage becomes useful;
- separate Kick source audit and implementation;
- history/replay after live semantics stabilize.

## Latest retained production observation

Accepted production coverage snapshot from PR #982:

```text
updatedAt                 2026-08-22T16:00:18.854Z
observedStreams           300
observedViewers           1358840
mappedStreams             0
unmappedStreams           300
excludedNonPersonStreams  1
excludedNonPersonViewers  20413
mappedCountryCount        0
currentLocationStreams    0
coveredPages              3
hasMore                   true
```

This is a timestamped live observation, not a fixed target. Earlier production snapshots had one mapped stream, so coverage remains dynamic.

## Hard stops

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No candidate-only placement.
- No non-person channel placement as a person.
- No silent conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo fallback geography.
- No unsupported external crawling solely to improve coverage.
- No client-only population filtering that cannot reconcile unmapped reasons.
- No language UI until an accepted snapshot persistence contract actually retains language.
- No collector cadence, retention, D1 schema, binding or acquisition change without a separate accepted gate.
- No automatic Kick Map rollout from Twitch acceptance.
- Temporary production coverage audit PR #982 is verification-only and must be closed without merge after this retained evidence is merged.

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
