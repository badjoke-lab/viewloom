# History battle archive contract

`battleArchive` is generated from completed observed days in `daily.topStreamers`.

At most one pair is selected per day from the five highest viewer-minute candidates that each have at least 60 observed minutes. Entries are ordered by a bounded daily score and capped at 30.

The score uses day-level viewer-minute closeness and relevance. It is not evidence of a minute-level lead change. Exact times are unavailable, so entries use day precision and do not claim event counts.

The current day and missing days are excluded. Coverage labels remain explicit.

Twitch and Kick are calculated independently. No combined archive or cross-platform score is produced.

No database table, migration, collector, cron, retention change, or additional browser request is introduced.
