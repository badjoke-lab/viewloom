# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-22

## Current milestone: Twitch Stream Map — reason-aware Unmapped analysis

The Twitch Stream Map has passed its source audit, real-data join, public source/type filter implementation, read-only production route verification, and Stage 1G country selection/drilldown implementation.

Current accepted implementation baseline:

```text
main d7155d3c9d9b6baa27997a2c019e6da03c1cb59a
```

Accepted Stream Map sequence:

- PR #964 — Twitch location evidence source audit
- PR #965 — read-only live location evidence probe
- PR #966 — title/tag candidate extraction with ambiguity/future-travel rejection
- PR #971 — entity/claim placement eligibility and retained A4.1 audit
- PR #972 — real latest-snapshot join API `/api/twitch-stream-map`
- PR #974 — public `/twitch/map/` route, MapLibre, source/type filters and provenance badges
- PR #975 — production route/API read verification, closed without merge after success
- PR #977 — country selection and drilldown with marker/row selection, selected-country summary, filtered stream list, clear action and explicit retained zero state

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
- country markers and country rows are real selection controls;
- selecting a country changes the streamer drilldown state rather than merely scrolling/focusing the page;
- the selected-country panel shows mapped stream count, mapped viewers and source summary;
- source/type filters continue to apply inside a country drilldown;
- if filters remove the selected country, the country remains selected and the UI shows an explicit zero-result state;
- a clear-country action restores the all-country drilldown list;
- marker/row buttons use keyboard/tap-capable native button semantics and `aria-pressed`;
- provenance remains visible through separate source badges and evidence rows.

## Latest production acceptance evidence

Verification-only PR #975 confirmed the deployed route and API before Stage 1G.

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

An earlier live observation had one mapped stream and one mapped country. Coverage is dynamic and must not be treated as a fixed target or demo expectation. PR #977 changes only client-side country drilldown behavior; it does not change evidence acceptance, API placement semantics, collector cadence, D1 schema or retention.

## Completed gate: Stage 1G

PR #977 completed the required selected-country behavior:

1. marker and country-row selection;
2. selected-country summary;
3. selected-country live-stream drilldown;
4. clear-country action;
5. source/type filters remain active inside selection;
6. zero-result selected-country state is explicit and retained;
7. keyboard/tap semantics use native buttons and `aria-pressed`;
8. home/base remains a location type and is not relabeled as current physical location.

A dedicated `verify:stream-map-country-drilldown` gate covers grouping, selection, filtered zero-state retention, clear wiring, marker/row controls and required accessibility/style hooks. It passed together with Typecheck, Build, Stream Map live-join/source-filter gates and existing Heatmap regression checks before merge.

## Current gate: reason-aware Unmapped analysis

The next implementation must make the unmapped population explainable without inventing placement.

Required reason vocabulary starts with the current real contract and accepted lifecycle rules:

```text
no_reviewed_evidence
candidate_only_or_unaccepted
conflicting_evidence
excluded_nonperson
expired_current_location (only after current-location lifecycle exists)
```

Required behavior:

1. reason totals reconcile with the current observed/unmapped population;
2. excluded non-person channels are visibly distinct from otherwise eligible unmapped people;
3. candidates and conflicts remain unmapped and are not auto-promoted;
4. reason selection/filtering, if interactive, has explicit zero states;
5. evidence/provenance wording remains aligned with the six-source contract;
6. no language/category/name/timezone/IP inference is introduced;
7. desktop/mobile and keyboard/tap behavior is verified.

## Following Stream Map gates

1. reason-aware Unmapped analysis;
2. optional population filters only after ordering semantics are explicit;
3. repeated evidence-coverage decision using supported/reviewable sources;
4. reliable city grouping if evidence supports it;
5. fresh/expiring current-location mode if evidence supports it;
6. IRL-oriented view only after useful current-location coverage exists;
7. separate Kick source audit and implementation;
8. location history/replay only after live semantics stabilize.

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

## Historical category handoff anchors

The following quoted strings are retained only for accepted category-rollout verifiers. This block is historical and is not the current execution gate.

> ## Current gate: post-rollout category program handoff
>
> The Twitch Heatmap category-filter rollout is complete.
>
> PR #741 fixed only the intrinsic mobile control width.
>
> Historical closeout instruction: close the completed Twitch replacement audit (#659).
