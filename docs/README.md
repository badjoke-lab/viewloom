# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-26

## Current execution state

```text
Phase 6  Local Watchlist v1                               complete PR #425
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser audit               complete PR #428
P9H0     History deterministic baseline                    complete PR #430
P9H1     metric execution repair                           complete PR #434
P9H2     chart interpretation                              active
Active implementation branch                              work-history-ui-h2-chart
P9H3     work-history-ui-h3-overview                       exact next; not created
```

## Historical P9H1 closeout snapshot

```text
Active implementation branch                              none
```

The historical value above records the state immediately after PR #435 and is not the current state.

## Required reading order

1. `operations/development-and-deployment-policy.md`
2. `operations/development-policy-addendum.md`
3. `operations/documentation-governance.md`
4. this index
5. `product/current-roadmap.md`
6. `product/current-schedule.md`
7. `product/post-watchlist-program-plan.md`
8. affected baseline and active specification
9. affected implementation plan
10. active working note
11. relevant audit and acceptance records

## Active History authorities

- `product/history-and-trends-spec.md`
- `product/history-ui-repair-spec.md`
- `product/history-ui-repair-plan.md`
- `work-in-progress/history-ui-repair-working-note.md`

## Permanent and active evidence

P9H0:

- `audits/history-ui-h0-baseline.md`
- `audits/history-ui-h0-owner-map.json`
- `audits/history-ui-h0-source-map.md`
- `audits/history-ui-h0-findings.md`
- `../apps/web/scripts/history-ui-h0-browser.mjs`
- `../scripts/verify-history-ui-h0-baseline.mjs`

P9H1 completed through PR #434:

```text
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

- `../apps/web/scripts/history-ui-h1-browser.mjs`
- `../scripts/verify-history-ui-h1-metric.mjs`

P9H2 active:

- `../apps/web/src/live/history-chart-p9h2.ts`
- `../apps/web/src/history-chart-p9h2.css`
- `../apps/web/scripts/history-ui-h2-chart-browser.mjs`
- `../scripts/verify-history-ui-h2-chart.mjs`
- `../.github/workflows/history-ui-h2-chart.yml`

P9H2 repairs UTC date/scale/unit interpretation, exact day detail, chart/URL/Selected-day synchronization, keyboard and touch inspection, non-color state symbols, and accessible SVG description without changing provider/request/output boundaries.

## Accepted records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
- `audits/P8A_SCOPE.md`
- `audits/public-surface-inventory.json`
- `audits/public-surface-gaps.json`
- `audits/P8B_SCOPE.md`
- `audits/public-browser-defects.json`
- `audits/public-browser-audit.md`
- `operations/history-production-acceptance-2026-06-23.md`
- `operations/channel-production-acceptance-2026-06-23.md`
- `operations/report-export-consolidation-acceptance-2026-06-24.md`

## Approved future authorities

- `product/cross-site-quality-remediation-spec.md`
- `product/cross-site-quality-remediation-plan.md`
- `product/localization-spec.md`
- `product/localization-implementation-plan.md`

Phase 10–15 remain queued. Phase 16 is not approved.

## Document precedence

1. development/deployment policy
2. this index and documentation governance
3. roadmap
4. schedule
5. program plan
6. active/future specification
7. baseline specification
8. implementation plan
9. working note
10. audit/acceptance evidence

Complete P9H2 on `work-history-ui-h2-chart`. Do not create `work-history-ui-h3-overview` until P9H2 merges and explicit continuation is received.