# Twitch Stream Map reviewed-evidence maintenance closeout — run 32647808047

Status: **invalid for evidence mutation / retained for audit**  
Provider: Twitch only  
Authorization issue: #1015  
Acquisition workflow run: 32647808047  
Finish workflow run: 32651990010

## Durable timing

```text
reservedAt:          2026-08-23T15:12:18.093Z
sampleObservedAt:    2026-08-23T15:12:32.244Z
reviewStartedAt:     2026-08-23T15:12:34.017Z
reviewFinishedAt:    2026-08-23T16:32:51.965Z
wallClockReviewMinutes: 80.29913333333333
```

The finish marker was written by the finish workflow after all 20 terminal outcomes had been recorded. The 120-minute wall-clock ceiling passed.

## Acquisition invariants

```text
sample identities:                20
sample viewers:               539595
Twitch app-token requests:         1
/helix/streams requests:           1
/helix/users requests:             0
D1 writes:                         0
production Worker deployment: false
refill:                         none
geography preselection:         none
```

The sample artifact retained only the accepted identity/rank/viewer allowlist plus run metadata.

## Terminal outcome metrics

```text
reviewedIdentities:                    20
acceptedIdentities:                     6
excludedNonPersonIdentities:            5
personEligibleIdentities:              15
eligibleUnmappedIdentities:             9
conflictUnmappedIdentities:             0
currentLocationAcceptedIdentities:      0
officialExternalAccepted:               5
manualReviewAccepted:                   1
rawAcceptedCoverage:               30.00%
personEligibleAcceptedCoverage:    40.00%
mappedViewers:                     169423
mappedViewerCoverage:        31.3981782633%
silentCountryConflicts:                 0
```

Fresh accepted evidence reused in this review included `ohnepixel`, `papaplatte`, `fps_shaka`, and `hutchmf`. New qualifying evidence was found for `eliasn97` and `paradeev1ch`, but this run is not allowed to mutate the accepted evidence set because the review budget was violated.

## Invalidating finding

`indegnasen0706` consumed six distinct search/lookup attempts. Two attempts were used to resolve the sampled login/display-name identity mismatch and four more were used for location/source checks.

The accepted maintenance policy allows at most five distinct search attempts per reviewed identity. Identity-resolution searches are part of the same bounded review work and cannot be treated as a separate free allowance.

Therefore:

```text
wallClockValid: true
reviewBudgetValid: false
evidenceMutationAuthorized: false
```

The run is fail-closed. No newly found accepted country evidence from this run may be added to the canonical reviewed-evidence set. Existing fresh accepted evidence remains unchanged.

## Corrective action

Before the next authorized run, the runbook and harness verifier must require all of the following:

1. identity-resolution searches count toward the same five-attempt identity budget;
2. the per-identity counter is incremented before each distinct external search/lookup attempt;
3. when the counter reaches five without a terminal accepted/conflict/non-person result, the identity must end as `no_qualifying_evidence`;
4. a sixth distinct search/lookup attempt is forbidden;
5. the search-attempt count is retained with every terminal outcome.

No City, Current Location/IRL, Kick, automatic cron, persistent crawler, `/helix/users`, D1, production deployment, collector cadence, retention, or public geography expansion is authorized by this closeout.
