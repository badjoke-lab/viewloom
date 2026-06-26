# History UI P9H0 findings

Status: complete through PR #430

## Deterministic results

The Twitch and Kick fixtures reproduce:

- `history-metric-summary-stale`;
- `history-selected-day-context-stale`;
- `history-metric-ranking-context-stale`;
- `history-mobile-task-flow-too-long`.

The metric request, URL, selected control, chart caption, and chart accessible name change. Summary, Selected day, and Ranking context remain unchanged.

At 390px, the Kick page measured 15,058px in an 844px viewport, about 17.84 viewport heights, with seven major Overview sections.

## Keyboard discrepancy

The deterministic candidate did not reproduce the P8B keyboard-entry finding. The first Tab moved to the ViewLoom home link at both 820px and 360px.

The P8B production artifact remains the evidence source for the body-focus observation. The production/local discrepancy remains explicit for P9H5 and final production acceptance.

## Source ownership

- `history-current-shell-entry.ts`: URL, request, Summary, chart, Selected day, ranking, Daily archive, coverage.
- `history-usability-pass.ts`: compatibility import order.
- `history-view-shell.ts`: task URL state, Back/Forward, section rehoming.
- `history-overview.ts`: Overview augmentation and payload capture.
- `history-report-text.ts` and `history-report-text-state.ts`: report, share, export, metric context.
- focus and responsive CSS: keyboard presentation and desktop/mobile layout.

## Repair routing

- P9H1 owns metric execution synchronization.
- P9H3 owns Overview hierarchy.
- P9H5 owns responsive behavior and the keyboard discrepancy.

## Boundary

P9H0 made no public runtime, API, D1, binding, collector, cron, retention, provider-combination, or output-schema change.