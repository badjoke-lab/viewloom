# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-02

## Current execution state

```text
Phase 12A-5B-R2 Twitch category seven-day stability accumulation
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Semantic handling accepted PR #699 / merge ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e
Revised stability clock accepted PR #700 / merge d2316f10ba970818a47605a76a9ee9f235c517a4
Accepted window [2026-07-31T17:00:00.000Z, 2026-08-07T17:00:00.000Z)
JST window 2026-08-01 02:00 to 2026-08-08 02:00
Expected five-minute slots 2016
Current gate active accumulation on the unchanged Twitch collector
Manual start action required no
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json`
6. `docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json`
7. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
8. `docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json`
9. `docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json`
10. `docs/product/twitch-replacement-seven-day-audit-spec.md`
11. active WIP and affected feature specification/plan

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Accepted Twitch category decisions

- The successful v2 observation remains frozen under run/job/artifact `30620512044` / `91123756273` / `8789385200`.
- PR #699 accepted provider-scoped semantics without synthetic, name-only, or cross-provider mapping.
- PR #700 accepted a half-open seven-day window from `2026-07-31T17:00:00.000Z` through `2026-08-07T17:00:00.000Z`.
- The existing five-minute collector continues unchanged; no start workflow, new cron, deployment, checkpoint, D1 mutation, binding change, or operator action was required.
- Final read-only mode remains prohibited before the end boundary.

## Current order

1. Accumulate only buckets at or after the accepted start using the unchanged Twitch collector.
2. Preserve collector, D1 schema, bindings, cadence, retention, category semantics, Kick separation, and public fallback.
3. At or after `2026-08-07T17:00:00.000Z`, run the governed final read-only audit for all 2016 expected slots.
4. Freeze and separately accept evidence before final-mode or public category-filter decisions.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Invariants

- No observation rerun, checkpoint rerun, historical backfill, threshold relaxation, synthetic mapping, or clock reset.
- Twitch/Kick remain separated on existing five-minute cadences.
- No retention expansion, cross-provider identity, or combined ranking.
- Public category controls remain unauthorized.
- Existing unfiltered Heatmap remains the fallback.
- Current-main documents and accepted contracts override cached handoffs.
