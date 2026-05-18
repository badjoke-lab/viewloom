# ViewLoom collector-kick

Status: minimal fixture-ingestion worker. Cloudflare D1 must be created and bound before use.

## Purpose

`collector-kick` is the provider-specific ingestion path for Kick. It stays separate from Twitch so provider failures, rate limits, and storage issues can be isolated.

This first worker is not the final live Kick API collector. It exists to validate the dedicated Kick D1 path end-to-end:

```text
collector-kick -> DB_KICK_HOT / vl_kick_hot -> /api/kick-* -> Kick pages
```

## Required Cloudflare resources

Create a D1 database:

```text
Name: vl_kick_hot
Binding: DB_KICK_HOT
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

After binding `DB_KICK_HOT`, the minimal worker exposes:

```text
GET  /health
GET  /status
POST /insert-fixture
```

`POST /insert-fixture` writes one current-minute fixture snapshot into `minute_snapshots` with:

```text
provider = kick
source_mode = fixture
```

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
4. Deploy or run `collector-kick`.
5. Call `POST /insert-fixture`.
6. Confirm `GET /status` returns at least one row.
7. Confirm the Pages APIs use the same D1 binding:

```text
/api/kick-heatmap
/api/kick-day-flow
/api/kick-battle-lines
/api/kick-history
```

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

## Remaining after fixture validation

After the D1 path is verified, replace fixture ingestion with real Kick data collection while keeping this storage contract stable.
