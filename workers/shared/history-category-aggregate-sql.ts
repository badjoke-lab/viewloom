import { CATEGORY_CONTRACT_VERSION } from './category-capture'

export const HISTORY_CATEGORY_PRECHECK_SQL = `
WITH bounds AS (
  SELECT ? AS provider, ? AS day
),
source AS (
  SELECT m.bucket_minute, m.payload_json, m.source_mode
  FROM minute_snapshots m, bounds b
  WHERE m.provider = b.provider
    AND m.bucket_minute >= (b.day || 'T00:00:00.000Z')
    AND m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')
),
raw_items AS (
  SELECT
    LOWER(REPLACE(COALESCE(
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id'),
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name')
    ), ' ', '-')) AS streamer_id,
    CAST(COALESCE(
      json_extract(j.value, '$.viewers'),
      json_extract(j.value, '$.viewer_count'),
      json_extract(j.value, '$.viewerCount')
    ) AS INTEGER) AS viewers,
    json_extract(s.payload_json, '$.categoryContractVersion') AS category_contract_version,
    json_type(
      s.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS category_ref_type,
    CAST(json_extract(
      s.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
    CASE
      WHEN json_extract(s.payload_json, '$.categoryContractVersion') = '${CATEGORY_CONTRACT_VERSION}'
       AND json_type(
         s.payload_json,
         '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
       ) = 'integer'
       AND CAST(json_extract(
         s.payload_json,
         '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
       ) AS INTEGER) >= 0
      THEN CAST(json_extract(
        s.payload_json,
        '$.categoryIds[' || CAST(CAST(json_extract(
          s.payload_json,
          '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
        ) AS INTEGER) AS TEXT) || ']'
      ) AS TEXT)
      ELSE NULL
    END AS category_id
  FROM source s, json_each(s.payload_json, '$.items') j
),
observed AS (
  SELECT *
  FROM raw_items
  WHERE viewers > 0
),
item_stats AS (
  SELECT
    COUNT(*) AS valid_stream_items,
    COALESCE(SUM(CASE WHEN
      streamer_id IS NOT NULL
      AND streamer_id != ''
      AND category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
      AND category_ref_type = 'integer'
      AND category_ref IS NOT NULL
      AND category_ref >= 0
      AND category_id IS NOT NULL
      AND category_id != ''
      THEN 1 ELSE 0 END), 0) AS category_observed_items,
    COUNT(DISTINCT CASE WHEN
      streamer_id IS NOT NULL
      AND streamer_id != ''
      AND category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
      AND category_ref_type = 'integer'
      AND category_ref IS NOT NULL
      AND category_ref >= 0
      AND category_id IS NOT NULL
      AND category_id != ''
      THEN category_id END) AS candidate_category_rows,
    COUNT(DISTINCT CASE WHEN
      streamer_id IS NOT NULL
      AND streamer_id != ''
      AND category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
      AND category_ref_type = 'integer'
      AND category_ref IS NOT NULL
      AND category_ref >= 0
      AND category_id IS NOT NULL
      AND category_id != ''
      THEN json_array(category_id, streamer_id) END) AS candidate_streamer_category_rows
  FROM observed
),
source_stats AS (
  SELECT
    COUNT(*) AS source_snapshots,
    CASE
      WHEN COUNT(DISTINCT source_mode) = 1 THEN COALESCE(MIN(source_mode), 'unknown')
      WHEN COUNT(*) > 0 THEN 'mixed'
      ELSE 'unknown'
    END AS source_mode
  FROM source
)
SELECT
  source_stats.source_snapshots,
  item_stats.valid_stream_items,
  item_stats.category_observed_items,
  item_stats.valid_stream_items - item_stats.category_observed_items AS category_missing_items,
  item_stats.candidate_category_rows,
  item_stats.candidate_streamer_category_rows,
  source_stats.source_mode
FROM source_stats, item_stats
`

