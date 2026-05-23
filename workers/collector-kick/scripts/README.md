# collector-kick scripts

## generate-kick-seed-import-sql.mjs

Generates SQL to import built-in Kick seed slugs into the planned `kick_channels` registry.

This script does **not** execute SQL against D1.

### Check only

Use this before generating SQL. It validates parsing, normalization, duplicate counting, skipped invalid slugs, and SQL byte size without writing a file.

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs --check-only
```

Expected result:

```text
ok: true
mode: check-only
normalizedCount > 0
skippedCount = 0
```

### Generate SQL

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
```

Default output:

```text
workers/collector-kick/generated/kick-seed-import.sql
```

The script creates the generated output directory automatically.

### Generate with extra slugs

```bash
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs \
  --extra="slug1,slug2,slug3"
```

### Generate to a custom path

```bash
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs \
  --out="/tmp/kick-seed-import.sql"
```

## Kick live candidate probe

Probes known Kick candidate slugs and generates SQL that boosts currently live candidates in `kick_channels`.

These scripts do **not** execute SQL against D1.

### Standard package scripts

Use the Python probe as the default operator command. It has produced better local results than the Node fetch probe.

```bash
cd ~/viewloom
pnpm kick:live-probe
```

Use safe mode when endpoint errors are high.

```bash
pnpm kick:live-probe:safe
```

Use slow mode when safe mode still has too many errors.

```bash
pnpm kick:live-probe:slow
```

### Node fallback scripts

The Node probe is kept for fallback/comparison.

```bash
pnpm kick:live-probe:node
pnpm kick:live-probe:node-fast
pnpm kick:live-probe:node-aggressive
```

### Direct Python command

```bash
python3 workers/collector-kick/scripts/probe-kick-live-candidates-python.py \
  --concurrency=8 \
  --timeout=10 \
  --progress-every=25
```

### Include extra candidate slugs

The optional input file accepts one slug per line. Comma-separated lines use the first column as the slug.

```bash
python3 workers/collector-kick/scripts/probe-kick-live-candidates-python.py \
  --input="workers/collector-kick/generated/extra-kick-slugs.txt"
```

### Review and execute SQL

```bash
cd ~/viewloom/workers/collector-kick
cat generated/kick-live-priority-boost.sql
npx wrangler d1 execute vl_kick_hot --remote --file generated/kick-live-priority-boost.sql
```

## Local verification sequence

```bash
cd ~/viewloom
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs --check-only
node workers/collector-kick/scripts/generate-kick-seed-import-sql.mjs
wc -l workers/collector-kick/generated/kick-seed-import.sql
head -n 20 workers/collector-kick/generated/kick-seed-import.sql
```

Do not commit generated SQL unless a later PR explicitly requests it.

## Execution guard

Do not run the generated SQL against production until all of these are true:

1. `0001_create_kick_channels.sql` has been reviewed.
2. The migration has been intentionally applied to `vl_kick_hot`.
3. The generated SQL has been reviewed.
4. The operator explicitly decides to import or boost rows.

Do not describe Kick as Twitch parity or directory coverage while the target source is seed-list or registry candidate coverage.