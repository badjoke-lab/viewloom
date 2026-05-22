# Kick registry verification

This document defines the read-only verification steps for `kick_channels` after operator-controlled migration and seed import.

## Purpose

Before changing collector runtime selection, confirm that the registry exists and contains usable candidates.

This verification does not prove Kick has Twitch parity.
It only proves the `kick_channels` candidate registry exists and has rows that can be used by a later collector PR.

## Verification SQL file

Use:

```text
workers/collector-kick/sql/verify-kick-channels.sql
```

This SQL is read-only.
It does not mutate production data.

## Run verification

From the collector directory:

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --file sql/verify-kick-channels.sql
```

## Expected result after seed import

Minimum expectations:

```text
table_exists = 1
total_rows > 0
candidate_pool > 0
source='seed' rows exist
status='candidate' rows exist
```

## Required checks before collector runtime changes

Before a collector PR reads from `kick_channels`, confirm:

1. `kick_channels` exists.
2. There are candidate rows.
3. Top priority rows look valid.
4. `blocked` or `dead` rows are not unexpectedly high.
5. `source` and `status` groups look intentional.
6. No generated SQL or secrets were committed accidentally.

## Do not change coverage mode yet

Even after this verification passes, keep:

```text
coverageMode = seed-list
```

Only switch to:

```text
coverageMode = registry
```

after the collector actually selects from `kick_channels` and writes a valid production snapshot from registry-selected slugs.

## Failure handling

### table_exists is 0

The migration was not applied to the target database or the wrong database was checked.
Stop and confirm:

```text
D1 database name
wrangler config
command target
```

### total_rows is 0

The migration may exist but seed import did not run.
Do not change collector runtime.
Run the import only after reviewing the generated SQL and operator intent.

### source/status groups look wrong

Do not run runtime collector changes.
Inspect recent import commands and generated SQL.

### candidate_pool is 0

Do not run runtime collector changes.
There are no usable registry candidates for collector selection.

## Next development step

After verification passes, the next implementation PR can make the collector select attempted slugs from `kick_channels`.

That PR must still preserve safe fallback behavior and honest status labels.
