# Raw retention boundary UI policy

Status: PR-Data-06 policy step for Free Strong.

## Background

Free Strong keeps detailed raw snapshots for a limited window:

```text
Twitch raw snapshots: 30 days
Kick raw snapshots: 60 days by default
Kick 90 days: measurement-gated later
History rollups: 180 days
```

History can remain available through `daily_rollups`, but detailed 5-minute reconstruction cannot be guaranteed outside the raw retention window.

## Page behavior

### History

History should use `daily_rollups` for normal period views.

When users browse older periods, History should remain available as a summary/trend view as long as rollups exist.

### Day Flow

Day Flow depends on raw 5-minute snapshots.

If the selected date is outside the provider raw retention window, Day Flow should show an empty/limited state explaining that detailed 5-minute data is no longer retained.

Recommended message:

```text
Detailed 5-minute data is retained for 30 days on Twitch and 60 days on Kick in Free Strong mode. Use History for older summary trends.
```

### Battle Lines

Battle Lines depends on raw 5-minute snapshots.

If the selected range is outside the provider raw retention window, Battle Lines should not look broken. It should explain that detailed battle reconstruction is only available inside the raw retention window.

Recommended message:

```text
Battle Lines requires detailed 5-minute snapshots. This date is outside the current raw retention window. Use History for older summary trends.
```

## Provider windows

```text
Twitch detail window: 30 days
Kick detail window: 60 days initially
History rollup window: 180 days
```

## API contract target

Feature APIs should eventually expose this metadata:

```text
retention.rawRetentionDays
retention.rollupRetentionDays
retention.detailAvailable
retention.detailUnavailableReason
```

Where possible, APIs should distinguish:

```text
empty because no rows exist yet
empty because the date is outside raw retention
partial because rows exist but coverage is sparse
```

## Implementation notes

This policy intentionally separates:

```text
History summary availability = daily_rollups
Detailed chart reconstruction = minute_snapshots
```

This avoids user confusion after raw cleanup begins.
