# ViewLoom landing redesign QA

Scope: Portal `/`, Twitch data `/twitch/`, and Kick data `/kick/`.

## Final checks

- Portal remains the platform-selection entry point.
- Twitch data and Kick data use parallel top-page structure.
- Main feature entries are Heatmap, Day Flow, Battle Lines, and History & Trends.
- Support is visible through header/footer styling and body support entry points without popups or sticky buttons.
- Platform accents remain blue for Portal, purple for Twitch data, and green for Kick data.
- Home pages should not replace the main visualizer pages or load heavy chart renderers as their primary purpose.

## Route expectations

- `/` links to `/twitch/` and `/kick/`.
- `/twitch/` links to `/twitch/heatmap/`, `/twitch/day-flow/`, `/twitch/battle-lines/`, `/twitch/history/`, and `/twitch/status/`.
- `/kick/` links to `/kick/heatmap/`, `/kick/day-flow/`, `/kick/battle-lines/`, `/kick/history/`, and `/kick/status/`.
