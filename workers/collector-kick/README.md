# ViewLoom collector-kick

Status: scaffold only. Cloudflare D1 must be created and bound before production use.

## Purpose

`collector-kick` is the provider-specific ingestion path for Kick. It must stay separate from the Twitch collector so provider failures and rate-limit behavior can be isolated.

## Required Cloudflare resources

Create a D1 database:

```text
Name: vl_kick_hot
Binding: DB_KICK_HOT
```

Optional secret for ingest protection:

```text
KICK_INGEST_TOKEN
```

## Schema

Apply:

```text
db/kick/migrations/0001_kick_hot_schema.sql
```

Optional fixture seed:

```text
db/kick/seed/0001_fixture_snapshot.sql
```

## Runtime contract

Rows must be written to:

```text
minute_snapshots
```

Required row shape:

```text
provider = kick
bucket_minute
collected_at
total_viewers
stream_count
payload_json
source_mode
```

`payload_json` should contain:

```json
{
  "items": [
    {
      "slug": "channel-slug",
      "displayName": "Channel Name",
      "title": "Current title",
      "viewer_count": 1234,
      "url": "https://kick.com/channel-slug"
    }
  ]
}
```

## Current next step

After Cloudflare setup, switch Kick API readers to require `DB_KICK_HOT` and verify:

- `/api/kick-heatmap`
- `/api/kick-day-flow`
- `/api/kick-battle-lines`
- `/api/kick-history`
