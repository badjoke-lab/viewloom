# Twitch Stream Map reviewed-evidence maintenance runbook v0.1

Status: implementation gate / manual-dispatch only  
Provider: Twitch only  
Public geography: country only

## Purpose

This runbook governs one bounded reviewed-evidence maintenance run after the #994 policy and #1007 measured cost gate. It does not authorize automatic recurring acquisition, cron scheduling, persistent crawling, automatic source acceptance, City, Current Location/IRL, Kick Map, collector cadence changes, D1 schema/binding changes, retention expansion or production mutation.

The installed acquisition harness is inert until an operator explicitly dispatches it for a separately scoped one-run authorization issue.

## One-run authorization issue

Create a dedicated open issue for exactly one run. Its body must contain these five lines exactly:

```text
viewloom-maintenance-authorization-v0.1
provider: twitch
topN: 20
oneRunOnly: true
automaticSchedule: false
```

The issue should also state the purpose of the run and explicitly retain the Stream Map hard boundaries. Reusing one authorization issue for multiple sample runs is forbidden by the one-run contract.

## Dispatch acquisition

Run `.github/workflows/twitch-stream-map-reviewed-evidence-maintenance.yml` manually with:

```text
authorization_issue=<one-run issue number>
acknowledge_one_run=true
reason=<optional note>
```

The workflow is `workflow_dispatch` only. It has no `schedule`, push, pull-request, repository-dispatch or webhook trigger.

Before acquisition it fails closed unless:

- the authorization issue is open;
- every required authorization token is present;
- the operator acknowledged one-run scope;
- there has been no prior maintenance dispatch within the preceding seven days;
- fewer than four prior maintenance dispatches exist in the rolling preceding 30 days.

All dispatch attempts count toward the cadence guard. A failed prior run is not silently ignored merely because it did not produce accepted evidence.

After the cadence guard passes but **before any Twitch API request**, the workflow reserves the authorization issue by writing:

```text
viewloom-maintenance-run-reservation-v0.1
sampleRunId: <workflow run id>
authorizationIssue: <issue number>
reservedAt: <exact UTC timestamp>
oneRunOnly: true
```

The workflow refuses an issue that already has a reservation or review-start marker. This closes the duplicate-acquisition path where sampling could succeed but a later marker step could fail. Once the reservation exists, that authorization issue is consumed even if a later preview/sample step fails; create a new one-run authorization issue rather than replaying the old one.

## Acquisition ceiling

One run may spend only:

```text
Twitch app-token requests       <= 1
/helix/streams?first=20         <= 1
/helix/users                    = 0
D1 writes                       = 0
production Worker deploy        false
sample identities               exactly 20
non-person refill               none
geography preselection          none
```

The workflow creates only a non-production Worker version preview with the dedicated maintenance entry/config. It must use `wrangler versions upload --preview-alias`; `wrangler deploy` is forbidden.

The health request may retry because it does not call Twitch. The Top 20 sample endpoint is called once with no automatic retry because a replay would spend another Twitch request budget.

The retained sample allowlist is exactly:

```text
rank
twitchUserId
login
displayName
viewers
```

Permitted run metadata includes timestamps, request counts, workflow run ID, authorization issue and operator note.

The sample artifact must not retain:

- title;
- tags;
- language;
- profile description;
- category;
- geography;
- coordinates;
- address.

## Durable review clock

After sample validation, the acquisition workflow writes an issue comment before any research:

```text
viewloom-review-start-marker-v0.1
sampleRunId: <workflow run id>
authorizationIssue: <issue number>
reviewStartedAt: <exact UTC timestamp>
researchMayBeginAfterThisMarker: true
```

**Do not begin any external/manual research before that marker exists.**

If the marker is missing, duplicated, late or otherwise invalid, the run is invalid. Do not reconstruct `reviewStartedAt` from chat, browser history, GitHub activity or approximate timestamps.

