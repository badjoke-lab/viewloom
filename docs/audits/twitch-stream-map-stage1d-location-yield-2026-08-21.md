# Twitch Stream Map Stage 1D location yield audit — 2026-08-21

Status: COMPLETE — live extraction and bounded candidate review frozen
Platform: Twitch
Observed population: current global `/helix/streams` ranking, 3 pages / 300 stream rows
Production deployment: none
Production D1 mutation: none
Raw non-candidate profile/title/tag persistence: none
Language-to-country placement: prohibited and not used

## Final audit execution

The final audit was executed on a Cloudflare Worker **version preview**, not production traffic. The candidate Worker reused the existing Worker-resident `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` without exposing them to GitHub Actions.

Final run:
- GitHub Actions workflow: `Twitch Location Preview Audit`
- run id: `32494259489`
- observed at: `2026-08-21T14:50:08.944Z`
- artifact id: `9450972331`
- candidate Worker head: `3cbc7b8900cf6c4ba0228c6d50d26c092f1d4845`

The final run used:
- 1 Twitch app-token request
- 3 `/helix/streams` requests
- 3 `/helix/users` requests, batched at <=100 unique user IDs each
- 0 D1 writes
- 0 raw profile/title/tag/language writes
- no production Worker deployment

The 300 stream rows contained 299 unique user IDs. `/helix/users` returned all 299 requested users. 275 unique users had a non-empty description; because one user appeared in more than one stream row, 276 of the 300 stream rows were enriched with a non-empty profile description.

## Source availability

| Source field | Available in final stream rows | Extra Twitch API | Placement use |
| --- | ---: | ---: | --- |
| Stream title | 300 / 300 | 0 beyond existing stream pages | candidate source |
| Stream tags | 300 / 300 | 0 beyond existing stream pages | ambiguous candidate source |
| Stream language | 300 / 300 | 0 beyond existing stream pages | context/filter only; never placement |
| User/profile description | 276 / 300 stream rows; 275 / 299 unique users | 3 batched `/helix/users` calls | candidate source |
| Independent native channel geographic field | 0 | n/a | not proven to exist |

Current public Helix channel surfaces do not expose an independent country/city field. For Stage 1D accounting, independent `channel_profile` geographic yield is therefore 0 until a separately attributable public source is proven.

## Final conservative candidate yield

| Metric | Count |
| --- | ---: |
| observed_streamers / stream rows | 300 |
| unique users requested from `/helix/users` | 299 |
| profile_candidates | 3 |
| title_candidates | 0 |
| tag_candidates | 7 |
| channel_candidates | 0 independent native field |
| any_candidate | 10 |
| candidate_unknown | 290 |
| profile_only | 3 |
| title_only | 0 |
| tag_only | 7 |
| profile+title | 0 |
| profile+tag | 0 |
| title+tag | 0 |
| 3+ sources | 0 |
| country candidate streams | 10 |
| city candidate streams | 0 |
| home/base candidate streams | 1 |
| declared-country candidate streams | 3 |
| current-location candidate streams | 0 |
| ambiguous candidate streams | 7 |
| candidate conflicts | 1 |
| future/planned-travel title rejects | 2 |

Candidate coverage before acceptance is **10 / 300 = 3.33%**. Candidate-unknown is **290 / 300 = 96.67%**.

Candidate country occurrences in the final run:
- GB 3
- BR 1
- FI 1
- JP 1
- NL 1
- NO 1
- PL 1
- SE 1
- TH 1
- US 1

These are candidate occurrences only, not accepted map placements.

## Parser corrections proven by the live review

Two semantic defects were found and corrected before freezing Stage 1D:

1. A title such as `EWC IN PARIS WATCHPARTY` was initially matched by a generic `in Paris` rule. Generic `in`, `at` and `from` title cues were removed. Title current-location candidates now require strong wording such as `live from`, `live in`, `IRL in`, `streaming from`, `currently in`, or `right now in`. The final run therefore produced **0 title candidates**.
2. A profile stating `I'm from Poland but currently live in the UK` was initially treated as a multi-country conflict. Claim types are now preserved separately: Poland is `declared_country`; United Kingdom is `home_or_base`. Different claim types are not collapsed into one conflicting location.

Conflict accounting now reports a conflict only when the **same claim type** points to more than one country or more than one distinct city. The final run has **1 candidate conflict**: a tag-only record containing both Norway and Sweden. Because tag semantics are ambiguous, neither is accepted as placement evidence.

## Bounded candidate review

Only the 10 candidate-matched stream records were exposed in the preview artifact. Raw non-candidate rows were not included.

### Accepted profile claims

| Streamer | Source | Claim | Type | Decision |
| --- | --- | --- | --- | --- |
| `singsing` | account profile | Netherlands | declared_country | accepted |
| `dorotka22_` | account profile | Poland | declared_country | accepted |
| `dorotka22_` | account profile | United Kingdom | home_or_base | accepted |
| `dttodot` | account profile | Thailand | declared_country | accepted |

This is **3 accepted streamers**, **4 accepted country evidence records**, **0 accepted city records**, and **0 accepted current-location records**.

### Not accepted

All seven tag-only candidate streamers remain unaccepted because a geographic tag does not, by itself, prove home/base, declared country, or current location. This includes the Norway+Sweden tag conflict. No language value is promoted to geographic evidence.

The earlier Paris watchparty title candidate is no longer produced by the corrected parser and is therefore rejected by construction.

## Accepted coverage after review

For this final 300-row live sample:

```text
accepted_country_streamers = 3
accepted_country_evidence_records = 4
accepted_city_streamers = 0
accepted_current_location_streamers = 0
mapped_streamers_from_native_sources = 3
unmapped_streamers_after_review = 297
mapped_percent_from_native_sources = 1.00%
current_location_coverage = 0.00%
```

The native platform sources are therefore far below useful map coverage even though title/tags/language fields themselves are nearly universal and profile descriptions are common.

## Stage 1D decision

Stage 1D is complete. The measured result forces an acquisition decision rather than a direct broad-map rollout:

1. Do **not** treat source-field availability as geographic coverage.
2. Do **not** accept tag-only country names as placement evidence.
3. Do **not** publish a broad country map from the current native-source set; accepted native coverage is only **1.00%** in the final live sample.
4. Do **not** advance to City, Current Location, or IRL work from this evidence level.
5. The measured gap is sufficient to justify the next acquisition audit for separately attributable sources, beginning with official external links and bounded manual review where provenance can be retained.
6. Language remains filter/context metadata only and is never a fallback geographic inference.
7. Any later real-live join must report mapped and unmapped populations explicitly; it must not silently hide the 99% native-source gap.
