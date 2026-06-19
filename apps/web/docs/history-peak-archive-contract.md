# History peak archive contract

History exposes a bounded `peakArchive` built from completed observed days in the existing `daily` payload.

Fields: `rank`, `day`, optional `timestamp`, `timestampPrecision`, `peakViewers`, optional streamer/category fields, and `coverageState`.

Entries are sorted by peak viewers descending, then day descending, and capped at 30. The current in-progress day and missing days are excluded.

When retained data has no exact minute or category, the API returns `null`. The UI shows `Day only` or `Unavailable`; ViewLoom does not guess missing values.

Twitch and Kick use the same shape but remain independently calculated and displayed. No cross-platform peak rank is produced.

This feature adds no database migration, scheduled job, collector job, or extra browser request.
