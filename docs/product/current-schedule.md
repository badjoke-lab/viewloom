# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## Current position

```text
Phase 7 source reset                     complete PR #426
Phase 8 public inventory/browser audit  complete PR #428
Phase 9 P9H0 baseline                   complete PR #430
P9H0 documentation closeout             complete PR #432
Active implementation branch            none
Exact next branch                       work-history-ui-h1-metric
P9H1 branch created                     no
```

## P9H0 evidence

```text
Final head: e3a1f64e7225a652de95a37ea755b192565d7798
Merge commit: 716b8e2fb59a6783a647cb62274c82a521c0e535
Workflow run: 28217951126
Artifact: history-ui-h0-baseline
Artifact ID: 7897373665
```

Deterministic failures:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local keyboard run reached the ViewLoom home link. The P8B production body-focus observation remains a P9H5/final-acceptance discrepancy.

## Immediate sequence

```text
P9H1 work-history-ui-h1-metric     exact next; not created
P9H2 work-history-ui-h2-chart      queued
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## P9H1 entry contract

P9H1 begins only after explicit continuation. It repairs Viewer-minutes and Peak viewers across URL, request, control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports.

It must preserve Twitch/Kick separation, request reuse, Back/Forward, degraded states, and output schemas. It must not add another global fetch wrapper or document-wide observer.

## Later program

```text
Phase 10 cross-site defect/UI/architecture repair
Phase 11 acceptance, CI, type safety, monitoring, maintenance
Phase 12 English legal, Support, Stripe, release readiness
Phase 13 English/Japanese localization
Phase 14 Spanish/pt-BR localization and staged launch
Phase 15 next-feature data-capability audit
Phase 16 not approved
```

There is no active implementation branch. P9H1 resumes only after explicit continuation.