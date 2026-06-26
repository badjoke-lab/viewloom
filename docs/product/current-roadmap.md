# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## Current state

Phase 7 is complete through PR #426.
Phase 8 is complete through PR #428.
P9H0 is complete through PR #430.
The P9H0 documentation closeout is complete through PR #432.
There is no active implementation branch.

The exact next implementation branch is:

```text
work-history-ui-h1-metric
```

That branch has not been created.

## Verified P9H0 findings

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local keyboard run reached the ViewLoom home link. The P8B production body-focus observation remains a production/local discrepancy for P9H5 and final acceptance.

## Ordered roadmap

```text
Phase 9   History P1 repair                                   P9H1 next
Phase 10  cross-site defect/UI/architecture repair           queued
Phase 11  acceptance, CI, type safety, monitoring            queued
Phase 12  English legal, Support, Stripe, release readiness  queued
Phase 13  English/Japanese localization                      queued
Phase 14  Spanish/pt-BR localization and staged launch       queued
Phase 15  next-feature data-capability audit                  queued
Phase 16  separately approved major feature                  not approved
```

No Phase 16 feature is approved.

## P9H1 scope

P9H1 repairs Viewer-minutes and Peak viewers across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports. It does not add a metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## Localization boundary

UI localization is distinct from stream-language analytics. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## Stop rule

Do not create `work-history-ui-h1-metric` until explicit continuation.