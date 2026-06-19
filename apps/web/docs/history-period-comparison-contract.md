# History period comparison contract

History compares the selected completed-day scope with the immediately preceding period of equal requested length.

The current in-progress UTC day is excluded from comparison totals. The previous side is trimmed to the same number of selected completed days when enough retained days exist.

The comparison exposes total viewer-minutes, peak viewers, average observed viewers, selected day count, observed minutes, and coverage state.

Percentage changes are emitted only when both sides have equal selected-day counts and complete coverage with positive previous values. Otherwise the state is `partial` or `unavailable` and the UI displays an explicit reason instead of a guessed percentage.

Twitch and Kick are calculated independently from their existing History database paths. No provider totals are combined.

No database table, migration, collector, cron, retention change, binding, or additional browser request is introduced. The existing History API already reads the immediately preceding period for streamer comparisons.
