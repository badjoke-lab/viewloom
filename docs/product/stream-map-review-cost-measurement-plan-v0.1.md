# Twitch Stream Map reviewed-evidence review-cost measurement plan v0.1

Status: candidate for acceptance  
Parent issue: #998  
Preparation issue: #999  
Provider: Twitch only  
Public geography scope: country only

## Purpose

The first two fixed Top 20 reviews established useful explicit country-evidence yield but did not prove recurring manual operating cost. The first sample had no review-time instrumentation. The second sample required instrumentation, but its exact pre-research `reviewStartedAt` was not durably retained and therefore the cost gate was correctly left unproven.

This plan defines one fresh, independently clocked bounded cost measurement. It does not itself authorize recurring acquisition.

## Why this is a fresh third sample

Do not reuse #989 or #995 as the cost-measurement population. Prior research on those identities would create familiarity bias and could make review appear cheaper than a real future maintenance pass.

The cost measurement therefore uses a newly captured unbiased Twitch Top 20 identity sample.

## Earliest permitted sample acquisition

#995 sample time:

```text
2026-08-23T02:28:43.300Z
```

Minimum separation:

```text
6 hours
```

Hard not-before timestamp:

```text
2026-08-23T08:28:43.300Z
2026-08-23 17:28:43.300 Asia/Tokyo
```

A sample captured earlier is invalid for this gate.

## Acquisition contract

Exactly one fresh current Twitch Top 20 identity sample.

Allowed:

- Twitch app access token request;
- one supported `/helix/streams` request;
- rank, Twitch user ID, login, display name and viewers;
- sample timestamps and request counters.

Required hard limits:

```text
token requests          <= 1
/helix/streams requests <= 1
/helix/users requests    = 0
D1 writes               = 0
production deploy       = false
sample identities       = 20
```

Prohibited retention in the sample artifact:

- title;
- tags;
- language;
- profile description;
- category;
- geography;
- coordinates;
- address.

No geography preselection, person-only preselection, refill, or replacement is allowed. Non-person rows remain in the denominator.

## Review policy

Apply `stream-map-reviewed-evidence-maintenance-policy-v0.1.md` unchanged.

Accepted source classes:

1. self-controlled current statement;
2. official affiliated source explicitly about the person;
3. attributable editorial/interview source;
4. reviewed transcript of a direct self-statement.

Rejected as standalone placement evidence:

- aggregator or search-result snippet;
- nationality;
- birthplace;
- language;
- timezone;
- category;
- name/handle cue;
- IP-derived location;
- organization/team headquarters;
- event venue;
- temporary/planned travel;
- tag-only geography;
- home/origin converted to current-location evidence.

## Timing instrumentation

The timing sequence is strict and fail-closed.

### Before any research

Create the measurement record and durably write:

```text
reviewStartedAt=<UTC timestamp>
```

This write must happen before the first external/manual lookup, search, page open, transcript search, profile review, or other research action for any of the 20 identities.

### During review

For every identity, retain:

```text
rank
login
entityKind
searchAttempts
terminalOutcome
acceptedEvidenceSourceClass or null
countryCode or null
claimKind or null
conflictDetected
```

`searchAttempts` counts every distinct research query/lookup attempt including failed and rejected-source paths. Maximum: 5 per identity.

Terminal outcomes:

```text
accepted
no_qualifying_evidence
excluded_nonperson
conflict_unmapped
```

### After the twentieth terminal outcome

Immediately durably write:

```text
reviewFinishedAt=<UTC timestamp>
```

Then derive:

```text
wallClockReviewMinutes
minutesPerReviewedIdentity
minutesPerAcceptedIdentity
```

The derived values must come only from the retained timestamps and counts.

## Invalid measurement conditions

The measurement is invalid and cannot be repaired retroactively if any of the following is true:

- `reviewStartedAt` is absent;
- `reviewStartedAt` was recorded after research started;
- `reviewFinishedAt` is absent;
- sample captured before the hard not-before timestamp;
- sample size is not exactly 20;
- any identity is refilled/replaced;
- any identity exceeds five distinct search attempts;
- request/write/deploy boundaries are exceeded;
- prior #989/#995 researched identities are deliberately selected instead of taking the unbiased Top 20;
- timing is estimated from chat timestamps or reconstructed after the fact.

An invalid measurement does not fail the cost threshold; it produces `measurement_valid=false` and no authorization.

## Required retained artifact

The final measurement record must contain at least:

```text
schemaVersion
provider
sampleCapturedAt
sampleNotBeforeAt
sampleIdentities
sampleViewers
sampleOverlapFirstCount
sampleOverlapSecondCount
reviewStartedAt
reviewFinishedAt
wallClockReviewMinutes
reviewedIdentities
acceptedIdentities
excludedNonPersonIdentities
eligibleUnmappedIdentities
conflictUnmappedIdentities
currentLocationAcceptedIdentities
minutesPerReviewedIdentity
minutesPerAcceptedIdentity
acceptedSourceMix
rawAcceptedCoverage
personEligibleAcceptedCoverage
mappedViewerCoverage
measurementValid
invalidReasons
recurringProposalGatePassed
```

The per-identity review ledger must also be retained.

## Frozen decision thresholds

These thresholds are inherited unchanged from #994:

```text
raw accepted country coverage             >= 10%
person-eligible accepted country coverage >= 15%
wall-clock review time                     <= 120 minutes / 20 identities
minutes per accepted identity              <= 30 minutes
accepted evidence quality                  100% explicit attributable
silent country conflicts                   = 0
```

Every threshold must pass and `measurementValid` must be true.

## Authority if the gate passes

A passing measurement authorizes **only** drafting a separate bounded recurring-reviewed-evidence maintenance proposal.

It does not authorize execution of recurring maintenance.

## Hard stops regardless of result

No automatic authorization for:

- persistent external/social/panel crawling;
- automatic search-result acceptance;
- City public fields;
- Current Location/IRL;
- Kick Map;
- Twitch/Kick geographic aggregation;
- collector cadence changes;
- D1 schema or binding changes;
- retention expansion;
- backfill;
- production mutation.

## Execution sequence

1. Merge the preparation contract before sample acquisition.
2. Do not sample before `2026-08-23T08:28:43.300Z`.
3. Capture one unbiased Top 20 in verification-only infrastructure.
4. Retain sample artifact with zero geography.
5. Durably record `reviewStartedAt` before research.
6. Review all 20 under the unchanged #994 policy and five-attempt cap.
7. Durably record `reviewFinishedAt` after the twentieth terminal outcome.
8. Compute cost/yield metrics from retained timestamps and ledger.
9. Retain final audit and exact regression if reviewed evidence is accepted.
10. Close temporary sampling infrastructure without merge.
11. Only if the frozen all-pass gate passes, prepare a separate recurring-maintenance proposal. Otherwise leave recurring acquisition unauthorized.
