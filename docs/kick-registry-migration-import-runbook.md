# Kick registry migration and import runbook

This runbook defines the safe operator sequence for applying the `kick_channels` registry migration and importing initial Kick candidates.

## Purpose

ViewLoom Kick must move beyond seed-list-only coverage, but the first registry step must be controlled.

This runbook covers:

- local checks before any production action;
- D1 migration review;
- seed import SQL generation;
- production execution order;
- verification SQL;
- failure handling;
- rules for when `coverageMode` may change from `seed-list` to `registry`.

## Current state before this runbook

Current Kick coverage remains:

```text
coverageMode = seed-list
```

Existing repo assets:

```text
workers/collector-kick/migrations/0001_create_kick_channels.sql
workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
workers/collector-kick/scripts/README.md
docs/kick-channel-registry-schema.md
docs/kick-registry-seed-import-plan.md
docs/kick-candidate-expansion-plan.md
```

This runbook does not execute any command by itself.

## Hard safety rules

Do not run production D1 commands unless the operator intentionally chooses to do so.

Do not change `coverageMode` to `registry` until all of these are true:

1. `kick_channels` exists in production D1.
2. Seed or curated candidates exist in `kick_channels`.
3. The collector reads attempted slugs from `kick_channels`.
4. Collector metadata includes registry counts.
5. A production snapshot is written from registry-selected slugs.
6. `/api/kick-status` confirms registry-backed collection.

Until then, status remains:

```text
coverageMode = seed-list
```

## Step 0: pull latest main

```bash
cd ~/viewloom
git pull origin main
```

Confirm expected files exist:

```bash
test -f workers/collector-kick/migrations/0001_create_kick_channels.sql
test -f workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
test -f workers/collector-kick/src/kick-seed-slugs.ts
```

## Step 1: local seed import check

Run check-only mode first:

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs --check-only
```

Expected:

```text
ok: true
mode: check-only
normalizedCount > 0
skippedCount = 0
```

If `ok` is false, stop.

Do not continue to production migration or import until invalid slugs are reviewed.

## Step 2: generate seed import SQL locally

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
```

Expected output:

```text
workers/collector-kick/generated/kick-seed-import.sql
```

Review the generated file:

```bash
wc -l workers/collector-kick/generated/kick-seed-import.sql
head -n 30 workers/collector-kick/generated/kick-seed-import.sql
tail -n 30 workers/collector-kick/generated/kick-seed-import.sql
```

Do not commit generated SQL unless a later PR explicitly asks for a checked-in artifact.

## Step 3: review migration SQL

Open:

```text
workers/collector-kick/migrations/0001_create_kick_channels.sql
```

It should create:

```text
kick_channels
idx_kick_channels_status_priority
idx_kick_channels_last_live
idx_kick_channels_last_checked
```

Do not modify production until the operator confirms the target D1 database.

Expected target:

```text
vl_kick_hot
```

Binding context:

```text
DB_KICK_HOT
```

## Step 4: production pre-checks

Before migration, inspect the current production state.

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Check whether `kick_channels` already exists:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='kick_channels';"
```

If it exists, do not blindly re-run import. Inspect rows first.

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows FROM kick_channels;"
```

## Step 5: apply migration under explicit operator control

Only after Step 0-4 pass:

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --file migrations/0001_create_kick_channels.sql
```

Verify table exists:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='kick_channels';"
```

Verify indexes:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='kick_channels' ORDER BY name;"
```

## Step 6: import seed candidates

Run this only after migration verification passes.

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --file generated/kick-seed-import.sql
```

If `generated/kick-seed-import.sql` is not present under `workers/collector-kick/generated/`, generate it from repo root first:

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
```

Then repeat the D1 import command.

## Step 7: verify imported rows

Run:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT source, status, COUNT(*) AS rows FROM kick_channels GROUP BY source, status ORDER BY source, status;"
```

Run:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT slug, priority, status, source, created_at, updated_at FROM kick_channels ORDER BY priority DESC LIMIT 20;"
```

Run:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS total_candidates FROM kick_channels WHERE status IN ('candidate', 'active', 'cooldown');"
```

Expected after seed import:

```text
source='seed'
status='candidate'
total_candidates > 0
```

## Step 8: do not switch collector yet

After seed import, the collector still reads current seed-list code until a later PR changes runtime selection.

Do not change:

```text
coverageMode = seed-list
```

Do not claim:

```text
registry coverage
Twitch parity
directory coverage
```

The next runtime PR must explicitly make the collector select from `kick_channels`.

## Failure handling

### Check-only fails

Stop and inspect invalid slugs.

Do not run migration or import.

### Migration fails

Stop and capture:

```text
wrangler command
error output
database name
current branch
```

Do not run import SQL.

### Import fails midway

The generated SQL uses a transaction.

After failure, inspect:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows FROM kick_channels;"
```

If rows exist, inspect source/status groups before retrying.

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT source, status, COUNT(*) AS rows FROM kick_channels GROUP BY source, status ORDER BY source, status;"
```

### Wrong database suspected

Stop.

Do not run cleanup commands until the target database is confirmed.

## Rollback notes

For an early seed import mistake, prefer status-based exclusion over table deletion when possible.

Example for disabling all seed candidates without deleting history:

```sql
UPDATE kick_channels
SET status='blocked', notes='blocked after import review', updated_at=datetime('now')
WHERE source='seed';
```

Hard deletion should be reserved for confirmed wrong-database or test-only mistakes.

## Post-import development order

After this runbook has been followed and rows are verified:

```text
1. registry row verification PR
2. collector reads targets from kick_channels
3. collector updates registry feedback fields
4. status reports registry candidate counts
5. candidate import tool for curated expansion
6. feature-page QA after observed stream counts improve
```

## Non-goals

This runbook does not:

- execute migration;
- execute seed import;
- change collector runtime;
- change API status behavior;
- add discovery;
- claim Kick is fixed;
- claim Kick is Twitch parity.
