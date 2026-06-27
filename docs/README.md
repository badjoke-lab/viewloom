# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-27

Chat memory, screenshots, old PRs, and completed milestone notes do not override this index.

## Required reading order

1. `operations/development-and-deployment-policy.md`
2. `operations/development-policy-addendum.md`
3. `operations/documentation-governance.md`
4. this index
5. `product/current-roadmap.md`
6. `product/current-schedule.md`
7. `product/post-watchlist-program-plan.md`
8. affected baseline specification
9. affected active/future specification
10. affected implementation plan
11. active note under `work-in-progress/`
12. relevant audit/acceptance records

When repository state and documentation disagree, update documentation before implementation. Every later branch rereads the current authorities.

## Canonical program documents

- `product/current-roadmap.md`
- `product/current-schedule.md`
- `product/post-watchlist-program-plan.md`

## Active History repair authorities

- `product/history-and-trends-spec.md`
- `product/history-layout-rebuild-plan.md`
- `product/history-ui-repair-spec.md`
- `product/history-ui-repair-plan.md`
- `work-in-progress/history-ui-repair-working-note.md`

## Current execution state

```text
Phase 6  Local Watchlist v1                              complete PR #425
P9H0     deterministic History baseline                  complete PR #430
P9H1     metric execution repair                         complete PR #434
P9H2     chart interpretation repair                     complete PR #436
P9H2     canonical closeout                              complete PR #437
Active implementation branch                              none
P9H3     work-history-ui-h3-overview                       exact next; not created
```

## Historical gate snapshot

The following values are retained for permanent gates and are not current state.

```text
Active implementation branch                              none
P9H2     work-history-ui-h2-chart                          exact next; not created
P9H2 active on work-history-ui-h2-chart
```

## Local Watchlist permanent evidence

Local Watchlist v1 completed through PR #425. Its accepted product, implementation, and production records remain indexed here:

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
- `../apps/web/docs/watchlist-latest-w2a-contract.md`
- `../apps/web/docs/watchlist-history-w2b-contract.md`

## P9H0 permanent evidence

P9H0 completed through PR #430. Documentation/program closeout completed through PR #432. Final canonical correction completed through PR #433.

- `audits/history-ui-h0-baseline.md`
- `audits/history-ui-h0-owner-map.json`
- `audits/history-ui-h0-source-map.md`
- `audits/history-ui-h0-findings.md`

## P9H1 permanent evidence

P9H1 completed through PR #434.

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
```

- `../apps/web/scripts/history-ui-h1-browser.mjs`
- `../scripts/verify-history-ui-h1-metric.mjs`
- `../.github/workflows/history-ui-h1-metric.yml`

## P9H2 permanent evidence

```text
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Workflow run: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
```

- `../apps/web/src/live/history-chart-p9h2.ts`
- `../apps/web/src/live/history-chart-p9h2-compat.ts`
- `../apps/web/src/history-chart-p9h2.css`
- `../apps/web/scripts/history-ui-h2-chart-browser.mjs`
- `../scripts/verify-history-ui-h2-chart.mjs`
- `../.github/workflows/history-ui-h2-chart.yml`

P9H2 repairs UTC date and numeric scale interpretation, metric/unit meaning, exact day detail, chart/URL/Selected-day synchronization, keyboard/touch inspection, non-color state symbols, forced-colors support, and accessible SVG semantics. It preserves provider/request/output boundaries and does not refetch History when inspecting a day.

## Approved future authorities

- Phase 10–11: `product/cross-site-quality-remediation-spec.md`, `product/cross-site-quality-remediation-plan.md`
- Phase 13–14: `product/localization-spec.md`, `product/localization-implementation-plan.md`

These documents do not authorize early implementation.

## Other accepted product records

- `product/channel-and-streamer-spec.md`
- `product/channel-v1-implementation-plan.md`
- `product/report-export-consolidation-plan.md`
- `product/next-feature-data-capability-audit.md`

P9H2 is complete and canonically closed through PR #437. `work-history-ui-h3-overview` is the exact next branch after explicit continuation.