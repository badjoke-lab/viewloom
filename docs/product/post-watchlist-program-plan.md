# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.1
Last updated: 2026-06-26
Current phase: Phase 9 — History P1 repair
Current implementation branch: none
Completed closeout: PR #432
Exact next implementation branch: `work-history-ui-h1-metric`

## Program status

```text
Phase 7 P7A    complete PR #426
Phase 8 P8A    complete PR #427
Phase 8 P8B    complete PR #428
Phase 9 P9H0   complete PR #430
P9H0 closeout  complete PR #432
Phase 9 P9H1   exact next; not created
Phase 10       cross-site quality work queued
Phase 11       engineering and operations lock queued
Phase 12       English release readiness queued
Phase 13       English/Japanese localization queued
Phase 14       Spanish/pt-BR localization and staged launch queued
Phase 15       next-capability audit queued
Phase 16       not approved
```

## Phase 9

P9H0 locked:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local first-Tab run reached the ViewLoom home link. The P8B production body-focus observation remains a production/local discrepancy for P9H5 and final acceptance.

```text
P9H1 work-history-ui-h1-metric     exact next; not created
P9H2 work-history-ui-h2-chart      queued
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H1 synchronizes Viewer-minutes and Peak viewers across URL, request/cache, chart, Summary, Selected day, comparison, Ranking context, supported Archives, Report, Share, and Exports. It preserves provider separation, request-count, URL, degraded-state, and output contracts.

## Later program

Phase 10–11 follow the cross-site quality specification and plan: reproduced defects, shared shell, visualization grammar, responsive/accessibility, route readiness, architecture cleanup, all-public acceptance, workflow consolidation, strict-null migration, monitoring, runbooks, and maintenance.

Phase 12 completes English legal, Support, Stripe, limitations, FAQ, and release assets.

Phase 13–14 follow the localization specification and plan. Initial locales are `en`, `ja`, `es`, and `pt-BR`. Existing English URLs remain canonical. UI localization is not stream-language analytics. Provider-origin names, IDs, titles, and categories are not translated by the initial program. Arabic/RTL requires separate approval.

Phase 15 evaluates one next capability at a time. Phase 16 requires a separate specification, branch sequence, and explicit approval.

## Rules

Before each branch, compare the schedule with actual repository state, confirm the predecessor merge report and explicit continuation, and reread the affected specifications and plans. After every merge, update canonical state, report fully, name the next branch, and stop.

There is no active implementation branch. Do not create `work-history-ui-h1-metric` until explicit continuation.