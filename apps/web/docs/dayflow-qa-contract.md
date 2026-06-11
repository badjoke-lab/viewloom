# Day Flow QA Contract

This page records the current production contract for the Day Flow view.

- Twitch and Kick Day Flow pages must use the current-shell live entry.
- The live entry must choose `/api/day-flow` for Twitch and `/api/kick-day-flow` for Kick.
- The public pages must keep the metric, top, and refresh controls wired through `data-dayflow-*` attributes.
- The public pages must keep `.dayflow-stage` and `[data-dayflow-inspector]` live slots.
- The live renderer must fetch JSON with `cache: 'no-store'` and render loading, empty, error, chart, and inspector states.
- A future change that restores a static SVG-only Day Flow chart or removes the live inspector is a regression.