export const HISTORY_CATEGORY_INSERT_DAILY_SQL = `
INSERT INTO history_category_daily (
  provider,
  day,
  category_id,
  total_viewer_minutes,
  peak_viewers,
  observed_snapshots,
  source_mode,
  contract_version,
  updated_at
)
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
    json_type(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS category_ref_type,
    CAST(json_extract(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
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
    CAST(json_extract(
      payload_json,
      '$.categoryIds[' || CAST(category_ref AS TEXT) || ']'
    ) AS TEXT) AS category_id
  FROM raw_items
  WHERE category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
    AND category_ref_type = 'integer'
    AND category_ref IS NOT NULL
    AND category_ref >= 0
    AND viewers > 0
),
snapshot_category AS (
  SELECT
    bucket_minute,
    category_id,
    SUM(viewers) AS snapshot_viewers
  FROM accepted
  WHERE category_id IS NOT NULL AND category_id != ''
  GROUP BY bucket_minute, category_id
),
category_totals AS (
  SELECT
    category_id,
    SUM(snapshot_viewers * ?) AS total_viewer_minutes,
    MAX(snapshot_viewers) AS peak_viewers,
    COUNT(*) AS observed_snapshots
  FROM snapshot_category
  GROUP BY category_id
)
SELECT
  ?, ?, category_id,
  total_viewer_minutes,
  peak_viewers,
  observed_snapshots,
  ?, ?, ?
FROM category_totals
`

export const HISTORY_CATEGORY_INSERT_STREAMER_DAILY_SQL = `
INSERT INTO history_category_streamer_daily (
  provider,
  day,
  category_id,
  streamer_id,
  display_name,
  viewer_minutes,
  peak_viewers,
  observed_minutes,
  sample_count,
  contract_version,
  updated_at
)
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
    json_type(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS category_ref_type,
    CAST(json_extract(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
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
    CAST(json_extract(
      payload_json,
      '$.categoryIds[' || CAST(category_ref AS TEXT) || ']'
    ) AS TEXT) AS category_id
  FROM raw_items
  WHERE category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
    AND category_ref_type = 'integer'
    AND category_ref IS NOT NULL
    AND category_ref >= 0
    AND streamer_id IS NOT NULL
    AND streamer_id != ''
    AND viewers > 0
),
streamer_totals AS (
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
)
SELECT
  ?, ?, category_id, streamer_id, display_name,
  viewer_minutes, peak_viewers, observed_minutes, sample_count,
  ?, ?
FROM streamer_totals
`

export const HISTORY_CATEGORY_STATUS_UPSERT_SQL = `
INSERT INTO history_category_day_status (
  provider,
  day,
  candidate_category_rows,
  candidate_streamer_category_rows,
  category_row_cap,
  streamer_category_row_cap,
  source_snapshots,
  observed_category_items,
  missing_category_items,
  coverage_state,
  source_mode,
  contract_version,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(provider, day) DO UPDATE SET
  candidate_category_rows = excluded.candidate_category_rows,
  candidate_streamer_category_rows = excluded.candidate_streamer_category_rows,
  category_row_cap = excluded.category_row_cap,
  streamer_category_row_cap = excluded.streamer_category_row_cap,
  source_snapshots = excluded.source_snapshots,
  observed_category_items = excluded.observed_category_items,
  missing_category_items = excluded.missing_category_items,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  updated_at = excluded.updated_at
`

export const HISTORY_CATEGORY_RETENTION_DELETE_DAILY_SQL = `
DELETE FROM history_category_daily
WHERE provider = ? AND day < date('now', ?)
`

export const HISTORY_CATEGORY_RETENTION_DELETE_STREAMER_SQL = `
DELETE FROM history_category_streamer_daily
WHERE provider = ? AND day < date('now', ?)
`

export const HISTORY_CATEGORY_RETENTION_DELETE_STATUS_SQL = `
DELETE FROM history_category_day_status
WHERE provider = ? AND day < date('now', ?)
`
