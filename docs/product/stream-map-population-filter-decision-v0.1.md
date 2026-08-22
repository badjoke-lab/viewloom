# ViewLoom Stream Map Population Filter Decision v0.1

Status: accepted implementation decision  
Platform: Twitch only  
Decision date: 2026-08-22  
Baseline: main `07eca2c291e4a7c4744a3c9a95013f307c44a9cb`

## 1. Decision

The next Twitch Stream Map population controls will be implemented in this order:

```text
latest real Twitch Top 300 snapshot
-> overall Top-N scope
-> minimum-viewer threshold
-> category filter
-> server-side entity/evidence placement accounting
-> client-side evidence source/type filters
-> country drilldown
```

Country drilldown remains a presentation/drilldown state and never changes population or placement eligibility.

The first implementation will support:

```text
Top N:        20 / 50 / 100 / 300
Min viewers:  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category:     all or one observed Twitch category in the scoped population
Language:     deferred — not currently persisted in the Stream Map snapshot contract
```

## 2. Why Top N comes before category

`Top N` means the top N streams in the overall current Twitch observation, not the top N streams after choosing a category.

Example:

```text
Top 100 + Just Chatting
```

means:

```text
streams that are both
- inside the overall current Top 100
- and observed in Just Chatting
```

It must not refill the list with lower-ranked Just Chatting streams from positions 101-300.

This preserves the existing Stream Map product meaning: geography of a selected slice of the current observed field.

This ordering is intentionally different from any ViewLoom surface whose product contract defines category-before-Top-N. The Stream Map must state its own ordering explicitly rather than inheriting another page's semantics.

## 3. Minimum-viewer ordering

Minimum viewers is applied after the overall Top-N scope and before category.

A minimum-viewer threshold removes rows from the selected overall Top-N scope. It does not refill from below the Top-N boundary.

## 4. Evidence filtering ordering

Population filters and location-evidence filters are different dimensions.

Server-side population selection happens first:

```text
Top N -> min viewers -> category
```

Then the API performs the existing placement gate for that selected population:

```text
person eligibility
+ accepted placement-capable evidence
+ conflict rules
```

Then the existing client source/type filters operate only on the accepted mapped rows returned for that population.

Therefore:

- population-filtered rows are outside the current observed population and are not counted as unmapped;
- accepted mapped rows hidden by source/type filters remain part of the population and are counted as `filtered_out_accepted_evidence` in the current evidence view;
- country selection never changes mapped/unmapped accounting.

## 5. Current data availability audit

### Viewers

Available now in every retained Twitch Stream Map snapshot item.

This supports overall Top-N and minimum-viewer filtering without collector changes.

### Category

Available now through the existing category snapshot contract:

```text
categoryContractVersion = category-source-v1
categoryIds[]
categoryRefs[]
provider_category_dictionary
```

The collector intentionally strips raw per-item category source fields after encoding them, but the category reference array remains aligned with snapshot items.

The existing Twitch Heatmap already demonstrates the supported reconstruction path using `categoryIds`, `categoryRefs` and `provider_category_dictionary`.

The Stream Map implementation should reuse that contract and must not add a second category collector.

### Language

Twitch Helix `/streams` exposes stream language, but the current permanent Twitch collector's stored `StoredHeatmapItem` and `minute_snapshots` payload do not retain it.

Therefore language cannot be added as a truthful Stream Map population filter in the current implementation without a separate collection/storage contract change.

Decision:

```text
Do not expose a fake/disabled language filter.
Do not infer language from title, tags, category, country or profile.
Defer language until a separate persistence/cost/retention gate explicitly accepts it.
```

## 6. API ownership

Population filtering belongs in `/api/twitch-stream-map`, not only in the browser.

Reason: the browser currently receives detailed mapped rows and excluded non-person rows, but it does not receive every eligible-unmapped stream row. Client-only category/Top-N filtering would therefore be unable to recalculate truthful observed/unmapped counts and unmapped reasons.

The API must filter the snapshot population before `buildTwitchStreamMapLiveModel` performs mapping.

Accepted query contract for the implementation:

```text
GET /api/twitch-stream-map?top=100&min_viewers=500&category=<twitch-category-id>
```

Defaults:

```text
top=300
min_viewers=0
category=all
```

Invalid Top-N values fall back to 300. Minimum viewers is normalized to a non-negative integer and the public UI initially exposes only the accepted presets. Unknown category IDs return an explicit zero selected population rather than silently reverting to `all`.

## 7. Response requirements

The additive API response must expose population metadata sufficient for the UI to explain what happened:

```text
populationFilter.selectedTop
populationFilter.minViewers
populationFilter.selectedCategory
populationFilter.categoryState
populationFilter.categoryAvailable
populationFilter.categoryCoverageState
populationFilter.preCategoryStreams
populationFilter.selectedPopulationStreams
populationFilter.selectedPopulationViewers
populationFilter.unknownCategoryStreams
populationFilter.availableCategories[]
```

`availableCategories` is derived after Top-N and minimum-viewer scoping but before applying the selected category, so changing category does not erase the category selector's valid options.

All existing mapped/unmapped coverage values then describe the selected population, not the original Top 300.

## 8. Category missing/partial behavior

`category=all` includes rows with missing category evidence because category is not a placement requirement.

A specific category includes only rows whose aligned category reference resolves to that category ID.

If the category contract is unavailable or misaligned:

- `category=all` continues with the selected Top-N/min-viewer population and reports category unavailable;
- a specific category produces an explicit zero population with `categoryState=category_unavailable`;
- the UI must not silently fall back to all categories.

## 9. UI requirements

The first population-control UI will expose three controls:

1. Top N
2. Minimum viewers
3. Category

The UI must state:

```text
Population order: overall Top N -> minimum viewers -> category -> location evidence filters.
```

Changing any population control refetches the real Stream Map API. Existing source/type controls remain client-side and are reset only if the user explicitly resets them; population changes must not silently alter evidence selections.

Selected-country state may remain selected across a population change. If the selected country disappears, retain the selection and show the existing explicit zero-result state.

## 10. Verification gate

Before merge, automated verification must prove:

- Top N is applied before category;
- category never refills from below the Top-N boundary;
- minimum viewers never refills from below the Top-N boundary;
- API mapped + unmapped = selected population;
- API unmapped reason totals = API unmapped count for the selected population;
- category missing/unknown/unavailable states are explicit;
- language is not used for placement or population filtering in this implementation;
- source/type filters continue to operate after population selection;
- country selection remains drilldown-only;
- no collector/D1 schema/cadence/retention change is introduced.

## 11. Hard boundaries

- No language control until language is actually retained by an accepted source contract.
- No category-to-country inference.
- No language-to-country inference.
- No client-only population filtering that cannot reconcile unmapped reasons.
- No collector request or persistence expansion merely to deliver this first population-control PR.
- No Kick population controls implied by Twitch acceptance.
