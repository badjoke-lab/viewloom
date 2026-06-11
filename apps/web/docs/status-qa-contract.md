# Status QA Contract

This page records the current production contract for the Status view.

- Twitch and Kick Status pages must use the current-shell live entry.
- The live entry must choose `/api/twitch-status` for Twitch and `/api/kick-status` for Kick.
- The public pages must keep `.status-board` and `.metric-ledger` live slots.
- The public pages must keep pipeline and state definition sections that explain source, freshness, partial, and empty states.
- The live renderer must fetch JSON with `cache: 'no-store'` and render head facts, board cells, feature rows, and API error states.
- Fresh must be displayed only when returned by the live status API, not as a hard-coded demo claim.
- A future change that restores `Shell ready for real data` or hard-coded demo freshness is a regression.
