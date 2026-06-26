# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.8
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`

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

## Active P9H2

P9H2 repairs the daily trend chart while preserving all accepted P9H1 metric behavior.

Required results:

- readable UTC date ticks and numeric scale;
- explicit metric and unit;
- exact daily detail;
- synchronized chart, URL, and Selected day state;
- pointer, keyboard, and touch inspection;
- Left/Right and Home/End movement;
- complete, partial, in-progress, missing, and demo meaning without color alone;
- accessible SVG title, description, and live inspection context;
- no additional History request when a day is inspected;
- no Twitch/Kick crossing or output-format change.

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h2-chart-browser.mjs
scripts/verify-history-ui-h2-chart.mjs
.github/workflows/history-ui-h2-chart.yml
```

## Remaining sequence

```text
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   exact next after P9H2 merge and explicit continuation; not created
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H3 covers Overview order and compactness. P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

## Stop rule

Finish and merge P9H2 before creating `work-history-ui-h3-overview`. After the merge, issue the full merge report and stop until explicit continuation.