# Phase 12A-4 category parallel execution

Status: active WIP  
Tracking issue: #659

## Current position

- Twitch and Kick permanent category capture are active and provider-separated on the existing five-minute cadences.
- The original Twitch replacement stability window is invalid and retired.
- Corrected category-source-v2 observation completed successfully in run `30620512044`.
- Two consecutive complete Twitch snapshots passed every accepted source-completeness gate.
- Canonical v1 rollback succeeded.
- Evidence is frozen in PR #697.
- The exact trigger and temporary production execution path are retired in PR #698.

## Current gate

Semantic handling and new seven-day Twitch stability-clock decision.

Current branch:

`work-659-twitch-category-source-v2-semantic-clock-decision`

## Decision questions

1. How should `bothPresent`, `bothEmpty`, `providerIdOnly`, and `categoryNameOnly` be interpreted without inventing a cross-provider or synthetic category identity?
2. Does the demonstrated `bothPresent=300` / zero-incomplete result authorize the accepted semantic path?
3. Is a new seven-day Twitch stability clock authorized?
4. What exact start is accepted, if authorization is granted?

## Required boundaries

- No observation rerun, recreated temporary execution path, checkpoint rerun, backfill, threshold relaxation, or automatic clock reset.
- No Kick, cadence, retention, cross-provider identity, combined ranking, final-mode, or public category UI change.
- No public category UI; the unfiltered Heatmap remains the fallback.
- A new clock, final audit, final mode, and public cutover each require separate acceptance.
