# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-22

## Current milestone: Twitch Stream Map — evidence coverage decision

The Twitch Stream Map has completed source/yield audit, real-data join, public source/type filters, country selection/drilldown, reason-aware Unmapped analysis, and server-side population filters.

Current accepted implementation baseline:

```text
main f707b7053be1b6fecc07bb93a26b8d9abb3ebabc
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
- PR #980 — population-filter contract freeze
- PR #981 — server-side Top-N/min-viewer/category population filters and public controls
- PR #982 — current verification-only production coverage audit; close without merge after evidence retention

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`

## Current public Twitch Stream Map behavior

- `/twitch/map/` reads the real `/api/twitch-stream-map` contract;
- base observation is the latest Twitch Top 300 snapshot;
- public population controls select overall Top N, minimum viewers and one category before placement;
- Top N is a hard boundary: category does not refill from below it;
- category uses the retained `category-source-v1` refs and existing category dictionary;
- language is not a public population control because the permanent minute snapshot does not retain it;
- country placement requires accepted evidence;
- unknown/conflicting/candidate-only evidence remains unmapped;
- organization/event-broadcast channels remain in unmapped accounting and are not placed as people;
- six evidence sources and three location types remain distinct;
- source selections use OR, type selections use OR, and source/type dimensions combine with AND;
- country markers/rows remain drilldown-only controls downstream of population and evidence filters;
- reason-aware Unmapped exposes exact API reason codes and verifies reconciliation against the selected population;
- source/type filtering may add only the derived client-view reason `filtered_out_accepted_evidence`.

## Completed gate: population filters

PR #981 completed the accepted population contract:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> placement
-> evidence source/type filters
-> country drilldown
```

Public controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed category
Language     deferred
```

Implementation guarantees:

1. category identity is reconstructed before Top-N slicing;
2. category never refills rows below the selected overall Top-N boundary;
3. `category=all` retains rows with missing category;
4. unknown/unavailable selected categories use explicit zero states;
5. selected-population stream/viewer counts become the placement denominator;
6. mapped + unmapped equals selected population;
7. API unmapped-reason totals equal selected-population unmapped count;
8. evidence source/type filtering remains downstream;
9. country selection remains drilldown-only;
10. no second collector, extra Twitch API request, D1 schema change, cadence change or retention change was introduced.

PR #981 passed Typecheck, Build, Stream Map live-join/source-filter/country-drilldown/Unmapped/population-filter verification and the existing Heatmap regression suite before merge.

## Current gate: evidence coverage decision

The next decision is empirical, not a new inference rule.

Temporary PR #982 measures production read-only scopes and must be closed without merge after its artifact is retained.

Required measurements:

- selected population streams/viewers;
- mapped streams/viewers and percentages;
- represented countries;
- source yield and multi-source overlap;
- conflicting accepted evidence;
- excluded non-person streams/viewers;
- current-location coverage;
- category coverage/unknown-category state.

Required population slices:

- Top 20, Top 50, Top 100 and Top 300;
- meaningful minimum-viewer thresholds;
- current high-volume category slices from the retained category contract.

Decision rule:

- supported, attributable and reviewable evidence may justify a separately bounded acquisition expansion;
- weak coverage does not authorize language/category/name/timezone/IP inference;
- weak coverage does not authorize unsupported Twitch panel/social crawling;
- if coverage stays weak, keep it visible and improve inspection/analysis value rather than fabricating placement.

## Following Stream Map gates

1. finish and retain the evidence coverage decision;
2. reliable city grouping only if accepted evidence supports it;
3. current-location freshness/expiry;
4. IRL-oriented view only after useful current-location coverage exists;
5. separate Kick source audit and implementation;
6. location history/replay only after live semantics stabilize.

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
- No D1/schema/cadence/retention/acquisition change implied by Map UI/API work.

## Latest retained production verification

Until #982 is accepted, the retained pre-population-filter verification remains PR #975 at `2026-08-22T01:55:42.393Z`:

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
