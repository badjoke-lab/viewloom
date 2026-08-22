# ViewLoom Stream Map Implementation Plan v0.4

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.5.md`  
Population decision: `docs/product/stream-map-population-filter-decision-v0.1.md`  
Current implementation baseline: main `07eca2c291e4a7c4744a3c9a95013f307c44a9cb`  
Last updated: 2026-08-22

## 1. Current position

Completed:

1. source inventory/audit — #964
2. read-only live evidence probe — #965
3. title/tag candidate extraction — #966
4. bounded non-production profile/external audit — #970 closed without merge
5. entity/claim eligibility + retained evidence — #971
6. real latest-snapshot live join — #972
7. public MapLibre route + evidence source/type filters — #974
8. production route/API read verification — #975 closed without merge
9. country selection and drilldown — #977
10. reason-aware Unmapped analysis — #979

Current gate:

```text
Population filters
```

## 2. Accepted architecture

```text
Twitch collector
  -> DB_TWITCH_HOT latest minute_snapshots
     + category-source-v1 refs
     + provider_category_dictionary
  -> /api/twitch-stream-map
     + population selection
     + reviewed location evidence
     + entity/claim placement gate
  -> /twitch/map/
     + evidence source/type filters
     + reason-aware Unmapped view
     + country selection/drilldown
```

Do not add a parallel geography or category collector.

## 3. Population filter semantics

Server-side order:

```text
latest Top 300 snapshot
-> sort/normalize current observed rows
-> overall Top N
-> min-viewer threshold
-> category filter
-> placement gate
```

Client-side order after API response:

```text
evidence source/type filters
-> current-view mapped/unmapped adjustment
-> country drilldown
```

Initial values:

```text
Top N        20 | 50 | 100 | 300 (default 300)
Min viewers  0 | 100 | 500 | 1000 | 5000 | 10000 (default 0)
Category     all | one observed Twitch category (default all)
Language     not implemented in this gate
```

## 4. Why server-side population filtering is required

The current browser contract does not include every eligible-unmapped stream row. It has detailed mapped rows and excluded non-person rows plus aggregate unmapped reasons.

Therefore client-only Top/category filtering could not truthfully recompute:

- observed streams/viewers
- unmapped streams/viewers
- eligible unmapped
- excluded non-person
- unmapped reasons

Population selection must happen before `buildTwitchStreamMapLiveModel` evaluates the rows.

## 5. Reusable category path

Reuse the already accepted category contract:

```text
categoryContractVersion
categoryIds
categoryRefs
provider_category_dictionary
```

Reuse/adapt the proven reconstruction semantics from the Twitch Heatmap API. Do not duplicate collector acquisition.

The Stream Map ordering remains its own contract:

```text
Top N before category
```

This differs intentionally from the Heatmap's category-before-Top-N behavior.

## 6. API PR work

Add a narrow population-selection core, preferably independent from the location-evidence core.

Recommended files:

```text
apps/web/functions/api/twitch-stream-map-population-core.mjs
apps/web/functions/api/twitch-stream-map-population-core.d.mts
```

Responsibilities:

- parse stable snapshot rows with category refs aligned by item index;
- normalize/sort by viewers descending with stable login tie-break;
- apply Top N;
- apply minimum viewers;
- summarize available categories after Top-N/min-viewer scope but before selected category;
- apply selected category;
- expose selected population payload for the existing live model builder;
- make category unavailable/unknown states explicit.

Update `twitch-stream-map.ts` to:

1. parse query values;
2. read the existing category dictionary only when category contract data exists;
3. build selected population;
4. call the existing live model with that selected population;
5. append `populationFilter` metadata to the response.

Do not change the collector or D1 schema.

## 7. API contract

Accepted request form:

```text
/api/twitch-stream-map?top=100&min_viewers=500&category=<id>
```

Additive response metadata:

```text
populationFilter: {
  selectedTop,
  minViewers,
  selectedCategory,
  categoryState,
  categoryAvailable,
  categoryCoverageState,
  preCategoryStreams,
  selectedPopulationStreams,
  selectedPopulationViewers,
  unknownCategoryStreams,
  availableCategories
}
```

`availableCategories` entries:

```text
{
  id,
  name,
  streamCount,
  totalViewers
}
```

## 8. Category states

Use explicit states:

```text
all
selected
unknown_category
category_unavailable
```

Coverage state:

```text
observed
partial
unavailable
```

Rules:

- `all`: keep unknown/missing category rows;
- `selected`: only matching category rows;
- `unknown_category`: zero selected population; do not fall back to all;
- `category_unavailable` + selected category: zero selected population;
- `category_unavailable` + all: continue Top-N/min-viewer population and report unavailable.

## 9. Browser PR work

Add a compact Population panel above Location evidence filters.

Controls:

- Top N select
- Min viewers select
- Category select

Required copy:

```text
Population order: overall Top N -> minimum viewers -> category -> location evidence filters.
```

Changing a population control refetches `/api/twitch-stream-map` with the selected population query.

Existing evidence source/type selections remain unchanged across population refetches.

Existing country selection remains selected. If it disappears from the new population, retain selection and show zero mapped rows, as Stage 1G already requires.

The UI must show selected-population observed count/viewers from the API rather than pretending it is always 300.

## 10. Unmapped integration

After a population refetch:

- API `coverage.unmappedReasons` describes the selected population;
- `sum(API unmappedReasons) = API coverage.unmappedStreams` must hold;
- source/type filtering may then add `filtered_out_accepted_evidence` in the browser;
- current-view reason total must equal current-view unmapped count.

Country selection does not affect these totals.

## 11. Language decision

Do not add language UI or query behavior in this PR.

Current permanent snapshot items do not retain language. A future language filter requires a separate accepted persistence/cost/retention gate.

Language is never geography evidence.

## 12. Verification

Add population-core verifier covering at least:

1. Top N before category;
2. no category refill below Top-N boundary;
3. min-viewer threshold does not refill;
4. category options computed pre-selected-category;
5. category `all` keeps missing-category rows;
6. selected category excludes missing-category rows;
7. unknown category returns explicit zero;
8. category-unavailable selected category returns explicit zero;
9. category-unavailable all continues population;
10. selected population live model still reconciles mapped/unmapped and unmapped reasons.

Extend Web checks with the new verifier and keep all existing Stream Map/Heatmap gates.

## 13. Production boundary

This implementation is public Web/API behavior and may deploy through the normal Web path after accepted checks.

It must not:

- mutate collector cadence;
- change D1 schema;
- expand snapshot retention;
- add Twitch API calls;
- enable language persistence;
- change evidence acceptance;
- enable Kick Map.

## 14. Next after population filters

Create a repeated coverage decision package for the now-filterable Stream Map population.

Required measurements:

- base and selected population size/viewers;
- mapped streams/viewers;
- countries;
- source yield/overlap;
- conflicts;
- excluded non-person;
- current-location coverage;
- differences across accepted Top/category/min-viewer scopes.

Only then decide whether supported evidence acquisition expansion has enough value to justify more work.
