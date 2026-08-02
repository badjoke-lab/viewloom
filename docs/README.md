# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-02

## Current execution state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Original stability clock valid no
Corrected observation package accepted PR #692 / #693
Successful Twitch v2 observation PR #695 / run 30620512044 / job 91123756273
Evidence frozen PR #697
Temporary execution path retired PR #698
Current gate semantic handling and new seven-day stability-clock decision
Current branch work-659-twitch-category-source-v2-semantic-clock-decision
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. diagnosis decision/evidence/retirement
6. corrected observation recovery package contract/acceptance
7. `docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json`
8. `docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json`
9. `docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json`
10. `docs/product/twitch-replacement-seven-day-audit-spec.md`
11. active WIP and affected feature specification/plan

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Accepted observation result

- Trigger PR / merge: #695 / `78cf5759840aa7819b34c153d7521dab7df6bacc`.
- Run / observe job / artifact: `30620512044` / `91123756273` / `8789385200`.
- Artifact digest: `sha256:dfff17be40f9766c5d4cc4ead6eada761e00ba760b7ce133fce0e9b4f427fc10`.
- Evidence SHA-256: `e2ceb0ce88dab1f03fd374004488fda9381f223a5dde6d139686c06218ce6bbe`.
- Two consecutive real, non-empty, fresh v2 snapshots each contained 300 streams and 300 valid category references.
- All integrity, dictionary, provider-separation, and freshness gates passed.
- Canonical v1 rollback succeeded at the unchanged five-minute cadence.
- The trigger and one-time execution workflow, runner, generator, trigger verifier, and Wrangler config are retired.

## Current order

1. Decide semantic handling from frozen evidence without synthetic mapping or threshold relaxation.
2. Decide whether to authorize a new seven-day Twitch stability clock.
3. If accepted, freeze an exact start time and collect seven stable days.
4. Run a separate final audit before any final-mode or public category-filter change.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Invariants

- No observation rerun or automatic clock reset.
- Twitch/Kick remain separated on existing five-minute cadences.
- No backfill, retention expansion, cross-provider identity, or combined ranking.
- Public category controls remain unauthorized.
- Existing unfiltered Heatmap remains the fallback.
- Current-main documents and accepted contracts override cached handoffs.
