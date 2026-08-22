# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-22

## Current milestone: Twitch Stream Map — population filters

The Twitch Stream Map has completed source/yield audit, real-data join, public source/type filters, country selection/drilldown and reason-aware Unmapped analysis.

Current accepted implementation baseline:

```text
main 07eca2c291e4a7c4744a3c9a95013f307c44a9cb
```

Accepted Stream Map sequence:

- PR #964 — Twitch location evidence source audit
- PR #965 — read-only live location evidence probe
- PR #966 — title/tag candidate extraction with ambiguity/future-travel rejection
- PR #971 — entity/claim placement eligibility and retained A4.1 audit
- PR #972 — real latest-snapshot join API `/api/twitch-stream-map`
- PR #974 — public `/twitch/map/` route, MapLibre, source/type filters and provenance badges
- PR #975 — production route/API read verification, closed without merge after success
- PR #977 — country selection and drilldown
- PR #979 — reason-aware Unmapped analysis and reason reconciliation

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`

## Current public Twitch Stream Map behavior

- `/twitch/map/` reads the real `/api/twitch-stream-map` contract;
- current base population is the latest observed Twitch Top 300 snapshot;
- country placement requires accepted evidence;
- unknown/conflicting/candidate-only evidence remains unmapped;
- organization/event-broadcast channels remain in unmapped accounting and are not placed as people;
- six evidence sources remain distinct;
- three location types remain distinct;
- source selections use OR;
- type selections use OR;
- source and type dimensions combine with AND;
- empty source/type selection means `All accepted`;
- country markers and country rows are true drilldown controls;
- selected country survives evidence filtering and has an explicit zero state;
- reason-aware Unmapped exposes exact API reason codes and excluded non-person rows;
- API reason totals are verified against API unmapped count;
- source/type filters may add only the derived client-view reason `filtered_out_accepted_evidence`;
- current-view reason totals are verified against current-view unmapped count;
- country selection does not change Unmapped totals.

## Completed gate: reason-aware Unmapped analysis

PR #979 completed:

1. exact API `unmappedReasons` display;
2. human-readable explanations without narrowing unsupported reason meaning;
3. separate base API unmapped and current evidence-view unmapped counts;
4. derived `filtered_out_accepted_evidence` only for accepted mapped rows hidden by source/type filters;
5. baseline and current-view reconciliation;
6. explicit excluded organization/event-broadcast list;
7. zero/error states and responsive layout;
8. strengthened live-join verification requiring API reason totals to equal API unmapped totals.

Candidate-only evidence remains within the API's `context_only_or_unaccepted_evidence` class; the UI does not silently claim that every row in that class is candidate-only.

## Population-filter data audit

Current permanent Twitch snapshot data supports:

```text
viewer count       yes
category refs      yes, category-source-v1
category names     yes, provider_category_dictionary
language retained  no
```

The current permanent collector receives Twitch stream fields needed for the existing product, but its retained `StoredHeatmapItem` does not persist language.

Therefore the first population-filter implementation will not expose language.

## Current gate: population filter implementation

Accepted order:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side entity/evidence placement
-> client-side evidence source/type filters
-> country drilldown
```

Initial controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed category
Language     deferred
```

Key meaning:

```text
Top 100 + category X
= category-X streams inside overall current Top 100
!= top 100 category-X streams refilled from ranks below 100
```

Population selection must be server-side because the current browser payload does not include every eligible-unmapped stream row. Client-only category/Top-N filtering could not truthfully recompute observed/unmapped totals and reasons.

The implementation must reuse existing category refs/dictionary and must not add a second collector or new Twitch API request.

## Following Stream Map gates

1. population filters;
2. repeated evidence-coverage decision across accepted population scopes;
3. reliable city grouping if evidence supports it;
4. current-location freshness/expiry;
5. IRL-oriented view only after useful current-location coverage exists;
6. separate Kick source audit and implementation;
7. location history/replay only after live semantics stabilize.

## Stream Map hard boundaries

- No language, timezone, name, category or IP inference for placement.
- No category-to-country inference.
- No candidate-only placement.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No unsupported external crawler merely to increase mapped coverage.
- No client-only population filter that cannot reconcile unmapped reasons.
- No language filter until an accepted retained-data contract supports it.
- No D1/schema/cadence/retention/acquisition change is implied by Map UI/API work.

## Latest retained production verification

Verification-only PR #975 observed at `2026-08-22T01:55:42.393Z`:

```text
observed streams          300
observed viewers          907197
mapped streams            0
unmapped streams          300
excluded non-person       3 streams / 73654 viewers
mapped countries          0
current-location streams  0
covered pages             3
has more                  true
```

An earlier observation had one mapped stream and one mapped country. Coverage is dynamic and is not a fixed target.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted.

Retained facts:

- the accepted Twitch seven-day window completed at `2026-08-07T17:00:00.000Z`;
- final audit accepted `2016 / 2016` slots with zero missing, duplicate, invalid or consecutive-missing buckets;
- final category-reference coverage was `0.995353` with zero unresolved category IDs and zero Twitch/Kick leakage;
- PR #740 published Category + Top controls;
- PR #741 repaired the rejected 390px mobile overflow without changing semantics;
- accepted production SHA was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- Twitch and Kick collector cadences remain unchanged at five minutes;
- Kick category UI was not authorized by the Twitch rollout.

Category rollout history remains valid, but it is no longer the current execution milestone.

## Historical category handoff anchors

The following quoted strings are retained only for accepted category-rollout verifiers. This block is historical and is not the current execution gate.

> ## Current gate: post-rollout category program handoff
>
> The Twitch Heatmap category-filter rollout is complete.
>
> PR #741 fixed only the intrinsic mobile control width.
>
> Historical closeout instruction: close the completed Twitch replacement audit (#659).
