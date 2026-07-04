# U10H production acceptance working record

Status: complete
Branch: `work-quality-u10h-acceptance`
Started: 2026-07-04
Entry main commit: `62dab7b6076c15b85c3d893589df22388753c1bc`
Implementation PR: #471
Implementation merge commit: `9f2b9abd5a3d23b50fc01075a5c4f041899babf5`
Previous phase: U10G architecture complete PR #470
Exact next branch after U10H: `work-quality-phase11-acceptance-operations`

## Purpose

U10H owned the production acceptance that U10F intentionally did not claim.

The goal was not to add product functionality. The goal was to prove that the public ViewLoom surface is usable on hosted production after U10A-U10G repairs, with provider separation, degraded states, URL compatibility, and output contracts preserved.

## Required confirmations

```text
Production Smoke routes: 20
Provider separation failures accepted: 0
Public runtime failures accepted: 0
Unexpected cross-provider requests accepted: 0
Unsupported combined-provider totals accepted: 0
Hosted evidence required: yes
Matching production main SHA required: yes
```

## Completed acceptance

```text
Workflow run: 28701464391
Artifact id: 8080315127
Artifact digest: sha256:6de6e9371ea77e9b46a220fdabdc1db0ca63b74f55b8aa9eb52a1761b6a4f604
Result: pass
Expected main SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5
Deployed SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5
Checked at: 2026-07-04T09:08:03Z
```

Permanent record: `docs/operations/u10h-production-acceptance-2026-07-04.md`.

## Acceptance scope

- Twitch and Kick public routes loaded on hosted production.
- Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, Data Status, support, and information surfaces retained public availability.
- Day Flow and Battle Lines retained U10G ownership guarantees on production-facing builds.
- Twitch and Kick remained separate.
- Missing-route 404 behavior remained explicit.
- Production evidence was recorded before claiming production acceptance.

## Non-goals preserved

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
U10H implementation complete: yes
U10H PR contract gate: pass
Hosted production acceptance: pass
Production acceptance claimed: yes
Phase 11 started: no
Phase 11 branch created: no
```
