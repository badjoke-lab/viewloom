# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.7
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Current implementation branch: none
Exact next branch: `work-history-ui-h2-chart`

## Completed P9H1

PR #434 aligned Viewer-minutes and Peak viewers across the History URL, request state, chart, Summary, Selected day, comparison, Ranking context, Daily archive, Report, Share, and Export.

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

Twitch and Kick remain separate. The existing metrics, periods, state labels, task routes, and output formats remain. Daily rows without observations are not used as the metric day.

## Remaining sequence

```text
P9H2 work-history-ui-h2-chart      exact next; not created
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H2 covers chart scale, UTC date context, units, interaction, selected-day synchronization, legend, and accessible description.

P9H3 covers Overview order and compactness. P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

## Stop rule

P9H1 is complete through PR #434. There is no active implementation branch. Do not create `work-history-ui-h2-chart` until explicit continuation.