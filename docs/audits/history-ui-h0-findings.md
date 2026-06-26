# History UI P9H0 findings

Status: complete candidate

## Verified evidence

```text
Head: 70738eec3418d1c1b921ff553757db604cf838bc
Workflow run: 28217250311
Artifact: history-ui-h0-baseline
Artifact ID: 7897114008
Digest: sha256:5ad4c421a46a4c1f06294f15c50df1cd8b1116a5117dd2761bdc82211cc378a6
```

## Deterministic acceptance results

The local candidate reproduces four exact acceptance failures on Twitch and Kick fixtures:

- `history-metric-summary-stale`
- `history-selected-day-context-stale`
- `history-metric-ranking-context-stale`
- `history-mobile-task-flow-too-long`

The expected and observed sets are identical. The metric request, URL, selected control, chart caption, and chart accessible name change. The period summary, selected-day context, and ranking presentation remain unchanged.

At 390px, the measured History page is 15,058px tall in an 844px viewport, about 17.84 viewport heights, with seven major Overview sections in one continuous stack.

## Keyboard discrepancy

The deterministic candidate did not reproduce the P8B keyboard-entry finding. The first Tab moved to the ViewLoom home link at both 820px and 360px.

The completed P8B production artifact remains the evidence source for the production observation that focus stayed on the document body. P9H0 does not manufacture a local failure. The discrepancy remains explicit for P9H5 and production acceptance.

## Source ownership

- `history-current-shell-entry.ts`: URL, request, summary, chart, selected day, ranking, daily archive, coverage.
- `history-usability-pass.ts`: compatibility import order.
- `history-view-shell.ts`: task URL state, Back/Forward, and section rehoming.
- `history-overview.ts`: Overview augmentation and payload capture.
- `history-report-text.ts` and `history-report-text-state.ts`: report, share, export, and metric context.
- focus and responsive CSS: keyboard presentation and desktop/mobile layout.

## Repair routing

- P9H1 owns metric execution synchronization.
- P9H3 owns Overview task hierarchy.
- P9H5 owns responsive behavior and the keyboard discrepancy.

## Boundary

No public runtime, API, D1, binding, collector, cron, retention, provider-separation, or output-schema change was made in P9H0.