## Review all 20 sampled identities

Review the fixed sample without refill. Non-person rows remain part of the observed sample and are not replaced.

Terminal outcomes remain:

```text
accepted
no_qualifying_evidence
excluded_nonperson
conflict_unmapped
```

Maximum distinct search rounds: **5 per reviewed identity**. Failed searches and rejected source checks remain inside the measured wall clock.

The accepted source and claim policy remains exactly `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`.

Do not accept geography from language, timezone, name, category, IP, nationality, birthplace, event venue, organization headquarters, temporary/planned travel or tag-only material. Do not convert home/origin evidence into Current Location evidence. Conflicting accepted countries remain **unmapped** unless explicit temporal supersession is manually reviewed.

## Existing accepted evidence / re-review lifecycle

For accepted `declared_location` / `home_base` evidence:

```text
age < 180 days, no contradiction     fresh; may remain without unnecessary source hunting
age >= 180 days                      due for bounded re-review
age >= 365 days without refresh      placement stops until refreshed
new explicit contradiction/change    immediate manual conflict/change review
```

This lifecycle does not authorize a Current Location TTL or Current Location collection. Current Location / IRL remains blocked.

## Finish the review clock

Immediately after all 20 sampled identities reach terminal outcomes, manually dispatch `.github/workflows/twitch-stream-map-reviewed-evidence-review-finish.yml` with:

```text
authorization_issue=<same one-run issue>
sample_run_id=<sample workflow run id>
twenty_terminal_outcomes_complete=true
acknowledge_no_reconstructed_timing=true
```

The finish workflow requires exactly one matching durable start marker and refuses to overwrite an existing finish marker. It posts:

```text
viewloom-review-finish-marker-v0.1
sampleRunId: <workflow run id>
authorizationIssue: <issue number>
reviewStartedAt: <durable start timestamp>
reviewFinishedAt: <exact UTC timestamp>
wallClockReviewMinutes: <derived value>
twentyTerminalOutcomesComplete: true
reconstructedTimingUsed: false
```

The finish marker is persisted before enforcing the 120-minute threshold. Therefore an over-limit run remains auditable rather than losing its exact finish time.

## Result retention

After the finish marker exists:

1. retain all 20 terminal outcomes and search-round counts in a reviewed result file;
2. retain accepted source mix, raw coverage, person-eligible coverage, mapped viewer coverage, conflicts and Current Location count;
3. calculate review cost only from the durable start/finish timestamps;
4. use the existing review-cost result evaluator semantics rather than inventing replacement thresholds;
5. retain accepted reviewed evidence in a normal implementation PR with exact regressions;
6. keep historical sample metrics tied to their historical evidence snapshot when later evidence changes.

No source may be accepted automatically from search output. Human review remains required.

## Public projection invariant

Internal reviewed evidence may retain explicitly public region/city text where allowed by the accepted evidence policy, but public Twitch Map responses remain country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No City rollout follows from a maintenance run.

## Disable / rollback path

The maintenance acquisition mechanism is manual only and has no scheduled trigger. Disabling or deleting `.github/workflows/twitch-stream-map-reviewed-evidence-maintenance.yml` prevents future sample acquisition; no cron or scheduled task survives. Disabling the finish-marker workflow prevents finish-marker creation but does not change runtime data or collector behavior.

The dedicated maintenance Worker config has no triggers and no D1 binding. Uploaded preview versions are not production deployment.

## Authority that remains false

- automatic cron scheduling;
- more frequent execution than the accepted bounded envelope;
- persistent external/social/panel crawling;
- automatic search-result/source acceptance;
- `/helix/users` expansion;
- public City fields;
- Current Location / IRL;
- Kick Map;
- Twitch/Kick geographic aggregation;
- collector cadence changes;
- D1 schema/binding changes;
- retention expansion;
- production mutation.

A maintenance run itself requires a separate one-run authorization issue. Installing this harness does not execute a run.
