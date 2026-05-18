# ViewLoom collector-kick

Status: minimal real-channel polling worker plus fixture fallback. Cloudflare D1 must be created and bound before use.

## Purpose

`collector-kick` is the provider-specific ingestion path for Kick. It stays separate from Twitch so provider failures, rate limits, and storage issues can be isolated.

This worker validates the dedicated Kick D1 path end-to-end:

```text
collector-kick -> DB_KICK_HOT / vl_kick_hot -> /api/kick-* -> Kick pages
```

## Required Cloudflare resources

Create a D1 database:

```text
Name: vl_kick_hot
Binding: DB_KICK_HOT
```

Configure channel slugs:

```text
KICK_CHANNEL_SLUGS="channel-one,channel-two"
```

Optional manual collection token:

```text
KICK_INGEST_TOKEN="..."
```

## Schema

Apply:

```text
db/kick/migrations/0001_kick_hot_schema.sql
```

Optional direct SQL fixture seed:

```text
db/kick/seed/0001_fixture_snapshot.sql
```

## Worker routes

After binding `DB_KICK_HOT`, the worker exposes:

```text
GET  /health
GET  /status
POST /collect
POST /insert-fixture
```

`POST /collect` fetches configured Kick channels from:

```text
https://kick.com/api/v2/channels/{slug}
```

and writes one current-minute snapshot to `minute_snapshots`.

`POST /insert-fixture` writes one fixture snapshot for validation.

## Scheduled collection

`wrangler.toml` includes a commented cron block:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

Enable it only after:

- `vl_kick_hot` exists
- `DB_KICK_HOT` is bound
- migration is applied
- `KICK_CHANNEL_SLUGS` is configured

## Wrangler config

`wrangler.toml` includes a commented D1 binding block. Fill the real Cloudflare D1 database id:

```toml
[[d1_databases]]
binding = "DB_KICK_HOT"
database_name = "vl_kick_hot"
database_id = "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID"
```

## Verification flow

1. Create D1 `vl_kick_hot`.
2. Bind it as `DB_KICK_HOT` to the Pages project.
3. Apply `db/kick/migrations/0001_kick_hot_schema.sql`.
4. Set `KICK_CHANNEL_SLUGS`.
5. Deploy or run `collector-kick`.
6. Call `POST /collect`.
7. Confirm `GET /status` returns at least one row.
8. Confirm the Pages APIs use the same D1 binding:

```text
/api/kick-heatmap
/api/kick-day-flow
/api/kick-battle-lines
/api/kick-history
```

If real channel collection fails or configured channels are offline, call:

```text
POST /insert-fixture
```

for storage-path validation.

## Runtime contract

Rows are written to:

```text
minute_snapshots
```

Required row shape:

```text
provider
bucket_minute
collected_at
total_viewers
stream_count
payload_json
source_mode
```

`payload_json` contains:

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

## Limitations

This is a channel-list collector. It does not yet discover global Kick rankings or category directory pages by itself.

The next collector phase should add candidate discovery while keeping this D1 storage contract stable.
