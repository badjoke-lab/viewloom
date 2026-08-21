# Twitch Stream Map Stage 1D location yield audit — 2026-08-21

Status: live audit evidence; candidate review still pending
Platform: Twitch
Observed population: current global `/helix/streams` ranking, up to 3 pages / Top 300
Production deployment: none
Production D1 mutation: none
Raw non-candidate profile/title/tag persistence: none
Language-to-country placement: prohibited and not used

## Audit execution

The audit was executed on a Cloudflare Worker **version preview**, not production traffic. The candidate Worker reused the existing Worker-resident `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` without exposing them to GitHub Actions.

The corrected live run used:
- 1 Twitch app-token request
- 3 `/helix/streams` requests
- 3 `/helix/users` requests, batched at <=100 user IDs each
- 0 D1 writes
- 0 raw profile/title/tag/language writes

Evidence run:
- GitHub Actions workflow: `Twitch Location Preview Audit`
- run id: `32493823215`
- observed at: `2026-08-21T14:45:24.243Z`
- artifact id: `9450810948`

The live ranking changed during repeated audit runs; the corrected run contained 299 streams rather than exactly 300. This is an honest live-observation boundary, not padded data.

## Source availability

| Source field | Available | Extra Twitch API | Placement use |
| --- | ---: | ---: | --- |
| Stream title | 299 / 299 | 0 beyond existing stream pages | candidate source |
| Stream tags | 299 / 299 | 0 beyond existing stream pages | candidate source |
| Stream language | 299 / 299 | 0 beyond existing stream pages | context/filter only; never placement |
| User/profile description | 273 / 299 | 3 batched `/helix/users` calls | candidate source |

Current public Helix channel surfaces do not expose an independent geographic location field. Channel information/search surfaces repeat fields such as language, title and tags rather than providing a separate country/city field. For Stage 1D accounting, independent `channel_profile` geographic yield is therefore currently 0 until a separately attributable public channel-profile source is proven.

## Conservative candidate yield

| Metric | Count |
| --- | ---: |
| observed_streamers | 299 |
| profile_candidates | 2 |
| title_candidates | 1 |
| tag_candidates | 7 |
| channel_candidates | 0 independent native field |
| any_candidate | 10 |
| unknown | 289 |
| profile_only | 2 |
| title_only | 1 |
| tag_only | 7 |
| profile+title | 0 |
| profile+tag | 0 |
| title+tag | 0 |
| 3+ sources | 0 |
| country candidate streams | 9 |
| city candidate streams | 1 |
| multiple-location candidate streams | 2 |
| future/planned-travel title rejects | 3 |
| accepted_country | 0 — acceptance review not yet executed |
| accepted_city | 0 — acceptance review not yet executed |

Candidate coverage before acceptance is **10 / 299 = 3.34%**. Unknown is **289 / 299 = 96.66%**.

Candidate country counts in the corrected run:
- GB 3
- BR 1
- FI 1
- FR 1
- JP 1
- NL 1
- NO 1
- PL 1
- SE 1
- US 1

These are candidate counts only. They are not mapped/accepted country counts.

## Conflict correction

An earlier implementation counted a city candidate and its containing country as two different places. That accounting was corrected so a stream is conflicting only when candidates point to:
- more than one country, or
- more than one distinct city within the same country.

After the correction, the live audit still reported **2 multiple-location candidate streams**, so those two are genuine candidate conflicts under the current parser rather than city+country double-counting.

## Stage 1D decision

The important result is the gap between field availability and geographic yield:
- title/tag/language are almost universally present,
- profile descriptions are present for most observed users,
- but conservative platform-native geographic candidates cover only about 3.3% of the observed population.

Therefore:
1. Do **not** treat field presence as map coverage.
2. Do **not** proceed to broad country-map publication as if native candidate coverage were sufficient.
3. Review the bounded 10 candidate records and accept/reject them with provenance.
4. After candidate review, freeze accepted-country/city/conflict counts.
5. Because the measured native-source gap is large, the acquisition gate is expected to require additional separately attributable sources (official external links and/or bounded manual review) before a useful map can exist.
6. Language remains filter/context metadata only and is never a fallback geographic inference.
