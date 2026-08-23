# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-23

## Current execution state

```text
Current program Twitch Stream Map
Current stage Second fixed Top 20 replication closed; recurring acquisition not authorized
Accepted main 940840e08daea498361eaa0486b9a211aa280f90
Reviewed-evidence maintenance policy complete PR #994
Second fixed Top 20 sample complete PR #995 verification-only / close without merge
Second fixed Top 20 reviewed evidence + retained audit complete PR #996
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
7. `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
8. `docs/product/stream-map-top20-replication-plan-v0.1.md`
9. `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
10. `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
11. `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
12. `docs/audits/twitch-stream-map-top20-replication-2026-08-23.md`
13. affected feature specification/plan and current WIP/handoff

Historical 12A/category rollout records remain valid but are not the current execution milestone.

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

Placement invariants:

- candidate-only evidence does not map;
- tag-only geography does not map;
- language/category/name/timezone/IP does not map;
- nationality/birthplace does not become home/current placement;
- organization/event-broadcast channels do not map as people;
- conflicting accepted countries remain unmapped unless explicit temporal supersession is reviewed;
- provenance remains separated by source;
- current-location is not derived from home/origin evidence;
- no demo geography substitutes for failed real data;
- Twitch and Kick geography remain separated.

## Reviewed-evidence maintenance policy

The accepted policy in PR #994 allows bounded manual review only from explicit attributable sources and fixes the following staleness boundary for `declared_location` / `home_base`:

```text
re-review target 180 days
hard stale        365 days
```

Accepted source classes include self-controlled statements, official affiliated sources about the person, attributable editorial/interview sources, and reviewed transcripts of direct self-statements.

Aggregators, snippets, nationality, birthplace, language, timezone, category, name cues, IP, organization HQ, event venue, temporary/planned travel and tag-only geography cannot independently place a streamer.

## First fixed Top 20 result

Verification-only PR #989 captured one unbiased Top 20 identity sample at `2026-08-22T17:28:10.752Z`. PR #990 retained the accepted result and repaired the country-only public projection.

```text
sample identities                       20
sample viewers                     473,630
accepted placeable persons               4
excluded non-person identities           5
person-eligible identities              15
eligible persons without acceptance     11
raw accepted coverage                20.00%
person-eligible accepted             26.67%
mapped viewer coverage               28.4591%
review minutes                  not instrumented
```

Accepted records:

```text
ibai        ES / Spain          official_external
papaplatte  DE / Germany        official_external
ohnepixel   NL / Netherlands    manual_review
hutchmf     US / United States  official_external
```

## Second fixed Top 20 replication result

Verification-only PR #995 captured a second unbiased Top 20 sample at `2026-08-23T02:28:43.300Z`, 32,433 seconds after #989. It used one `/helix/streams` request, zero `/helix/users` requests, zero D1 writes and no production deploy.

PR #996 retained the review result and exact regression:

```text
sample identities                       20
sample viewers                     480,179
overlap with #989                         2
overlap percent                       10.00%
accepted placeable persons               5
excluded non-person identities           4
person-eligible identities              16
eligible persons without acceptance     11
raw accepted coverage                25.00%
person-eligible accepted             31.25%
mapped viewer coverage               17.4004%
official_external                         2
manual_review                              3
current-location                           0
country conflicts                          0
```

Accepted records:

```text
adinross  US / United States  official_external  home_base
xqc       US / United States  manual_review      declared_location
lacy      US / United States  manual_review      home_base
cinna     US / United States  manual_review      declared_location
ddg       US / United States  official_external  home_base
```

The second sample reproduced useful country-evidence yield, but the exact pre-research `reviewStartedAt` was not durably retained. The project does not invent a replacement timestamp.

Frozen decision gate:

```text
raw accepted coverage             PASS
person-eligible accepted          PASS
evidence quality                  PASS
silent country conflicts          PASS
wall-clock review time            UNPROVEN
minutes per accepted identity     UNPROVEN
```

**Recurring reviewed-evidence acquisition is therefore NOT AUTHORIZED.**

If recurring maintenance is reconsidered, it requires a new separately accepted and independently clocked bounded cost measurement.

## Current order

1. Keep accepted reviewed evidence curated under the 180/365-day staleness policy.
2. Preserve honest Unmapped coverage.
3. Keep the public Map country-only.
4. Do not retroactively repair #995 review timing.
5. Do not introduce persistent external acquisition or automatic search-result acceptance.
6. City, Current Location/IRL and Kick Map remain separately blocked.
7. Any future review-cost, City, Current Location, IRL, Kick Map or location-history stage requires its own accepted gate.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-top20-replication-plan-v0.1.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-replication-2026-08-23.md`

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Global invariants

- Provider-scoped identities remain provider-separated.
- No combined-provider geography, category totals or rankings unless separately specified and accepted.
- Twitch/Kick collectors remain on existing five-minute cadences unless a separate gate changes them.
- No retention expansion, backfill, D1/binding change, permanent acquisition expansion or production mutation is implied by UI/API work.
- Current-main documents and accepted contracts override cached handoffs and superseded draft PR documents.

## Retained Twitch category rollout

The completed Twitch category/Heatmap rollout remains a historical accepted milestone:

- final seven-day audit accepted `2016 / 2016` expected slots;
- category-reference coverage was `0.995353`;
- PR #740 exposed Category + Top;
- PR #741 repaired the rejected 390px mobile overflow;
- accepted production SHA was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- no Kick category UI was authorized by the Twitch rollout.
