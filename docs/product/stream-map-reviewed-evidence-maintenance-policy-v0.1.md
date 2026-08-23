# Stream Map reviewed-evidence maintenance policy v0.1

Status: proposed gate for acceptance  
Provider scope: Twitch only  
Public placement scope: country only

## 1. Purpose

The first unbiased fixed Top 20 review produced four accepted placeable person records out of twenty sampled identities (`20.00%` raw coverage; `26.67%` among the fifteen person-eligible identities). That is materially better than the `1.00%` same-sample ceiling of the Twitch-native tag/profile/title candidate lane.

This policy defines how reviewed `official_external` / `manual_review` evidence may be collected, refreshed, conflicted, expired and measured before any recurring maintenance process is authorized.

It does **not** authorize:

- persistent external/social crawling;
- automatic external search-result acceptance;
- City rollout;
- Current Location/IRL rollout;
- Kick rollout;
- collector, D1, cadence or retention changes;
- language/category/name/timezone/IP geography inference.

## 2. Placement invariant

Only accepted explicit person evidence may create country placement.

```text
candidate/search result -> review -> attributable source -> explicit claim -> accepted evidence -> country placement
```

No earlier step may place a streamer.

The current public API remains country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

Reviewed evidence may retain a publicly declared city/region internally for a future separately gated City stage. It must not become public merely because it is retained.

## 3. Review population

### Replication sample

The second replication sample must:

1. be captured at least six hours after the first #989 sample (`2026-08-22T17:28:10.752Z`);
2. use the supported Twitch live stream surface;
3. take the current overall Top 20 by viewers exactly as returned after normalization;
4. perform no geography-based preselection;
5. perform no replacement/refill when a sampled row is non-person;
6. retain only identity/rank/viewer fields needed for bounded review;
7. not retain title, tags, language, profile text or unrelated stream metadata in the sample artifact.

Non-person rows stay in the raw-sample denominator and are separately excluded from the person-eligible denominator. This prevents denominator manipulation.

### Any future recurring review

No recurring review population or cadence is authorized by this policy alone. The second replication decides whether a recurring process is justified.

## 4. Accepted source classes

A source must identify the streamer unambiguously and support a placeable location claim in context.

### A. Self-controlled current statement

Examples:

- creator-controlled profile location;
- creator-controlled website/about page;
- direct statement on the creator's own stream/video/post.

Use `official_external` when the source itself is self-controlled and directly inspectable.

### B. Official affiliated source

Examples:

- official team/agency/organization bio that explicitly states where the person lives or is based;
- official event/partner profile quoting or clearly attributing the person's current base.

Use `official_external` only when the page identifies the individual and the location claim is about the individual, not the organization headquarters or event venue.

### C. Attributable editorial/interview source

A reputable publication/interview may be accepted when it explicitly states current residence/base or directly quotes the person doing so.

Use `official_external` because the reviewed source is a stable attributable external publication, not because it is an official Twitch field.

### D. Intermediary transcript of a direct self-statement

A timestamped transcript of the creator's own stream/video may be accepted only when:

- the speaker identity is clear;
- the relevant statement is direct and unambiguous;
- enough surrounding context is available to distinguish residence/base from nationality, origin, travel or hypothetical discussion.

Use `manual_review`, not `official_external`.

## 5. Rejected source classes

The following cannot independently create accepted placement:

- search-engine snippets without verification of the source page;
- streamer-stat/profile aggregators;
- Wikipedia or generic biography summaries used alone;
- fan wikis;
- Reddit/community claims used alone;
- chat messages or viewer speculation;
- nationality;
- birthplace;
- language;
- timezone;
- name/handle cues;
- category/game;
- IP/geolocation inference;
- organization headquarters;
- team headquarters;
- event venue;
- temporary travel/location wording;
- planned/future travel;
- country flags/tags without independent explicit evidence.

A rejected source may help locate an underlying attributable source, but it remains a discovery aid only.

## 6. Claim eligibility

### `declared_location`

Placeable when a source explicitly says the person lives, resides, is based, or otherwise currently locates themselves in the country.

A bare self-controlled profile location may count as `declared_location` when it clearly identifies the creator and is not obviously an event/travel marker.

### `home_base`

Placeable when a source explicitly identifies a stable home/base relationship. Do not convert birthplace, hometown, nationality or organization location into `home_base`.

### `current_location`

Not activated by this maintenance gate. A current-location statement may be retained only as non-placeable/context evidence unless a separate Current Location freshness/expiry specification is accepted.

## 7. Precision and privacy boundary

The review may retain only publicly declared geographic granularity needed for future product decisions:

- country: allowed when accepted;
- region/state: may be retained internally if explicitly public;
- city: may be retained internally if explicitly public;
- street address, private residence address, coordinates or other precise residential identifiers: do not collect or retain.

The public Stream Map remains country-only regardless of internally retained city/region evidence.

## 8. Source precedence

Source class does not automatically override time or specificity.

When two sources differ, review in this order:

1. determine whether both claims describe the same concept (`home_base`, `declared_location`, `current_location`);
2. determine source dates/observation dates;
3. prefer a newer explicit self-controlled current statement when it clearly supersedes an older location;
4. otherwise prefer a newer direct attributable statement over an older secondary bio;
5. never use source prestige alone to silently discard a conflicting accepted country.

If temporal supersession cannot be established, retain the conflict and do not map the streamer.

## 9. Conflict handling

### Same country

Multiple accepted sources for the same country are compatible. Preserve provenance separately.

### Different countries

Different accepted country claims are unresolved unless a reviewer can establish explicit temporal supersession, such as a later source clearly stating that the person moved and now lives elsewhere.

