# ViewLoom Kick Data Path Audit

Status: active audit  
Scope: Kick collector / adapter / D1 / API path before real-data connection  
Created: 2026-05-17

## 1. Current Kick state

Kick UI and API state work completed so far:

- `/kick/status/` exists.
- Kick feature pages link to Kick status.
- Kick feature pages show provider-specific state strips.
- `/api/kick-heatmap` exists and returns `not_ready`.
- `/api/kick-day-flow` exists and returns `not_ready`.
- `/api/kick-battle-lines` exists and returns `not_ready`.
- Kick Day Flow and Battle Lines have provider-specific debug details.

Current phase:

- Data path audit before connecting real Kick samples.

## 2. Existing Twitch data path observed

Current Twitch Day Flow API reads from D1 using:

- binding: `DB_TWITCH_HOT`
- table: `minute_snapshots`
- fields:
  - `provider`
  - `bucket_minute`
  - `collected_at`
  - `total_viewers`
  - `payload_json`
  - `source_mode`

The Twitch query filters by:

```sql
WHERE provider = 'twitch'
  AND bucket_minute >= ?
  AND bucket_minute <= ?
```

This means the table is already provider-capable if Kick rows can be stored with `provider = 'kick'`.

## 3. Existing Env observed

Current function Env includes:

- `DB_TWITCH_HOT`
- `INGEST_TOKEN`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

No dedicated Kick credential or DB binding was observed in `functions/_db/env.ts` during this pass.

Implication:

- If Kick data uses the same D1 database, the existing DB binding can likely be reused.
- If Kick collector requires credentials, Env needs Kick-specific entries later.
- Do not add fake credential assumptions before the collector path is confirmed.

## 4. Recommended storage strategy

Use the existing `minute_snapshots` table if possible.

Required Kick row shape:

- `provider = 'kick'`
- `bucket_minute`
- `collected_at`
- `total_viewers`
- `payload_json`
- `source_mode`

Required `payload_json.items[]` shape:

- `channelLogin` or equivalent stable channel slug
- `displayName`
- `title`
- `url`
- `viewers`

If Kick raw data uses different names, normalize in the collector or endpoint adapter before inserting/reading.

## 5. API connection plan

### `/api/kick-heatmap`

Read from:

```sql
minute_snapshots WHERE provider = 'kick'
```

Return:

- `platform: 'kick'`
- `state: live | empty | stale | partial | error`
- `items`
- `coverageNote`
- `notes`

### `/api/kick-day-flow`

Reuse the Twitch Day Flow aggregation shape with:

```sql
provider = 'kick'
```

Required output should match the not-ready contract already created:

- `buckets`
- `totalViewersByBucket`
- `bands`
- `detailPanelSource`
- `activity`
- `coverageNote`
- `partialNote`

### `/api/kick-battle-lines`

Reuse the Twitch Battle Lines aggregation shape with:

```sql
provider = 'kick'
```

Required output:

- `lines`
- `primaryBattle`
- `recommendedBattle`
- `recommendedQuality`
- `secondaryBattles`
- `events`
- missing/not-observed breaks preserved

## 6. Unknowns that must be resolved before real connection

- Whether the current collector writes Kick rows into `minute_snapshots`.
- Whether provider values already include `kick` in production D1.
- Whether Kick payload items match the Twitch `items[]` shape.
- Whether Kick has enough polling frequency for Day Flow and Battle Lines.
- Whether source_mode for Kick can distinguish real/demo/test.
- Whether Kick rate limits require a lower polling cadence than Twitch.

## 7. Immediate next implementation options

### Option A: Connect Kick APIs to existing D1 provider rows

Use when:

- `minute_snapshots` already contains `provider = 'kick'` rows.

Steps:

1. Change `/api/kick-day-flow` to query `minute_snapshots` with `provider = 'kick'`.
2. Reuse Day Flow aggregation logic.
3. Change `/api/kick-battle-lines` similarly.
4. Implement `/api/kick-heatmap` from latest Kick rows.
5. Keep empty/stale handling honest.

### Option B: Keep stubs and add collector audit/runbook

Use when:

- No Kick rows exist yet.
- Collector path is not confirmed.

Steps:

1. Keep not-ready API stubs.
2. Add collector/runbook docs.
3. Confirm D1 table rows manually later.
4. Only then connect real APIs.

## 8. Recommended next step

Next PR should be one of these, depending on whether Kick rows exist in D1:

- If Kick rows exist: `Connect Kick APIs to provider rows`.
- If Kick rows do not exist or are unknown: `Add Kick collector runbook`.

Given current repository inspection, the safer next step is:

- Add a Kick data path runbook and SQL check commands.

This avoids pretending real Kick data exists before D1 evidence is confirmed.
