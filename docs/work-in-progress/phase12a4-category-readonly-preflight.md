# Phase 12A-4 category read-only production preflight

Status: stacked implementation; do not execute before PR #520 is merged and accepted  
Tracking issue: #519  
Parent planning PR: #520  
Branch: `agent/12a4-category-readonly-preflight`

## Purpose

Run provider-separated, read-only production inspection before any category schema apply decision.

## Required boundary

```text
workflow_dispatch only
main ref only
exact main SHA confirmation
PR #520 merged confirmation
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
aggregate snapshot/collector metadata, D1 read-only query metrics, lifecycle codes, and gate results.
It must contain no channel identities, raw snapshot payloads, credentials, account ID, or database ID.

## Completion

This workstream completes only after both providers pass independently and the sanitized evidence is frozen in a separate acceptance PR. Passing preflight does not authorize schema application or runtime capture.
