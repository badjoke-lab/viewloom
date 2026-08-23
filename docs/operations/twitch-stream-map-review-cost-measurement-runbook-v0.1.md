# Twitch Stream Map review-cost measurement runbook v0.1

Status: preparation only until #1003 retains a valid fresh sample  
Parent: #998  
Sample issue: #1003  
Harness issue: #1004

## Purpose

This runbook prevents the missing-start-timestamp failure that invalidated the #995 cost measurement.

The fresh sample must already exist before any streamer research begins. Do not use the #989/#995 populations as the measurement population.

## Hard order

1. Confirm the #1003 sample was captured at or after `2026-08-23T08:28:43.300Z`.
2. Confirm the sample contains exactly 20 rows and only `rank`, `twitchUserId`, `login`, `displayName`, `viewers`.
3. Copy `docs/audits/twitch-stream-map-review-cost-result-template-v0.1.json` into a new dated measurement result file.
4. Populate the exact sample rows and sample timing.
5. Immediately before the first external/manual lookup, obtain the exact current UTC timestamp.
6. Write that timestamp to `reviewStartedAt`, set `researchStartedAfterDurableStartMarker=true`, and commit that file to GitHub.
7. Confirm the commit exists remotely. **Only then may the first external/manual lookup begin.**
8. Review identities in fixed rank order 1 through 20. Count every distinct search attempt, including failed and rejected-source checks. Maximum five per identity.
9. For each identity, retain a terminal outcome: `accepted`, `no_qualifying_evidence`, `excluded_nonperson`, or `conflict_unmapped`.
10. Immediately after rank 20 reaches a terminal outcome, record exact UTC `reviewFinishedAt` and commit it.
11. Run:

```text
node scripts/evaluate-twitch-stream-map-review-cost-result.mjs <measurement-result.json>
```

12. Retain the evaluator output as the final measurement audit. Do not edit derived metrics by hand.

## Fail closed

The measurement is invalid when any of the following occurs:

- research begins before the durable `reviewStartedAt` commit exists;
- the start timestamp is reconstructed later;
- the sample was captured before the accepted not-before time;
- the sample is not exactly 20 identities;
- the sample contains forbidden retained fields;
- an identity exceeds five distinct search attempts;
- fewer than 20 terminal review outcomes are present;
- an accepted row is not explicit attributable evidence;
- a non-person row is accepted as a person;
- a current-location claim is activated as accepted placement;
- a conflicting accepted country is silently accepted.

If invalid, keep the invalid audit and reasons. Do not invent a replacement time or silently restart the same population.

## Frozen decision thresholds

```text
raw accepted country coverage             >= 10%
person-eligible accepted country coverage >= 15%
wall-clock review time                     <= 120 minutes / 20 identities
minutes per accepted identity              <= 30 minutes
accepted evidence quality                  100% explicit attributable
silent country conflicts                   0
```

The evaluator may report a valid measurement with `recurringProposalGatePassed=false`; that is a legitimate result, not a CI defect.

## Authority boundary

Even a passing result authorizes only drafting a separate recurring-maintenance proposal. It does not authorize recurring acquisition, persistent crawlers, automatic search acceptance, City, Current Location/IRL, Kick Map, collector cadence changes, D1 schema/binding changes, retention expansion or production mutation.
