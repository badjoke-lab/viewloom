# Phase 12A-4 category read-only production preflight

Status: provider-health contract correction in progress  
Tracking issue: #519  
Parent planning PR: #520  
Package PR: #521  
Initial trigger PR: #522  
Gate fix PR: #524  
Retry trigger PR: #525

## Purpose

Run provider-separated, read-only production inspection before any category schema apply decision.

## Provider health evidence

The providers do not currently expose identical health tables.

```text
Twitch health evidence: collector_status
Kick health evidence: latest minute_snapshots row
```

The read-only verifier must inspect table and column presence before querying optional health tables. It must not require Kick to have Twitch's `collector_status` schema, and it must never return `payload_json` or channel identities.

## Execution history

```text
attempt 1 / PR #522:
  stopped before temporary Worker deployment because the accepted-gate check was too brittle

attempt 2 / PR #525:
  accepted gates passed
  temporary Twitch and Kick Workers deployed
  Twitch read-only inspect passed
  Kick read-only inspect returned HTTP 500 because the verifier assumed collector_status existed
  both temporary Workers were deleted and confirmed HTTP 404
  no migration, runtime enablement, or production category write occurred
```

## Required boundary

```text
main ref only
exact main SHA confirmation
accepted-gate ancestry confirmation
read-only SQL only
no migration apply
no CATEGORY_CAPTURE_ENABLED
no production category rows
no manual collector route
no new cron
no backfill
no retention change
temporary Twitch and Kick Workers deleted
post-delete HTTP 404 required
```

## Evidence

The workflow emits a sanitized JSON artifact containing only provider-level schema state,
aggregate snapshot/health metadata, D1 read-only query metrics, lifecycle codes, and gate results.
It must contain no channel identities, raw snapshot payloads, credentials, account ID, or database ID.

## Completion

This workstream completes only after both providers pass independently and the sanitized evidence is frozen in a separate acceptance PR. Passing preflight does not authorize schema application or runtime capture.
