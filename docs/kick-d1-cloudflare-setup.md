# Kick D1 Cloudflare setup

Status: final Cloudflare-side step required after repository setup is merged.

## Decision

Kick uses its own D1 database.

```text
D1 database name: vl_kick_hot
Pages Functions binding: DB_KICK_HOT
```

Twitch storage remains separate from Kick storage.

## Cloudflare dashboard steps

1. Open Cloudflare dashboard.
2. Open Workers & Pages.
3. Open D1.
4. Create a database named `vl_kick_hot`.
5. Open the ViewLoom Pages project settings.
6. Add a D1 binding:

```text
Binding name: DB_KICK_HOT
D1 database: vl_kick_hot
```

7. Save and redeploy the Pages project.

## Schema

Apply this SQL to `vl_kick_hot`:

```text
db/kick/migrations/0001_kick_hot_schema.sql
```

## Collector worker setup

The repository includes:

```text
workers/collector-kick/
```

Before deploying the worker:

1. Fill `workers/collector-kick/wrangler.toml` with the real D1 database id.
2. Configure channel slugs:

```text
KICK_CHANNEL_SLUGS="channel-one,channel-two"
```

3. Optionally configure a manual collection token:

```text
KICK_INGEST_TOKEN="..."
```

4. Configure official Kick API credentials if authenticated app-token collection is available for the deployment:

```text
KICK_CLIENT_ID="..."
KICK_CLIENT_SECRET="..."
# Optional pre-provisioned bearer token instead of client credentials:
KICK_ACCESS_TOKEN="..."
```

The collector uses `POST https://id.kick.com/oauth/token` with `grant_type=client_credentials` and then reads `https://api.kick.com/public/v1/channels?slug={slug}` when credentials work. If credentials are absent or token acquisition fails, it writes honest `public-channel-fallback` / `empty-public-channel-fallback` source modes from `https://kick.com/api/v2/channels/{slug}`.

5. Enable cron only after manual collection works:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

## Collector verification

After deploy:

```text
GET  /health
GET  /status
POST /collect
POST /insert-fixture
```

Use `POST /collect` for real configured channel polling.

Use `POST /insert-fixture` only when real channels are offline or you need to validate the D1 storage path quickly. Fixture insertion is not production-completion evidence.

## Optional direct SQL fixture

To verify Pages APIs before deploying the collector worker, apply:

```text
db/kick/seed/0001_fixture_snapshot.sql
```

After either fixture insertion or real collection, these endpoints should stop returning empty / storage-missing states:

- `/api/kick-heatmap`
- `/api/kick-day-flow`
- `/api/kick-battle-lines`
- `/api/kick-history`

## Remove fixture rows before production acceptance

Use the complete procedure in:

```text
docs/operations/kick-fixture-removal-runbook.md
```

The production-safe SQL is:

```sql
DELETE FROM minute_snapshots
WHERE provider = 'kick'
  AND source_mode = 'fixture';
```

Run the source-mode inventory and post-delete verification from the runbook. Never broaden the deletion to all Kick rows or the whole table. If no real rows survive, expose an honest empty state and repair collection instead of reinserting fixtures.

## Current repository-side completion target

Before touching Cloudflare, repository should contain:

- `DB_KICK_HOT` Env type
- `db/kick/migrations/0001_kick_hot_schema.sql`
- `db/kick/seed/0001_fixture_snapshot.sql`
- `workers/collector-kick/src/index.ts`
- `workers/collector-kick/wrangler.toml`
- `workers/collector-kick/README.md`
- `docs/operations/kick-fixture-removal-runbook.md`
- Kick API readers prepared for `DB_KICK_HOT`

## Verification SQL

```sql
SELECT provider, COUNT(*) AS rows
FROM minute_snapshots
GROUP BY provider;
```

Expected after one successful fixture or collection:

```text
kick | 1+
```

For production acceptance, also require:

```sql
SELECT COUNT(*) AS remaining_fixture_rows
FROM minute_snapshots
WHERE provider = 'kick'
  AND source_mode = 'fixture';
```

Expected:

```text
0
```

## What remains outside Cloudflare setup

The included collector is seed-list polling through `KICK_CHANNEL_SLUGS`. It does not yet discover global Kick rankings or categories automatically. Without valid Kick credentials it uses `source_mode=public-channel-fallback`, not official authenticated collection. Add directory discovery later without changing the D1 row contract.
