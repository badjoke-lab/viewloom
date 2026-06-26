# P9H0 source map

Status: complete through PR #430

- `history-current-shell-entry.ts` owns URL, request, base Summary, chart, Selected day, ranking, Daily archive, and coverage rendering.
- `history-usability-pass.ts` owns compatibility import order.
- `history-view-shell.ts` owns task URL state and section rehoming.
- `history-overview.ts` owns Overview augmentation and payload capture.
- `history-report-text.ts` and `history-report-text-state.ts` own report, share, export, and report payload context.
- `history-focus-fallback.css` and `history-visual-responsive.css` own focus and responsive presentation.

The P9H1 branch must begin from this map and `history-ui-h0-owner-map.json`, preserve provider/request/output contracts, and replace metric-related expected failures with passing assertions.