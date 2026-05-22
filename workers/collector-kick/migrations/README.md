# collector-kick migrations

This directory stores planned D1 migrations for the Kick collector.

## Current migration

- `0001_create_kick_channels.sql`

## Execution status

Do **not** run these migrations against production until a PR explicitly says to do so.

Current Kick coverage remains:

```text
seed-list coverage
```

The `kick_channels` table is required for the next architecture step:

```text
registry coverage
```

## Intended production command

When the registry-backed collector PR is ready, run the migration against the production Kick D1 database:

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --file migrations/0001_create_kick_channels.sql
```

After running, verify:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "
SELECT name, type
FROM sqlite_master
WHERE name LIKE 'kick_channels%' OR name LIKE 'idx_kick_channels%'
ORDER BY type, name;
"
```

Do not switch `/api/kick-status` to `coverageMode=registry` until the collector actually reads targets from `kick_channels`.
