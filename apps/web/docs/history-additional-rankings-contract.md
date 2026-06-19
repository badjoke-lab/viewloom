# History additional rankings contract

History keeps the existing `topStreamers` payload and adds five bounded views: `viewerMinutes`, `peakViewers`, `averageViewers`, `observedMinutes`, and `rising`.

The source population is the existing period `topStreamers` candidate set, capped at 50 records. These are observed-window rankings, not provider-wide rankings.

`averageViewers` requires at least 360 observed minutes. `rising` requires a comparable previous-period baseline and a positive change. The existing History builder continues to exclude the in-progress current day from completed-period rankings.

Twitch and Kick use the same field shape but are calculated and returned independently. No cross-platform totals, ranks, or averages are produced. No database table, migration, cron, or collector job is added.
