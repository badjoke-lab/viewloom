# Kick D1 Cloudflare setup

Status: final Cloudflare-side step required after repository scaffold is merged.

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

7. Save and redeploy.

## Schema

Apply this SQL to `vl_kick_hot`:

```text
db/kick/migrations/0001_kick_hot_schema.sql
```

## Optional fixture

To verify pages before live ingestion, apply:

```text
db/kick/seed/0001_fixture_snapshot.sql
```

After this, these endpoints should stop returning empty / storage-missing states:

- `/api/kick-heatmap`
- `/api/kick-day-flow`
- `/api/kick-battle-lines`
- `/api/kick-history`

## Current repository-side completion target

Before touching Cloudflare, repository should contain:

- `DB_KICK_HOT` Env type
- `db/kick/migrations/0001_kick_hot_schema.sql`
- `db/kick/seed/0001_fixture_snapshot.sql`
- `workers/collector-kick/README.md`
- Kick API readers prepared for `DB_KICK_HOT`

## Verification SQL

```sql
SELECT provider, COUNT(*) AS rows
FROM minute_snapshots
GROUP BY provider;
```

Expected after fixture:

```text
kick | 1
```
