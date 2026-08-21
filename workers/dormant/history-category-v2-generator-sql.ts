import { CATEGORY_CONTRACT_VERSION } from '../shared/category-capture'

export const KICK_HISTORY_CATEGORY_V2_CATEGORY_ROWS_SELECT_SQL = `
WITH bounds AS (
  SELECT ? AS provider, ? AS day
),
raw_items AS (
  SELECT
    m.bucket_minute,
    m.payload_json,
    CAST(COALESCE(
      json_extract(j.value, '$.viewers'),
      json_extract(j.value, '$.viewer_count'),
      json_extract(j.value, '$.viewerCount')
    ) AS INTEGER) AS viewers,
    json_type(m.payload_json, '$.categoryRefs[' || CAST(j.key AS TEXT) || ']') AS category_ref_type,
    CAST(json_extract(m.payload_json, '$.categoryRefs[' || CAST(j.key AS TEXT) || ']') AS INTEGER) AS category_ref,
    json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version
  FROM minute_snapshots m, bounds b, json_each(m.payload_json, '$.items') j
  WHERE m.provider = b.provider
    AND m.bucket_minute >= (b.day || 'T00:00:00.000Z')
    AND m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')
),
accepted AS (
  SELECT
    bucket_minute,
    viewers,
    CAST(json_extract(payload_json, '$.categoryIds[' || CAST(category_ref AS TEXT) || ']') AS TEXT) AS category_id
  FROM raw_items
  WHERE category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
    AND category_ref_type = 'integer'
    AND category_ref IS NOT NULL
    AND category_ref >= 0
    AND viewers > 0
),
snapshot_category AS (
  SELECT bucket_minute, category_id, SUM(viewers) AS snapshot_viewers
  FROM accepted
  WHERE category_id IS NOT NULL AND category_id != ''
  GROUP BY bucket_minute, category_id
)
SELECT
  category_id,
  SUM(snapshot_viewers * ?) AS total_viewer_minutes,
  MAX(snapshot_viewers) AS peak_viewers,
  COUNT(*) AS observed_snapshots
FROM snapshot_category
GROUP BY category_id
ORDER BY category_id
`

export const KICK_HISTORY_CATEGORY_V2_CONTRIBUTOR_ROWS_SELECT_SQL = `
WITH bounds AS (
  SELECT ? AS provider, ? AS day
),
raw_items AS (
  SELECT
    m.payload_json,
    LOWER(REPLACE(COALESCE(
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id'),
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name')
    ), ' ', '-')) AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    CAST(COALESCE(
      json_extract(j.value, '$.viewers'),
      json_extract(j.value, '$.viewer_count'),
      json_extract(j.value, '$.viewerCount')
    ) AS INTEGER) AS viewers,
    json_type(m.payload_json, '$.categoryRefs[' || CAST(j.key AS TEXT) || ']') AS category_ref_type,
    CAST(json_extract(m.payload_json, '$.categoryRefs[' || CAST(j.key AS TEXT) || ']') AS INTEGER) AS category_ref,
    json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version
  FROM minute_snapshots m, bounds b, json_each(m.payload_json, '$.items') j
  WHERE m.provider = b.provider
    AND m.bucket_minute >= (b.day || 'T00:00:00.000Z')
    AND m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')
),
accepted AS (
  SELECT
    streamer_id,
    display_name,
    viewers,
    CAST(json_extract(payload_json, '$.categoryIds[' || CAST(category_ref AS TEXT) || ']') AS TEXT) AS category_id
  FROM raw_items
  WHERE category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
    AND category_ref_type = 'integer'
    AND category_ref IS NOT NULL
    AND category_ref >= 0
    AND streamer_id IS NOT NULL
    AND streamer_id != ''
    AND viewers > 0
)
SELECT
  category_id,
  streamer_id,
  MAX(display_name) AS display_name,
  SUM(viewers * ?) AS viewer_minutes,
  MAX(viewers) AS peak_viewers,
  COUNT(*) * ? AS observed_minutes,
  COUNT(*) AS sample_count
FROM accepted
WHERE category_id IS NOT NULL AND category_id != ''
GROUP BY category_id, streamer_id
ORDER BY category_id, streamer_id
`