Until supersession is established:

```text
conflicting accepted countries -> unmapped
```

No majority vote, source-count vote or platform-priority rule is allowed.

## 10. Staleness and re-review

Country evidence about residence/base changes over time.

For `declared_location` and `home_base`:

```text
review target age  180 days
hard stale age     365 days
```

Rules:

- at 180 days, the record becomes due for re-review but may remain placeable if not contradicted;
- at 365 days without successful refresh/reconfirmation, it becomes stale and must not create placement until reviewed again;
- a newer explicit contradiction triggers immediate re-review regardless of age;
- a removed/unavailable source does not immediately erase a still-young reviewed record, but it must be resolved at the next review target and cannot survive the hard stale boundary without replacement/reconfirmation.

This policy does not define a TTL for `current_location`; that requires a separate gate.

## 11. Evidence changes and withdrawal

During re-review:

- unchanged explicit claim -> refresh review metadata;
- explicit newer move/current-base claim -> supersede the old claim after manual confirmation;
- source removed but corroborating accepted source exists -> preserve the corroborated claim and provenance;
- source removed with no surviving verifiable support -> mark unavailable and stop placement no later than the hard stale boundary;
- source changes to contradict the retained record -> immediately treat as conflict/change requiring review;
- creator explicitly corrects/withdraws the location -> old evidence must not remain silently placeable.

Historical evidence may remain in an audit trail even after it stops being current placement evidence.

## 12. Non-person handling

Every sampled identity must first be classified as:

```text
person
organization
event_broadcast
unresolved
```

Organization/event-broadcast rows:

- remain in raw observed accounting;
- are excluded from the person-eligible denominator;
- are never placed as people;
- are not replaced/refilled in the fixed sample.

A later ownership/branding change may trigger reclassification, but not automatic person placement.

## 13. Bounded review procedure

For each identity:

1. confirm identity/entity kind;
2. inspect self-controlled source candidates first;
3. inspect official affiliated sources;
4. inspect attributable editorial/interview sources;
5. use aggregators/snippets only as discovery aids;
6. verify the underlying source before accepting;
7. record accepted/no-evidence/non-person/conflict outcome;
8. stop once enough explicit evidence establishes the accepted country or the bounded search budget is exhausted.

Replication search budget:

```text
maximum wall-clock review session 120 minutes for all 20 identities
maximum distinct search attempts per identity 5
```

A strong source found early ends further unnecessary searching for that identity. A conflicting source requires enough review to classify the conflict even if the first source looked acceptable.

## 14. Review-time instrumentation

The second replication must record:

```text
reviewStartedAt
reviewFinishedAt
wallClockReviewMinutes
reviewedIdentities
acceptedIdentities
```

Derived metrics:

```text
minutesPerReviewedIdentity = wallClockReviewMinutes / reviewedIdentities
minutesPerAcceptedIdentity = wallClockReviewMinutes / acceptedIdentities
```

If `acceptedIdentities=0`, minutes per accepted identity is reported as null/infinite and the recurring-cost gate fails.

The wall-clock measurement includes source search, source verification and classification. Do not subtract failed searches merely to improve the metric.

## 15. Replication metrics

The second fixed Top 20 report must contain:

```text
sample capturedAt
sample size
sample viewers
sample overlap with #989
accepted placeable persons
excluded non-person identities
person-eligible identities
eligible persons without accepted evidence
accepted country conflicts
accepted current-location records
source official_external count
source manual_review count
raw accepted coverage
person-eligible accepted coverage
mapped viewer coverage
wall-clock review minutes
minutes per reviewed identity
minutes per accepted identity
```

City values may be counted as retained evidence for future planning but are not a public placement success metric.

## 16. Precommitted recurring-maintenance decision gate

A recurring bounded reviewed-evidence maintenance process may be proposed only if the second replication satisfies **all** of the following:

```text
raw accepted country coverage             >= 10%
person-eligible accepted country coverage >= 15%
wall-clock review time                     <= 120 minutes / 20 identities
minutes per accepted identity              <= 30 minutes
accepted evidence quality                  100% explicit attributable sources
silent country conflicts                   0
```

These thresholds are frozen before the second measurement to avoid moving the goalposts after seeing the result.

Passing the gate authorizes only a separate proposal for bounded recurring maintenance. It does not itself authorize automation, crawling, City, Current Location/IRL or Kick.

Failing any gate means:

- no recurring acquisition process is authorized from these two samples;
- existing reviewed evidence may remain curated under the current staleness rules;
- the Map must continue to show honest low/partial coverage.

## 17. Replication comparison against #989

Reference #989 result:

```text
sample identities                     20
sample viewers                   473,630
accepted placeable persons             4
excluded non-person identities         5
person-eligible identities            15
raw accepted coverage             20.00%
person-eligible accepted          26.67%
mapped viewer coverage            28.4591%
source official_external                3
source manual_review                     1
current-location accepted                0
country conflicts                        0
review minutes            not instrumented
```

The second sample must report overlap rather than replacing overlapping names. High overlap is an empirical result, not a reason to refill the sample.

## 18. Hard stops

- No language/timezone/name/category/IP geography inference.
- No nationality or birthplace converted to residence/base.
- No tag-only acceptance.
- No candidate-only placement.
- No organization/event-broadcast-as-person placement.
- No silent conflict resolution.
- No address/coordinate collection.
- No public region/city leakage before a City gate.
- No current-location activation from this policy.
- No unsupported persistent external/social/panel crawler.
- No permanent acquisition/store/cadence/retention change.
- No Twitch/Kick geographic aggregation.
- No automatic Kick rollout.
