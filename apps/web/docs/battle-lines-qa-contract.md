# Battle Lines QA Contract

This page records the current production contract for the Battle Lines view.

- Twitch and Kick Battle Lines pages must use the current-shell live entry.
- The live entry must choose `/api/battle-lines` for Twitch and `/api/kick-battle-lines` for Kick.
- The public pages must keep metric and refresh controls wired through `data-battle-*` attributes.
- The public pages must keep `.battle-stage`, `[data-battle-summary]`, and `[data-battle-feed]` live slots.
- The live renderer must fetch JSON with `cache: 'no-store'` and render loading, empty, error, summary, chart, and feed states.
- Missing, offline, or not-observed points must not be connected into visible battle lines.
- A future change that restores a static SVG-only Battle Lines chart or removes the live feed is a regression.
