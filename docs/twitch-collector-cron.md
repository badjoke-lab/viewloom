# Twitch Collector Cron

The Twitch collector is triggered by GitHub Actions.

## Workflow

- `.github/workflows/twitch-collector.yml`
- Scheduled every 15 minutes.
- Can also be run manually with `workflow_dispatch`.

## Required repository secrets

- `VIEWLOOM_COLLECTOR_URL`
  - Base site URL only.
- `VIEWLOOM_INGEST_TOKEN`
  - Must match the production Pages environment variable used by the collector endpoint.

## Endpoint

The workflow calls:

- `POST /api/admin/twitch-heatmap-collect`

## D1 database

The production Twitch hot-data database is:

- `vl_twitch_hot`

## Verification

After the workflow runs, check that new `real` rows appear in `minute_snapshots` for provider `twitch`.

History only shows days that exist in `minute_snapshots`. If the collector is not running, `/twitch/history/` will correctly show missing days.
