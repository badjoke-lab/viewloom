# Channel / Streamer page minimal contract

The first Channel / Streamer page is a provider-specific subpage reached from History rankings.

Canonical page routes:

```text
/twitch/channel/?id=<streamer-id>
/kick/channel/?id=<streamer-id>
```

The page reuses the existing provider History endpoint for the selected 7-day or 30-day period. It does not introduce a new database query, binding, collector, cron, retention rule, or browser request beyond that single History request.

The visible scope is a **retained ranking footprint**:

- period totals come from `topStreamers`;
- daily rows come from `daily[].topStreamers`;
- rivalry candidates come from `battleArchive`;
- days without a matching daily row are labelled `Not in retained daily Top 10` and must not be described as offline;
- session start/end history is not claimed by this initial page.

The page exposes period viewer-minutes, peak viewers, average viewers, observed minutes, retained daily Top 10 appearances, a daily footprint chart, recent retained days, and bounded rivalry links.

Twitch and Kick routes call only their own History endpoint and link only to their own Day Flow, Battle Lines, History, and external channel page. No cross-platform totals, ranking, or profile merge is produced.
