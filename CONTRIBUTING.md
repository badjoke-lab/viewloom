# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, the docs index, current roadmap, current schedule, development policy, the immutable historical runtime gate, final Twitch audit evidence/acceptance, final-mode decision, hidden production revalidation evidence/acceptance, public-cutover decision, deployed public evidence/acceptance, affected specification/plan, and current WIP/handoff. Record the current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout complete
Historical gate viewloom-12a2-current-gate-state-v33 retained
Final audit accepted PR #736
Final-mode decision accepted PR #737
Hidden production revalidation accepted PR #739
Public cutover PR #740
Mobile overflow repair PR #741
Accepted production SHA b006f45d0676c9ff3e05e5d6727458e43802de53
Pages deploy run 31244148642 success
Public production acceptance run 31244148651 success
Twitch public category-filter exposure active
Kick category UI unauthorized
```

## Accepted result

The Twitch seven-day audit completed and accepted `2016 / 2016` expected slots. Provider-scoped category semantics remain unchanged. Twitch Heatmap now exposes Category + Top on the normal route with default `All categories` / `Top 50`, allowed Top values `20 / 50 / 100`, category-before-Top-N filtering, URL state, explicit unknown/unavailable handling, and no Kick category control exposure.

The first deployed public candidate was rejected because a 390px viewport expanded to 474px. PR #741 fixed only intrinsic control width. Accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53` passed deployed acceptance with 390px `scrollWidth=390`.

## Current work order

1. Preserve the frozen public rollout evidence and deployment provenance.
2. Close #659 and #635 after the closeout acceptance merges.
3. Keep parent category program #623 open.
4. Require separate decisions for Day Flow category UI, History category UI, and Kick category UI.

## Current boundaries

- No observation rerun, final-audit rerun, backfill, threshold relaxation, synthetic mapping, or clock reset without a new governed decision.
- No automatic Kick, Day Flow, or History category UI rollout.
- No cross-provider category identity, totals, or rankings.
- Twitch and Kick existing five-minute cadences, D1 boundaries, bindings, and retention remain unchanged.

## Change classification

Use one PR per responsibility: evidence/closeout synchronization, a separately authorized category surface, collector/data-path work, or unrelated product work. Do not bundle a new category surface into the completed Twitch Heatmap rollout.
