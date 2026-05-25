# Kick 90-day raw retention evaluation

Status: PR-Data-07 for Free Strong.

## Current Free Strong default

```text
Twitch raw snapshots: 30 days
Kick raw snapshots: 60 days
History rollups: 180 days
```

Kick 90-day raw retention is allowed only after measurement shows enough room.

## Decision rule

Keep Kick at 60 days unless all of the following are true:

```text
- Kick rows_24h is close to 288.
- Kick estimatedPayloadMbAt90Days is safely below the soft payload budget.
- daily_rollups is populated through the latest day.
- History is reading rollups normally.
- D1 database size remains comfortably below the free-tier risk zone.
```

Recommended soft payload budget for Kick raw 90 days:

```text
estimatedPayloadMbAt90Days <= 250 MB: safe candidate
250 MB - 350 MB: watch candidate
> 350 MB: do not enable 90 days
```

This is intentionally conservative because payload size is not the full D1 size. Table overhead, indexes, and auxiliary tables also consume storage.

## Current useful signals

Use `/api/data-audit` and check the Kick provider object:

```text
rows
rows24h
payloadMb
estimatedPayloadMbPerDay
estimatedPayloadMbAtRetention
estimatedPayloadMbAt90Days
cadenceOk
```

Use D1 directly when terminal access is available:

```bash
wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows, ROUND(SUM(LENGTH(payload_json)) / 1024.0 / 1024.0, 2) AS payload_mb FROM minute_snapshots WHERE provider='kick';"

wrangler d1 execute vl_kick_hot --remote --command "SELECT provider, COUNT(*) AS rows, MIN(day) AS oldest, MAX(day) AS latest FROM daily_rollups GROUP BY provider;"
```

## Do not change yet

Do not switch the active cleanup policy from 60 days to 90 days in this PR.

PR-Data-07 only records the decision rule and confirms that the existing audit output is enough to judge the change.

## Next action

If future measurements show Kick 90 days is safe, create a later PR to change:

```text
db/d1/005_retention_cleanup.sql
/api/retention-policy
apps/web/src/retention-policy.ts
```

from Kick 60 days to Kick 90 days.
