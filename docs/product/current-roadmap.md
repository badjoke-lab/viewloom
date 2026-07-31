# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active on five-minute collectors.
- The original replacement window is invalid and retired.
- Corrected Twitch category-source-v2 observation package accepted in PR #692 / #693.
- Exact rerun trigger merged in PR #695.
- Production run `30620512044`, observe job `91123756273`, and artifact `8789385200` succeeded.
- Two consecutive real, non-empty, fresh v2 snapshots passed state integrity, dictionary resolution, provider separation, and freshness.
- Canonical v1 rollback succeeded.
- Evidence frozen in PR #697.
- Consumed trigger and temporary execution path retired in PR #698.

### Current gate: semantic handling and new seven-day stability-clock decision

Current branch:

`work-659-twitch-category-source-v2-semantic-clock-decision`

## Accepted evidence

- Snapshot buckets: `2026-07-31T09:40:00Z` and `2026-07-31T09:45:00Z`.
- Each snapshot: 300 streams, 300 present category references, zero null/invalid/unresolved/incomplete states.
- Category IDs: 84 then 85.
- Candidate and canonical deployments retained the existing `*/5 * * * *` cadence.
- The evidence demonstrates complete source states; it does not itself authorize semantic mapping, a new clock, final mode, or public UI.

## Active deliverable

Create a separate decision PR that:

- interprets the demonstrated source-state completeness without inventing mappings;
- decides whether semantic handling is accepted;
- decides whether a new seven-day Twitch stability clock is authorized;
- freezes an exact start only when authorization is explicit;
- preserves Kick separation, five-minute cadences, retention, and the public fallback;
- performs no final-mode or public category-filter change.

## Following gates

1. semantic and new-clock decision;
2. seven stable days from an explicitly accepted start;
3. final audit;
4. separate final-mode decision;
5. separate public cutover.

## Hard boundaries

- No observation rerun, historical backfill, threshold relaxation, synthetic mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
