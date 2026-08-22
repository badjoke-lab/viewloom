# ViewLoom Stream Map Specification v0.5

Status: current authoritative specification  
Platform scope: Twitch first; Kick later and separately  
Current implementation baseline: main `07eca2c291e4a7c4744a3c9a95013f307c44a9cb`  
Last updated: 2026-08-22

## 1. Product role

Stream Map is ViewLoom's evidence-backed geographic observation view.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

The map must not imply that every observed streamer has a known physical location. Unknown, conflicting, candidate-only and rejected geography remains unmapped.

## 2. Current public surface

Twitch:

- page: `/twitch/map/`
- data API: `/api/twitch-stream-map`
- base live population: latest observed Twitch Top 300 snapshot
- renderer: MapLibre GL JS
- basemap: OpenFreeMap dark style
- grouping: country-level markers and mapped-stream drilldown

Kick has no authorized Stream Map surface. Twitch and Kick geography must not be aggregated.

## 3. Evidence vocabulary

Evidence sources remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location types:

```text
home_base
declared_location
current_location
```

Current confidence vocabulary includes:

```text
explicit
corroborated
reviewed
candidate_only
```

`candidate_only` is not accepted placement confidence.

## 4. Entity eligibility

Entity kinds relevant to the current gate:

```text
person
organization
event_broadcast
unknown
```

Only `person` may be placed on the streamer map.

`organization` and `event_broadcast` remain in observed/unmapped accounting but are not placed as if the channel represented a person's residence or physical position.

## 5. Claim eligibility

Placement-capable claims:

- explicit home/base
- explicit declared location
- explicit current location while valid

Context-only claims do not place a streamer:

- birthplace
- nationality
- event venue
- organization headquarters
- future/planned travel

Examples:

- `LIVE FROM SEOUL` may create a current-location candidate.
- `Japan trip tomorrow` does not establish current location.
- `born in Osaka` does not establish current residence/current location.
- an esports event venue does not locate the organization/event channel as a person.

## 6. Prohibited inference

The following never determine geographic placement:

- language
- timezone
- schedule
- inferred ethnicity/nationality
- name-based guesses
- IP geolocation
- category alone

Language/category may filter or describe an observed population only when their own data contracts support that use. They never create location evidence.

## 7. Conflicts and provenance

- evidence sources remain separate after normalization;
- agreeing evidence may coexist;
- conflicting accepted countries remain unmapped until explicitly resolved;
- current-location evidence does not overwrite home/base evidence;
- source URL and observation time remain attributable where available.

## 8. Live join contract

The API joins:

```text
selected rows from latest DB_TWITCH_HOT.minute_snapshots payload
+ reviewed Twitch location evidence
by stable channelLogin identity
```

Current response contract remains additive under:

```text
viewloom-stream-map-live-v1
```

The API returns at least:

- observed streams/viewers for the selected population
- mapped streams/viewers
- unmapped streams/viewers
- eligible unmapped count
- excluded non-person streams/viewers
- mapped country count
- current-location coverage
- mapped counts by evidence source
- exact unmapped reason counts
- mapped stream records with distinct evidence records

No demo fallback may replace failed or empty real geography.

## 9. Source and type filters

Source selections use OR.

Type selections use OR.

Across dimensions:

```text
(selected source A OR source B ...)
AND
(selected type A OR type B ...)
```

No selected source/type means `All accepted`.

These filters operate after the server has selected the population and performed the placement gate.

Accepted mapped streams hidden by source/type filters remain part of the selected population and become current-view unmapped rows under the derived reason:

```text
filtered_out_accepted_evidence
```

That derived reason is client-view accounting only. It is not an API placement failure or evidence status.

## 10. Country selection and drilldown

PR #977 added true country selection.

- marker and country-row selection are equivalent;
- selected country restricts the mapped streamer drilldown only;
- source/type filters continue to apply;
- selected country persists when filtering produces zero matches;
- zero matches are explicit rather than silently selecting another country;
- clear-country restores all-country drilldown;
- native buttons and `aria-pressed` provide keyboard/tap semantics.

Country selection never changes population, evidence acceptance or unmapped reason totals.

## 11. Reason-aware Unmapped analysis

PR #979 added reason-aware public accounting.

The client preserves exact API reason codes, including current codes such as:

```text
missing_stable_identity
no_reviewed_evidence
excluded_nonperson
entity_kind_unresolved
context_only_or_unaccepted_evidence
conflicting_accepted_evidence
accepted_evidence_without_country
missing_payload_rows
```

