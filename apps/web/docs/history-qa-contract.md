# History QA Contract

This page records the current production contract for the History view.

- Twitch and Kick History pages must use the current-shell live entry.
- The live entry must choose `/api/history` for Twitch and `/api/kick-history` for Kick.
- The public pages must keep `.history-stage`, `[data-history-summary]`, `[data-history-notes]`, and `.metric-ledger` live slots.
- The live renderer must fetch JSON with `cache: 'no-store'` and render summary, chart, table, notes, empty, and error states.
- Empty retained rollups must be shown as empty/coverage states, not demo data.
- A future change that restores static SVG-only History charts or `Stream A` demo rows is a regression.
