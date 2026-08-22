# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-23

## Current execution state

```text
Current program Twitch Stream Map
Current stage Fixed Top 20 official_external / manual_review yield experiment
Accepted main b0a99f480ec4f2320af09aa0329b044f8eeee3eb
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter contract frozen PR #980
Population filter runtime complete PR #981
Ready-response population semantics fixed PR #983
Production population coverage audit complete PR #982 closed without merge
Coverage remediation candidate audit complete PR #985 verification-only
Reviewed evidence remediation complete PR #986
Reviewed evidence production verification complete PR #987 verification-only
Production route/API verification complete PR #975 closed without merge
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
9. affected feature specification/plan and current WIP/handoff

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
- organization/event-broadcast channels do not map as people;
- context-only birthplace/nationality/event-venue/org-HQ claims do not map;
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

Knirpz has Berlin retained in reviewed evidence, but the current public Map remains country-level. The City gate is still blocked.

Same-sample maximum from the native candidate lane is `3 / 300 = 1.00%`.

## Latest retained production verification

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

Mapped rows:

```text
wirtual  9,816 viewers  NO / Norway  official_external
payo     2,586 viewers  CA / Canada  official_external
```

`knirpz` was not present in that live Top 300 snapshot. Live mapped rows retained empty region/city arrays and no current-location classification.

This confirms the new evidence is active in production while country-level/current-location boundaries remain unchanged.

## Current order

1. Obtain one fixed current Twitch Top 20 identity sample read-only from the supported Twitch stream surface.
2. Review all 20 consistently for explicit self-controlled or official external location evidence, regardless of Twitch tag/title/profile candidate presence.
3. Record accepted country/city/current-location evidence, no-location outcomes, provenance, conflicts and review burden.
4. Decide whether a separately gated acquisition/update model is justified.
5. If fixed-sample coverage remains sparse or review cost is excessive, stop geography expansion and preserve honest low coverage.
6. Only then reconsider City; Current Location/IRL remain separately blocked by current-location yield.
7. Audit and implement Kick separately.
8. Add location history/replay only after live semantics stabilize.

## Fixed Top 20 experiment boundary

This experiment is measurement only.

Allowed:

- supported Twitch stream surface for one bounded Top 20 identity sample;
- self-controlled profiles and official/attributable external sources;
- manual review with source URL provenance;
- explicit country/city claims retained separately.

Not authorized:

- persistent unsupported Twitch panel/social crawling;
- inferred location from language/category/name/timezone/IP;
- tag-only acceptance;
- automatic acceptance from external search results;
- permanent acquisition/storage changes before the experiment decision.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`

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
