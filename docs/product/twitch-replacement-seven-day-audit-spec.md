# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

The original replacement window is invalid and retired. Source completeness has now been demonstrated, but no new stability start or earliest final-audit time is authorized yet.

- Corrected observation package: PR #692 / #693.
- Exact rerun trigger: PR #695.
- Successful run/job/artifact: `30620512044` / `91123756273` / `8789385200`.
- Evidence freeze: PR #697.
- Temporary execution path retirement: PR #698.

## Accepted observation evidence

The bounded Twitch-only observation produced two consecutive real, non-empty, fresh `category-source-v2-candidate` snapshots:

- `2026-07-31T09:40:00Z`: 300 streams, 300 `bothPresent`, 84 category IDs, zero incomplete or unresolved states;
- `2026-07-31T09:45:00Z`: 300 streams, 300 `bothPresent`, 85 category IDs, zero incomplete or unresolved states.

State integrity, dictionary resolution, provider separation, freshness, candidate deployment, and canonical v1 rollback all passed. Twitch and Kick remain on separate five-minute collectors.

## Current gate: semantic handling and new stability-clock decision

Current branch:

`work-659-twitch-category-source-v2-semantic-clock-decision`

The decision must:

- define how the demonstrated source-state branches are interpreted without synthetic mapping;
- decide whether semantic handling is accepted;
- decide whether a new seven-day stability clock is authorized;
- set an exact start only through explicit acceptance;
- leave final mode and public category UI unauthorized;
- preserve Kick separation, cadence, retention, and the unfiltered public fallback.

## Following gates

1. semantic and new-clock decision;
2. seven stable days from the accepted start, if authorized;
3. final audit;
4. separate final-mode decision;
5. separate public cutover.

## Prohibited responses

- observation rerun or recreation of the retired temporary execution path without a new governed sequence;
- historical backfill, row invention, threshold relaxation, synthetic mapping, or automatic clock reset;
- Kick, cadence, retention, cross-provider, final-mode, or public category-filter change.
