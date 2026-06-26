# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## Accepted P9H1 base

```text
Merge commit: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

P9H1 metric synchronization, provider separation, request behavior, Back/Forward, task reuse, state honesty, and output formats remain mandatory.

## P9H2 active implementation

```text
history-current-shell-entry.ts      base chart and selected-day rendering
history-chart-p9h2.ts               chart semantics, roving keyboard inspection, state symbols
history-chart-p9h2.css              focus, inspection panel, state markers, forced colors
history-ui-h2-chart-browser.mjs     Twitch desktop and Kick touch-mobile acceptance
verify-history-ui-h2-chart.mjs      repository contract
history-ui-h2-chart.yml             latest-head workflow and evidence upload
```

P9H2 acceptance requires:

- UTC dates and numeric scale;
- selected metric and unit;
- exact daily detail;
- chart, URL, and Selected day synchronization;
- pointer, keyboard, and touch inspection;
- Left/Right and Home/End navigation;
- complete, partial, in-progress, missing, and demo symbols independent of color;
- accessible SVG title and description;
- a live inspection region;
- no extra request during day inspection;
- no provider crossing.

The chart enhancement observes only `.history-stage`. It does not replace `window.fetch` and does not add a document-wide observer.

## Remaining sequence

```text
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   next after merge and explicit continuation
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

The compact mobile task flow remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final acceptance.

## Stop rule

Finish and merge P9H2 before creating `work-history-ui-h3-overview`.