# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-22

## Current milestone: Twitch Stream Map Stage 1G — country selection and drilldown

The Twitch Stream Map has passed its source audit, real-data join, public source/type filter implementation, and read-only production route verification.

Current accepted implementation baseline:

```text
main 17bbe766a79903436501b05dc1e4ccb0379aa00a
```

Accepted Stream Map sequence:

- PR #964 — Twitch location evidence source audit
- PR #965 — read-only live location evidence probe
- PR #966 — title/tag candidate extraction with ambiguity/future-travel rejection
- PR #971 — entity/claim placement eligibility and retained A4.1 audit
- PR #972 — real latest-snapshot join API `/api/twitch-stream-map`
- PR #974 — public `/twitch/map/` route, MapLibre, source/type filters and provenance badges
- PR #975 — production route/API read verification, closed without merge after success

Authoritative Stream Map records:

- `docs/product/stream-map-spec-v0.4.md`
- `docs/product/stream-map-implementation-plan-v0.3.md`
- `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`

## Current public Twitch Stream Map behavior

- `/twitch/map/` reads only the real `/api/twitch-stream-map` contract;
- live population is the latest observed Twitch Top 300 snapshot;
- country placement requires accepted evidence;
- unknown/conflicting/candidate-only evidence remains unmapped;
- organization/event-broadcast channels remain in unmapped accounting and are not placed as people;
- six evidence sources are selectable independently:
  - `account_profile`
  - `stream_title`
  - `stream_tag`
  - `channel_profile`
  - `official_external`
  - `manual_review`
- three location types are selectable independently:
  - `home_base`
  - `declared_location`
  - `current_location`
- multiple sources use OR semantics;
- multiple types use OR semantics;
- source and type dimensions combine with AND semantics;
- empty selection means `All accepted`;
- mapped/unmapped streams and viewers, country count, markers and evidence rows recalculate after filtering;
- provenance remains visible through separate source badges and evidence rows.

## Latest production acceptance evidence

Verification-only PR #975 confirmed the deployed route and API.

At API `updatedAt=2026-08-22T01:55:42.393Z`:

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

An earlier live observation had one mapped stream and one mapped country. Coverage is therefore dynamic and must not be treated as a fixed target or demo expectation.

## Current gate: Stage 1G

Next implementation must turn country markers/rows into a real selected-country state.

Required:

1. marker or country-row selection;
2. selected-country summary;
3. selected-country live-stream drilldown;
4. clear-country action;
5. source/type filters continue to apply;
6. zero mapped countries remains a valid state;
7. desktop/mobile and keyboard/tap acceptance;
8. home/base is never described as current physical location.

Current marker behavior is not considered full Stage 1G completion until country selection changes the drilldown state rather than merely navigating the page.

## Following Stream Map gates

1. Stage 1G country selection/drilldown;
2. reason-aware Unmapped analysis;
3. optional population filters only after ordering semantics are explicit;
4. repeated evidence-coverage decision using supported/reviewable sources;
5. reliable city grouping if evidence supports it;
6. fresh/expiring current-location mode if evidence supports it;
7. IRL-oriented view only after useful current-location coverage exists;
8. separate Kick source audit and implementation;
9. location history/replay only after live semantics stabilize.

## Stream Map hard boundaries

- No language, timezone, name, category or IP inference for placement.
- No candidate-only placement.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No unsupported external crawler merely to increase mapped coverage.
- No D1/schema/cadence/retention change is implied by Map UI work.

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
