# ViewLoom rollup refresh worker

This worker refreshes `daily_rollups` for ViewLoom Free Strong.

## Purpose

The 5-minute Twitch/Kick collectors should stay focused on raw snapshot collection.

This worker refreshes History rollups separately so `daily_rollups` does not need to be updated on every 5-minute collector run.

## Schedule

This worker has no cron trigger in Free Strong mode.

Cloudflare Free cron slots are reserved for the 5-minute Twitch and Kick collectors. Automatic rollup refresh is handled by a time gate inside each collector.

Manual `POST /refresh` refreshes both today and yesterday for:

```text
vl_twitch_hot
vl_kick_hot
```

## Routes

```text
GET /health
POST /refresh
```

## Deploy

```bash
cd workers/rollup-refresh
wrangler deploy
```

## Manual run after deploy

```bash
curl -X POST https://viewloom-rollup-refresh.<YOUR_WORKERS_SUBDOMAIN>.workers.dev/refresh
```

If the worker is not publicly routed, use the Cloudflare dashboard or Wrangler tail/logs.
