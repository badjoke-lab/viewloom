# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-08

## Current execution state

```text
Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout complete
Historical runtime gate viewloom-12a2-current-gate-state-v33 retained
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

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json` — immutable historical accumulation gate
5. `docs/audits/12a5-twitch-replacement-audit-final-evidence.json`
6. `docs/audits/12a5-twitch-replacement-audit-final-acceptance.json`
7. `docs/audits/12a5-twitch-category-final-mode-decision.json`
8. `docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-evidence.json`
9. `docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-acceptance.json`
10. `docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json`
11. `docs/audits/12a5-twitch-heatmap-category-public-production-evidence.json`
12. `docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json`
13. affected feature specification/plan and current WIP/handoff

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Accepted Twitch category rollout

- The final seven-day audit accepted `2016 / 2016` expected slots with coverage `1.0`, zero missing buckets, zero consecutive missing buckets, category-reference coverage `0.995353`, zero unresolved category IDs, and zero Twitch/Kick leakage.
- PR #737 authorized hidden Twitch Heatmap filter revalidation only.
- Five hidden production scenarios passed and were accepted in PR #739.
- PR #740 exposed Category + Top on the normal `/twitch/heatmap/` route.
- The first deployed public candidate was correctly rejected for mobile overflow `474 / 390`.
- PR #741 repaired only the intrinsic width of the public controls.
- Accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53` deployed successfully in run `31244148642`.
- Public production acceptance run `31244148651` passed all four scenarios, including 390px mobile with `scrollWidth=390` and Kick isolation.

## Current order

1. Freeze and preserve the accepted public rollout evidence/provenance.
2. Close completed issues #659 and #635 after the closeout PR merges.
3. Keep parent category program #623 open.
4. Require separate authorization for Day Flow category UI, History category UI, and Kick category UI.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Invariants

- Provider-scoped identity remains `(provider, categoryProviderId)`.
- Synthetic, name-only, and cross-provider category mapping remain prohibited.
- No combined-provider category totals or rankings.
- Twitch/Kick remain separated on existing five-minute cadences.
- No retention expansion, category backfill, or implicit D1/binding change from this rollout.
- Public Twitch Heatmap category controls are accepted; Kick, Day Flow, and History category controls are not authorized by that acceptance.
- Current-main documents and accepted contracts override cached handoffs.