The API live-join verifier requires:

```text
sum(unmappedReasons) = API unmappedStreams
```

When source/type filters hide accepted mapped rows, the browser adds only:

```text
filtered_out_accepted_evidence
```

and verifies current-view reason totals against current-view unmapped count.

Candidate-only evidence remains inside the API's existing `context_only_or_unaccepted_evidence` class unless the API contract is explicitly changed; the UI must not silently claim a narrower reason.

Excluded non-person channels are exposed separately with channel/viewer/entity detail while remaining part of unmapped accounting.

## 12. Population filter contract

Decision record:

`docs/product/stream-map-population-filter-decision-v0.1.md`

Accepted pipeline:

```text
latest real Twitch Top 300 snapshot
-> overall Top-N scope
-> minimum-viewer threshold
-> category filter
-> entity/evidence placement gate
-> evidence source/type filters
-> country drilldown
```

Initial controls:

```text
Top N:        20 / 50 / 100 / 300
Min viewers:  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category:     all or one observed category
Language:     deferred
```

`Top 100 + category X` means category X rows inside the overall current Top 100. It does not refill with lower-ranked category-X rows from positions 101-300.

Population filtering belongs in `/api/twitch-stream-map` because the browser does not receive every eligible-unmapped row and therefore cannot truthfully recompute population-wide unmapped reasons by itself.

Accepted query defaults:

```text
top=300
min_viewers=0
category=all
```

Intended query surface:

```text
/api/twitch-stream-map?top=100&min_viewers=500&category=<twitch-category-id>
```

All mapped/unmapped coverage values in the response describe the selected population.

## 13. Category data contract

The current permanent Twitch collector already encodes category using:

```text
categoryContractVersion = category-source-v1
categoryIds[]
categoryRefs[]
provider_category_dictionary
```

The Stream Map must reuse that contract. No second category collector is authorized.

`category=all` keeps unknown/missing-category rows in the population.

A selected category includes only rows resolving to that category ID.

If category data is unavailable/misaligned, a selected category produces an explicit zero/unavailable state rather than silently falling back to all categories.

## 14. Language boundary

Although Twitch Helix `/streams` can provide language, the current permanent `minute_snapshots` payload does not retain it.

Therefore v0.5 does not expose a language population filter.

No fake disabled filter should be displayed. A language control requires a separate accepted collection/storage/cost/retention gate.

Language remains prohibited as placement evidence regardless of future population-filter support.

## 15. Coverage is dynamic

Production observations have shown both zero and nonzero mapped streams in the current Top 300. Those are timestamped observations, not constants.

Low coverage must remain visible rather than being filled by inference.

## 16. Acquisition boundary

- native profile/title/tag evidence provides low accepted coverage;
- external review may add evidence but a bounded sample did not justify permanent unsupported social/panel crawling;
- Twitch social links/panels are not treated as a supported permanent acquisition API;
- low coverage is not authorization for unsupported inference or crawling.

## 17. Completion state

Merged:

- #964 source inventory/audit
- #965 read-only live probe
- #966 title/tag candidate extraction
- #971 entity/claim eligibility + retained evidence
- #972 real latest-snapshot join
- #974 public map + source/type filters
- #977 country selection/drilldown
- #979 reason-aware Unmapped analysis

Verification-only:

- #975 production route/API read verification, closed without merge after success

## 18. Next required gate

### Population filters

Implement v0.5 population semantics without changing collector cadence, retention, D1 schema or permanent Twitch acquisition.

Required verification:

- overall Top N precedes category;
- no category refill below Top-N boundary;
- min viewers does not refill below Top-N boundary;
- mapped + unmapped = selected population;
- unmapped reason total = selected-population unmapped count;
- unknown/unavailable category states are explicit;
- source/type filters still operate after population selection;
- country selection remains drilldown-only;
- language is absent from this implementation.

### Following gates

1. repeated evidence-coverage decision
2. reliable city grouping if evidence supports it
3. current-location freshness/expiry
4. IRL-oriented mode only if useful
5. separate Kick source audit/implementation
6. history/replay after live semantics stabilize

## 19. Hard invariants

- no language-to-country placement
- no category-to-country placement
- no candidate-only placement
- no non-person-as-person placement
- no silent accepted-country conflict resolution
- no Twitch/Kick geographic aggregation
- no demo geography presented as real
- no unsupported crawling merely to inflate coverage
- no client-only population filtering that cannot reconcile unmapped reasons
- D1/schema/cadence/retention/acquisition changes require separate review
