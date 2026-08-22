# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone: Twitch Stream Map — coverage remediation / supported evidence acquisition

Current accepted implementation baseline:

```text
main b58981735a947f0ed4c711bcc8363b8f4430abc7
```

The Twitch Stream Map has completed:

- source/yield audit — #964 / #965 / #966;
- entity/claim eligibility and retained reviewed evidence — #971;
- real latest-snapshot join — #972;
- public route, MapLibre, source/type filters and provenance badges — #974;
- read-only production route/API verification — #975, closed without merge;
- country selection/drilldown — #977;
- reason-aware Unmapped analysis — #979;
- population-filter contract — #980;
- server-side Top-N/min-viewer/category population filters — #981;
- ready-response population semantics repair — #983;
- post-population read-only production coverage audit — #982, verification-only and to be closed without merge after retained evidence lands.

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`

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

Public population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred; permanent minute snapshots do not retain it
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

Filter semantics:

```text
sources: OR
location types: OR
source dimension AND type dimension
country selection: drilldown only
```

Placement remains evidence-backed only. Language/category/name/timezone/IP never creates geography.

## Production population-filter acceptance

PR #981 introduced the runtime population controls. PR #983 repaired one response-contract omission found by the production audit: ready responses now explicitly expose:

```text
populationFilterBeforeEvidenceFilter = true
languageUsedForPopulationFiltering = false
```

Final successful production audit:

```text
verification-only PR  #982
workflow run          32583205617
successful job        97056168203
artifact              9478398925
snapshot updatedAt    2026-08-22T16:00:18.854Z
report generatedAt    2026-08-22T16:01:56Z
```

The deployed route contained all three population controls and every audited API response reconciled:

```text
mapped + unmapped = selected population
sum(unmappedReasons) = unmapped
populationFilterBeforeEvidenceFilter = true
languageUsedForPlacement = false
languageUsedForPopulationFiltering = false
```

## Completed evidence coverage decision

Top 300 baseline at the audited snapshot:

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

Every audited population slice also had `mappedStreams=0`:

- Top 20: 20 streams / 477,236 viewers;
- Top 50: 50 / 757,507;
- Top 100: 100 / 965,851;
- Top 300: 300 / 1,358,840;
- >=5,000 viewers: 57 / 795,253;
- >=10,000 viewers: 30 / 597,709;
- Fortnite Top 300: 29 / 219,546;
- Counter-Strike Top 300: 21 / 150,172;
- Just Chatting Top 300: 40 / 138,720;
- League of Legends Top 300: 15 / 136,677;
- IRL Top 300: 8 / 55,639;
- Top-100 Fortnite / Counter-Strike / Just Chatting: all zero mapped.

The currently retained reviewed-location evidence therefore does not overlap the live Twitch population enough to make geographic coverage useful. Population filtering works, but narrowing the population does not repair evidence coverage.

## Current gate: bounded coverage remediation

Do **not** proceed directly to City, Current Location emphasis or IRL geography.

The next gate must test whether supported, attributable and reviewable evidence can materially improve live overlap while keeping source lanes separate.

For each source lane or combination, report:

- sampled live population;
- candidates;
- accepted streamers;
- incremental accepted streamers over existing evidence;
- resulting mapped percentage;
- request cost and manual-review burden;
- source overlap;
- conflicts;
- freshness/expiry requirements;
- any unsupported/private API dependency.

Decision rule:

- proceed with a bounded acquisition path only if it produces material incremental accepted live coverage at acceptable cost;
- candidate-only title/tag signals remain candidates unless the claim itself is explicitly placeable;
- unsupported persistent Twitch panels/social crawling remains unauthorized;
- if supported remediation still produces weak coverage, preserve the low-coverage map honestly instead of weakening evidence rules.

## Following gates — blocked on remediation outcome

1. reliable city grouping only if accepted evidence supports it;
2. current-location freshness/expiry only if current-location evidence becomes useful;
3. IRL-oriented view only after useful current-location coverage exists;
4. separate Kick source audit and implementation;
5. location history/replay only after live semantics stabilize.

## Stream Map hard boundaries

- No language, timezone, name, category or IP inference for placement.
- No category-to-country inference.
- No candidate-only placement.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No unsupported external crawler merely to increase coverage.
- No language population UI until an accepted retained-data contract supports it.
- No D1/schema/cadence/retention/acquisition change without a separate accepted gate.

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
