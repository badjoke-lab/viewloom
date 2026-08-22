# Twitch Stream Map population coverage audit — 2026-08-23

Status: accepted read-only production evidence  
Provider: Twitch only  
Production mutation: none

## Audit identity

Verification-only PR: `#982`  
Workflow: `Twitch Stream Map Population Coverage Audit`  
Workflow run: `32583205617`  
Successful audit job: `97056168203`  
Successful artifact: `9478398925`  
Audit workflow head: `66f7e5106b2b6f2336a839ec98dd885855af1c86`  
Artifact report generated: `2026-08-22T16:01:56Z`  
Observed Twitch snapshot: `2026-08-22T16:00:18.854Z`

The workflow performed read-only HTTPS GET requests against `https://www.viewloom.net/twitch/map/` and `https://www.viewloom.net/api/twitch-stream-map`. It did not deploy production, write D1, invoke collectors, alter cadence/retention, or change evidence acceptance.

## Production contract verification

The deployed route contained all three population controls:

```text
data-population-top           present
data-population-min-viewers   present
data-population-category      present
```

The successful API responses verified:

```text
version                                  viewloom-stream-map-live-v1
platform                                 twitch
source                                   real
state                                    ready
populationFilter                         object
semantics.populationFilterBeforeEvidenceFilter      true
semantics.languageUsedForPlacement                    false
semantics.languageUsedForPopulationFiltering         false
mappedStreams + unmappedStreams = observedStreams    true
sum(unmappedReasons) = unmappedStreams                true
```

A preceding verification attempt exposed that ready responses omitted the two population-level semantic flags even though empty/error responses contained them. PR #983 fixed that response-contract gap without changing placement or population selection logic. The final successful audit was run after the production response contract converged.

## Baseline Top 300

At `updatedAt=2026-08-22T16:00:18.854Z`:

```text
selected population streams        300
selected population viewers        1,358,840
mapped streams                     0
mapped viewers                     0
mapped stream percent              0%
mapped viewer percent              0%
mapped countries                   0
current-location streams           0
excluded non-person streams        1
excluded non-person viewers        20,413
multi-source mapped streams        0
conflicting accepted evidence      0
no reviewed evidence               298
context-only/unaccepted evidence   1
unknown-category streams           1
dictionary-missing items           0
```

`mappedBySource` was empty because there were no mapped streams in this live population.

## Top-N scopes

| Scope | Streams | Viewers | Mapped | Mapped viewers | Excluded non-person | No reviewed evidence | Context-only / unaccepted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Top 20 | 20 | 477,236 | 0 | 0 | 1 | 18 | 1 |
| Top 50 | 50 | 757,507 | 0 | 0 | 1 | 48 | 1 |
| Top 100 | 100 | 965,851 | 0 | 0 | 1 | 98 | 1 |
| Top 300 | 300 | 1,358,840 | 0 | 0 | 1 | 298 | 1 |

No Top-N scope produced a mapped country or current-location stream.

## Minimum-viewer scopes

The audited Top 300 snapshot happened to contain no stream below 1,000 viewers, so the `>=1,000` scope remained identical to Top 300.

| Scope | Streams | Viewers | Mapped | Mapped viewers | Excluded non-person |
| --- | ---: | ---: | ---: | ---: | ---: |
| Top 300, >=1,000 viewers | 300 | 1,358,840 | 0 | 0 | 1 |
| Top 300, >=5,000 viewers | 57 | 795,253 | 0 | 0 | 1 |
| Top 300, >=10,000 viewers | 30 | 597,709 | 0 | 0 | 1 |

Raising the viewer threshold did not produce accepted mapped coverage.

## Current high-volume category scopes

The top five categories by total viewers in the audited Top 300 were used as category slices.

| Top 300 category | Streams | Viewers | Mapped | Excluded non-person |
| --- | ---: | ---: | ---: | ---: |
| Fortnite | 29 | 219,546 | 0 | 0 |
| Counter-Strike | 21 | 150,172 | 0 | 1 |
| Just Chatting | 40 | 138,720 | 0 | 0 |
| League of Legends | 15 | 136,677 | 0 | 0 |
| IRL | 8 | 55,639 | 0 | 0 |

The first three categories were also measured inside the overall Top 100 boundary:

| Top 100 category | Streams | Viewers | Mapped | Excluded non-person |
| --- | ---: | ---: | ---: | ---: |
| Fortnite | 15 | 188,315 | 0 | 0 |
| Counter-Strike | 10 | 131,374 | 0 | 1 |
| Just Chatting | 12 | 81,495 | 0 | 0 |

These results also confirm the accepted no-refill semantics: category slices are taken from inside the selected overall Top-N population.

## Category contract state

Top 300 category coverage was `partial` because exactly one stream had no category reference. There were zero dictionary-missing items. Top 20/50/100 and the >=5,000 / >=10,000 scopes had observed category coverage with zero unknown-category streams.

The one missing category reference is therefore a bounded source-data gap, not a dictionary failure.

## Coverage decision

The production evidence does **not** support proceeding to City, fresh Current Location, or IRL geographic emphasis yet.

Reason:

- every audited population scope had `mappedStreams=0`;
- narrowing by overall rank did not improve coverage;
- narrowing by viewer threshold did not improve coverage;
- narrowing to the current highest-volume categories did not improve coverage;
- there were no mapped-source yields or source-overlap patterns to exploit;
- the dominant reason was `no_reviewed_evidence`, not conflicting accepted geography;
- current-location coverage was zero in every scope.

This does not mean population filtering failed. Population filtering behaved correctly and reconciled its selected populations. It means the currently retained reviewed-location evidence does not overlap the audited live Twitch population enough to make geography useful on its own.

## Accepted next boundary

Do not increase coverage by inference or unsupported crawling.

Specifically, this audit does not authorize:

- language-to-country inference;
- category-to-country inference;
- name/timezone/IP inference;
- candidate-only placement;
- silent conflict resolution;
- unsupported persistent Twitch panel/social crawling;
- Twitch/Kick aggregation.

The next Stream Map work should be a separately bounded **coverage remediation / supported evidence acquisition gate**. It must measure whether attributable, reviewable sources can materially improve accepted live overlap before City/Current/IRL work resumes.

Candidate remediation paths remain source-separated:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Any remediation experiment must report incremental accepted mapped streamers, request/review cost, source overlap, conflicts, and freshness requirements. If that bounded experiment still cannot produce useful coverage, preserve the low-coverage map honestly rather than weakening placement rules.

## Closure rule

PR #982 is verification-only. After this audit record and the updated roadmap/schedule are merged, close #982 without merging its temporary workflow.
