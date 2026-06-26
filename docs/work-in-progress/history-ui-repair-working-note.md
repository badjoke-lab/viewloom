# TEMPORARY — ViewLoom History UI repair working note

Status: active
Last updated: 2026-06-26
Completed P9H0: PR #430
Completed P9H1: PR #434
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`

## Historical P9H1 closeout snapshot

```text
Current implementation branch: none
```

The historical value above describes the accepted state after PR #435. It is not the current state.

## P9H2 active implementation

```text
history-chart-p9h2.ts               chart semantics and keyboard inspection
history-chart-p9h2.css              state markers and focus presentation
history-ui-h2-chart-browser.mjs     desktop and touch browser acceptance
verify-history-ui-h2-chart.mjs      repository contract
history-ui-h2-chart.yml             latest-head workflow
```

P9H2 covers UTC dates, numeric scale, metric and unit, exact day detail, chart/URL/Selected-day synchronization, pointer/keyboard/touch inspection, non-color state symbols, accessible SVG description, and inspection without another History request.

```text
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   next after merge and explicit continuation
```

The mobile task hierarchy remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final acceptance.