export const KICK_HISTORY_CATEGORY_V2_DELETE_CATEGORY_DAY_SQL = `
DELETE FROM history_category_daily_v2 WHERE provider = ? AND day = ?
`

export const KICK_HISTORY_CATEGORY_V2_DELETE_CHUNK_DAY_SQL = `
DELETE FROM history_category_streamer_daily_chunks_v2 WHERE provider = ? AND day = ?
`

export const KICK_HISTORY_CATEGORY_V2_INSERT_CATEGORY_JSON_SQL = `
INSERT INTO history_category_daily_v2 (
  provider, day, category_id, total_viewer_minutes, peak_viewers,
  observed_snapshots, source_mode, contract_version, updated_at
)
SELECT
  ?, ?,
  CAST(json_extract(j.value, '$.categoryId') AS TEXT),
  CAST(json_extract(j.value, '$.totalViewerMinutes') AS INTEGER),
  CAST(json_extract(j.value, '$.peakViewers') AS INTEGER),
  CAST(json_extract(j.value, '$.observedSnapshots') AS INTEGER),
  ?, ?, ?
FROM json_each(?) AS j
`

export const KICK_HISTORY_CATEGORY_V2_INSERT_CHUNK_JSON_SQL = `
INSERT INTO history_category_streamer_daily_chunks_v2 (
  provider, day, category_id, chunk_index, contributor_count,
  contributors_json, encoded_bytes, contract_version, updated_at
)
SELECT
  ?, ?,
  CAST(json_extract(j.value, '$.categoryId') AS TEXT),
  CAST(json_extract(j.value, '$.chunkIndex') AS INTEGER),
  CAST(json_extract(j.value, '$.contributorCount') AS INTEGER),
  CAST(json_extract(j.value, '$.contributorsJson') AS TEXT),
  CAST(json_extract(j.value, '$.encodedBytes') AS INTEGER),
  ?, ?
FROM json_each(?) AS j
`

export const KICK_HISTORY_CATEGORY_V2_STATUS_UPSERT_SQL = `
INSERT INTO history_category_day_status_v2 (
  provider, day,
  candidate_category_rows,
  logical_streamer_category_contributors,
  physical_contributor_chunk_rows,
  contributor_encoded_bytes,
  category_row_cap,
  physical_contributor_row_budget,
  contributor_encoded_bytes_cap,
  source_snapshots,
  observed_category_items,
  missing_category_items,
  coverage_state,
  source_mode,
  contract_version,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(provider, day) DO UPDATE SET
  candidate_category_rows = excluded.candidate_category_rows,
  logical_streamer_category_contributors = excluded.logical_streamer_category_contributors,
  physical_contributor_chunk_rows = excluded.physical_contributor_chunk_rows,
  contributor_encoded_bytes = excluded.contributor_encoded_bytes,
  category_row_cap = excluded.category_row_cap,
  physical_contributor_row_budget = excluded.physical_contributor_row_budget,
  contributor_encoded_bytes_cap = excluded.contributor_encoded_bytes_cap,
  source_snapshots = excluded.source_snapshots,
  observed_category_items = excluded.observed_category_items,
  missing_category_items = excluded.missing_category_items,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  updated_at = excluded.updated_at
`

export const KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CATEGORY_SQL = `
DELETE FROM history_category_daily_v2 WHERE provider = ? AND day < date('now', ?)
`

export const KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CHUNK_SQL = `
DELETE FROM history_category_streamer_daily_chunks_v2 WHERE provider = ? AND day < date('now', ?)
`

export const KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_STATUS_SQL = `
DELETE FROM history_category_day_status_v2 WHERE provider = ? AND day < date('now', ?)
`
