# U10H production acceptance working record

Status: active
Branch: `work-quality-u10h-acceptance`
Started: 2026-07-04
Entry main commit: `62dab7b6076c15b85c3d893589df22388753c1bc`
Previous phase: U10G architecture complete PR #470
Exact next branch after U10H: `work-quality-phase11-acceptance-operations`

## Purpose

U10H owns the production acceptance that U10F intentionally did not claim.

The goal is not to add product functionality. The goal is to prove that the public ViewLoom surface is usable on hosted production after U10A-U10G repairs, with provider separation, degraded states, URL compatibility, and output contracts preserved.

## Required confirmations

```text
Production Smoke routes: 20
Provider separation failures accepted: 0
Public runtime failures accepted: 0
Unexpected cross-provider requests accepted: 0
Unsupported combined-provider totals accepted: 0
Hosted evidence required: yes
```

## Acceptance scope

- Confirm Twitch and Kick public routes load on hosted production.
- Confirm Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, Data Status, support/legal/info pages do not regress from U10F readiness.
- Confirm Day Flow and Battle Lines retain U10G ownership guarantees on production-facing builds.
- Confirm no route silently combines Twitch and Kick data.
- Confirm missing-id and degraded states remain usable.
- Confirm production evidence is recorded before claiming production acceptance.

## Non-goals

- No new API routes.
- No D1 schema changes.
- No collector changes.
- No cron or retention changes.
- No provider-combined rankings.
- No localization runtime.
- No new major feature.

## Current status

```text
U10H branch created: yes
U10H implementation started: yes
Production acceptance claimed: no
Phase 11 started: no
```
