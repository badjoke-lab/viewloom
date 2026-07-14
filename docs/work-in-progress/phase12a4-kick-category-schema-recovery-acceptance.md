# Phase 12A-4 Kick category schema recovery acceptance

Status: current acceptance gate  
Tracking issue: #519  
Package PR: #538  
Trigger PR: #539  
Trigger merge SHA: `9928a9d1a346939a14b543c306c9f3fd9d30a6df`

## Purpose

Locate only the exact `main` push run created by PR #539, download the sanitized Kick recovery evidence, verify the Kick-only schema apply and Twitch non-execution boundaries, and freeze the accepted result without re-running production activity.

## Required result

```text
exact trigger SHA and push event matched
contract job success
production-kick-recovery job success
accepted audit: Twitch complete / Kick absent
Kick pre-schema completely absent
first Kick apply exactly 9 statements
second Kick apply 0 statements
Kick post-schema complete
new natural Kick snapshot observed
collector latency and DB size within thresholds
category dictionary rows zero
reserved probe rows zero
provider leakage zero
Twitch execution not included
temporary Worker deleted and HTTP 404
category capture disabled
```

## Boundary

The acceptance workflow uses GitHub Actions read access only. It does not deploy Workers, apply schema, enable category capture, write category rows, add cron, backfill data, change retention, or add UI.
