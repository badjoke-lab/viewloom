# Phase 12A-4 category read-only production preflight acceptance

Status: accepted on `main` through PR #523  
Tracking issue: #519  
Planning PR: #520  
Package PR: #521  
Initial trigger PR: #522 — stopped before temporary Worker deployment  
Gate fix PR: #524  
Retry trigger PR: #525 — Twitch passed; Kick returned HTTP 500; both temporary Workers deleted  
Provider-health fix PR: #526  
Attempt 3 trigger PR: #527  
Attempt 3 trigger merge SHA: `51796234db2b88bd5d4e3393cf0b2a97b4927c7b`  
Source workflow run: `29318733171`  
Acceptance workflow run: `29318857656`  
Acceptance PR: #523  
Acceptance merge SHA: `428154d16dc5b62c30ac6b7cdeb668f3e442a3b6`  
Frozen evidence: `docs/audits/12a4-category-readonly-preflight-evidence.json`

## Accepted result

```text
exact attempt 3 trigger SHA matched
push event matched
contract job success
production-preflight job success
Twitch gate pass using collector_status health evidence
Kick gate pass using latest minute snapshot health evidence
category schema completely absent for both providers
D1 rows written zero
D1 changes zero
provider leakage zero
temporary Workers deleted and HTTP 404 confirmed
remote migration unauthorized
runtime capture unauthorized
```

## Observed provider costs

```text
Twitch: 10 read-only statements; 8,763 rows read; 14.139 ms D1 duration; 1,172 ms Worker wall time
Kick:    9 read-only statements; 15,638 rows read; 34.152 ms D1 duration; 1,063 ms Worker wall time
```

These are preflight observation costs only. They do not represent category runtime capture cost and do not authorize schema application.

## Boundary

This acceptance gate did not apply schema, enable capture, write category rows, add a cron, backfill data, change retention, or add category analytics UI.

## Handoff

Controlled category schema apply design is now the active sub-gate. Runtime category capture remains separately gated and disabled.
