# Twitch Stream Map second fixed Top 20 replication plan v0.1

Status: proposed execution plan  
Depends on: `stream-map-reviewed-evidence-maintenance-policy-v0.1.md`

## Goal

Repeat the unbiased fixed Top 20 location-evidence review at a different observation time using the exact maintenance rules frozen before measurement.

This replication determines whether the first sample's country-evidence yield is stable enough, and cheap enough in manual review time, to justify a separate recurring-maintenance proposal.

## Execution order

### R1 — accept policy before measurement

Merge the maintenance policy before capturing the second sample. Do not change thresholds after seeing the second sample.

Frozen recurring-proposal gate:

```text
raw accepted country coverage             >= 10%
person-eligible accepted country coverage >= 15%
wall-clock review time                     <= 120 minutes / 20 identities
minutes per accepted identity              <= 30 minutes
accepted evidence quality                  100% explicit attributable sources
silent country conflicts                   0
```

### R2 — capture fixed sample

Use a verification-only PR and supported Twitch `/helix/streams` access.

Requirements:

- capture at least six hours after #989's `2026-08-22T17:28:10.752Z` sample;
- exactly current overall Top 20 by viewers;
- no geography-triggered selection;
- no refill for non-person identities;
- one bounded streams acquisition;
- zero D1 writes;
- no production deploy;
- artifact retains only rank, Twitch user ID, login, display name and viewers.

The workflow must publish:

```text
capturedAt
streamRequestCount
sampleSize
sampleViewers
sample identities
```

### R3 — start review-time clock

Immediately before external/manual review, record `reviewStartedAt` using an independent current-time source.

Do not start the clock after easy identities have already been researched.

### R4 — review all 20 consistently

For every identity:

1. classify entity kind;
2. inspect self-controlled sources;
3. inspect official affiliated sources;
4. inspect attributable editorial/interview sources;
5. verify any underlying source found through search snippets/aggregators;
6. accept only explicit placeable evidence;
7. classify as accepted / no-evidence / non-person / conflict;
8. retain source URL and source class for every accepted record;
9. stop at five distinct search attempts for an identity unless a conflict discovered within the bound requires classification.

Do not use:

- nationality;
- birthplace;
- language;
- timezone;
- category;
- name cues;
- IP;
- event venue;
- organization HQ;
- unverified snippets/aggregators.

### R5 — stop review-time clock

After all 20 identities have final outcomes, record `reviewFinishedAt` and calculate wall-clock review minutes.

The clock includes failed searches and source validation.

### R6 — produce a review ledger

Retain a bounded audit ledger with one row per sample identity:

```text
rank
login
viewers
entityKind
outcome
countryCode|null
countryName|null
retainedRegion|null
retainedCity|null
claimKind|null
evidenceSource|null
sourceUrl|null
sourcePublishedAt|null
reviewNotes
```

`reviewNotes` must remain concise and must not copy long copyrighted text. Record why a tempting source was rejected when that distinction matters to the decision.

No private address/coordinate data may be recorded.

### R7 — calculate metrics

Required:

```text
sampleSize
sampleViewers
sampleOverlapCountWith989
sampleOverlapPercentWith989
acceptedPlaceablePersons
excludedNonPersonIdentities
personEligibleIdentities
eligiblePersonsWithoutAcceptedEvidence
acceptedCountryConflicts
acceptedCurrentLocationRecords
officialExternalCount
manualReviewCount
mappedViewers
rawAcceptedCoverage
personEligibleAcceptedCoverage
mappedViewerCoverage
wallClockReviewMinutes
minutesPerReviewedIdentity
minutesPerAcceptedIdentity
```

#989 comparison baseline:

```text
sampleSize                        20
sampleViewers                473,630
acceptedPlaceablePersons            4
excludedNonPersonIdentities          5
personEligibleIdentities            15
rawAcceptedCoverage             20.00%
personEligibleAcceptedCoverage  26.67%
mappedViewerCoverage            28.4591%
officialExternalCount                3
manualReviewCount                     1
acceptedCurrentLocationRecords        0
acceptedCountryConflicts              0
```

### R8 — implementation boundary

If new accepted country evidence is found:

- add it only through a dedicated reviewed-evidence PR;
- keep provenance separated;
- keep country-only public projection active;
- keep city/region internal;
- add exact regression fixtures for the second sample;
- do not change acquisition runtime, collector, D1, cadence or retention.

If no new evidence is accepted, do not manufacture implementation work merely to produce a PR.

### R9 — decision

Report pass/fail for each frozen threshold separately.

A full pass means only:

> A separately scoped recurring reviewed-evidence maintenance proposal may be designed.

It does not mean recurring automation is already accepted.

Any failed threshold means recurring acquisition is not authorized from the two-sample evidence base.

## Production verification

After any new reviewed evidence implementation merges, a read-only production observation may verify current semantics. Do not require reviewed targets to be live at a specific time, and do not claim non-vacuous live-row proof when `mappedStreams=0`.

## Closeout

The replication closeout must update:

- `docs/product/current-schedule.md`;
- `docs/product/current-roadmap.md`;
- `docs/README.md` if the authoritative audit list changes;
- a dated replication audit under `docs/audits/`.

The temporary sample workflow PR must close without merge after its artifact/result is retained.
