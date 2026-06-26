# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.8
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`

## Historical P9H1 closeout snapshot

This retained line describes the pre-P9H2 state and is not the current sequence.

```text
P9H2 work-history-ui-h2-chart      exact next; not created
```

## P9H2 active scope

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

## Sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   next after P9H2 merge and explicit continuation
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H3 covers Overview order and compactness. P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

## Stop rule

Finish and merge P9H2 before creating `work-history-ui-h3-overview`.