import { CATEGORY_CONTRACT_VERSION } from './category-capture'

export const STREAMER_ID_SQL = `LOWER(REPLACE(COALESCE(
  json_extract(j.value, '$.channelLogin'),
  json_extract(j.value, '$.slug'),
  json_extract(j.value, '$.id'),
  json_extract(j.value, '$.displayName'),
  json_extract(j.value, '$.name')
), ' ', '-'))`

export const VIEWERS_SQL = `CAST(COALESCE(
  json_extract(j.value, '$.viewers'),
  json_extract(j.value, '$.viewer_count'),
  json_extract(j.value, '$.viewerCount')
) AS INTEGER)`

export const CATEGORY_PRECHECK_SQL = `
WITH source AS (
  SELECT payload_json, source_mode
  FROM minute_snapshots
  WHERE provider = ? AND substr(bucket_minute, 1, 10) = ?
),
streamers AS (
  SELECT
    ${STREAMER_ID_SQL} AS streamer_id,
    ${VIEWERS_SQL} AS viewers,
    json_extract(s.payload_json, '$.categoryContractVersion') AS category_contract_version,
    CAST(json_extract(
      s.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
    CAST(json_extract(
      s.payload_json,
      '$.categoryIds[' || CAST(json_extract(
        s.payload_json,
        '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
      ) AS INTEGER) AS TEXT) || ']'
    ) AS TEXT) AS category_id
  FROM source s, json_each(s.payload_json, '$.items') j
),
valid AS (
  SELECT *
  FROM streamers
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
)
SELECT
  (SELECT COUNT(*) FROM source) AS source_snapshots,
  (SELECT COUNT(DISTINCT streamer_id) FROM valid) AS candidate_streamers,
  COALESCE(SUM(CASE
    WHEN category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
     AND category_ref IS NOT NULL
     AND category_ref >= 0
     AND category_id IS NOT NULL
     AND category_id != ''
    THEN 1 ELSE 0 END), 0) AS category_observed_items,
  COALESCE(SUM(CASE
    WHEN category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
     AND category_ref IS NOT NULL
     AND category_ref >= 0
     AND category_id IS NOT NULL
     AND category_id != ''
    THEN 0 ELSE 1 END), 0) AS category_missing_items,
  CASE
    WHEN (SELECT COUNT(DISTINCT source_mode) FROM source) = 1
      THEN COALESCE((SELECT MIN(source_mode) FROM source), 'unknown')
    WHEN (SELECT COUNT(*) FROM source) > 0 THEN 'mixed'
    ELSE 'unknown'
  END AS source_mode
FROM valid
`

export const CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL = `
INSERT INTO streamer_intraday_rollups (
  provider,
  day,
  streamer_id,
  display_name,
  daily_rank,
  total_viewer_minutes,
  peak_viewers,
  sample_count,
  observed_minutes,
  hourly_json,
  category_hourly_json,
  category_observed_samples,
  category_missing_samples,
  category_contract_version,
  selection_state,
  source_mode,
  contract_version,
  updated_at
)
WITH RECURSIVE
hours(hour) AS (
  SELECT 0
  UNION ALL
  SELECT hour + 1 FROM hours WHERE hour < 23
),
raw_items AS (
  SELECT
    m.payload_json,
    CAST(strftime('%H', m.bucket_minute) AS INTEGER) AS hour,
    ${STREAMER_ID_SQL} AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    ${VIEWERS_SQL} AS viewers,
    CAST(json_extract(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
    json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version
  FROM minute_snapshots m, json_each(m.payload_json, '$.items') j
  WHERE m.provider = ? AND substr(m.bucket_minute, 1, 10) = ?
),
stream_rows AS (
  SELECT
    r.hour,
    r.streamer_id,
    r.display_name,
    r.viewers,
    CASE
      WHEN r.category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
       AND r.category_ref IS NOT NULL
       AND r.category_ref >= 0
      THEN CAST(json_extract(
        r.payload_json,
        '$.categoryIds[' || CAST(r.category_ref AS TEXT) || ']'
      ) AS TEXT)
      ELSE NULL
    END AS category_id
  FROM raw_items r
),
valid AS (
  SELECT * FROM stream_rows
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
),
totals AS (
  SELECT
    streamer_id,
    MAX(display_name) AS display_name,
    SUM(viewers * ?) AS total_viewer_minutes,
    MAX(viewers) AS peak_viewers,
    COUNT(*) AS sample_count,
    COUNT(*) * ? AS observed_minutes
  FROM valid
  GROUP BY streamer_id
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      ORDER BY total_viewer_minutes DESC, peak_viewers DESC, streamer_id ASC
    ) AS daily_rank
  FROM totals
),
selected AS (
  SELECT * FROM ranked WHERE daily_rank <= ?
),
hourly AS (
  SELECT
    v.streamer_id,
    v.hour,
    SUM(v.viewers * ?) AS viewer_minutes,
    MAX(v.viewers) AS peak_viewers,
    COUNT(*) AS sample_count
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  GROUP BY v.streamer_id, v.hour
),
hourly_ordered AS (
  SELECT * FROM hourly ORDER BY streamer_id, hour
),
hourly_json AS (
  SELECT
    streamer_id,
    json_group_array(json_object(
      'hour', hour,
      'viewerMinutes', viewer_minutes,
      'peakViewers', peak_viewers,
      'sampleCount', sample_count
    )) AS hourly_json
  FROM hourly_ordered
  GROUP BY streamer_id
),
category_stats AS (
  SELECT
    v.streamer_id,
    v.hour,
    v.category_id,
    MAX(d.category_name) AS category_name,
    COUNT(*) AS sample_count,
    SUM(v.viewers * ?) AS viewer_minutes
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  LEFT JOIN provider_category_dictionary d
    ON d.provider = ? AND d.category_id = v.category_id
  WHERE v.category_id IS NOT NULL AND v.category_id != ''
  GROUP BY v.streamer_id, v.hour, v.category_id
),
category_ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY streamer_id, hour
      ORDER BY sample_count DESC, viewer_minutes DESC, category_id ASC
    ) AS category_rank
  FROM category_stats
),
dominant AS (
  SELECT * FROM category_ranked WHERE category_rank = 1
),
used_categories AS (
  SELECT DISTINCT streamer_id, category_id, category_name
  FROM dominant
),
category_indexed AS (
  SELECT
    streamer_id,
    category_id,
    category_name,
    ROW_NUMBER() OVER (
      PARTITION BY streamer_id ORDER BY category_id ASC
    ) - 1 AS category_index
  FROM used_categories
),
category_dictionary_ordered AS (
  SELECT * FROM category_indexed ORDER BY streamer_id, category_index
),
category_dictionary AS (
  SELECT
    streamer_id,
    json_group_array(json_object(
      'id', category_id,
      'name', category_name
    )) AS category_json
  FROM category_dictionary_ordered
  GROUP BY streamer_id
),
category_hours AS (
  SELECT
    s.streamer_id,
    h.hour,
    ci.category_index,
    COALESCE(d.sample_count, 0) AS sample_count,
    COALESCE(d.viewer_minutes, 0) AS viewer_minutes
  FROM selected s
  CROSS JOIN hours h
  LEFT JOIN dominant d
    ON d.streamer_id = s.streamer_id AND d.hour = h.hour
  LEFT JOIN category_indexed ci
    ON ci.streamer_id = d.streamer_id AND ci.category_id = d.category_id
  ORDER BY s.streamer_id, h.hour
),
category_arrays AS (
  SELECT
    streamer_id,
    json_group_array(category_index) AS refs_json,
    json_group_array(sample_count) AS samples_json,
    json_group_array(viewer_minutes) AS minutes_json
  FROM category_hours
  GROUP BY streamer_id
),
category_counts AS (
  SELECT
    v.streamer_id,
    SUM(CASE WHEN v.category_id IS NOT NULL AND v.category_id != '' THEN 1 ELSE 0 END) AS observed_samples,
    SUM(CASE WHEN v.category_id IS NULL OR v.category_id = '' THEN 1 ELSE 0 END) AS missing_samples
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  GROUP BY v.streamer_id
)
SELECT
  ?,
  ?,
  s.streamer_id,
  s.display_name,
  s.daily_rank,
  s.total_viewer_minutes,
  s.peak_viewers,
  s.sample_count,
  s.observed_minutes,
  COALESCE(h.hourly_json, '[]'),
  json_object(
    'v', 1,
    'c', json(COALESCE(cd.category_json, '[]')),
    'r', json(COALESCE(ca.refs_json, '[]')),
    's', json(COALESCE(ca.samples_json, '[]')),
    'm', json(COALESCE(ca.minutes_json, '[]')),
    'o', COALESCE(cc.observed_samples, 0),
    'x', COALESCE(cc.missing_samples, 0)
  ),
  COALESCE(cc.observed_samples, 0),
  COALESCE(cc.missing_samples, 0),
  CASE WHEN COALESCE(cc.observed_samples, 0) > 0 THEN ? ELSE 'unavailable' END,
  ?,
  ?,
  ?,
  ?
FROM selected s
LEFT JOIN hourly_json h ON h.streamer_id = s.streamer_id
LEFT JOIN category_dictionary cd ON cd.streamer_id = s.streamer_id
LEFT JOIN category_arrays ca ON ca.streamer_id = s.streamer_id
LEFT JOIN category_counts cc ON cc.streamer_id = s.streamer_id
ON CONFLICT(provider, day, streamer_id) DO UPDATE SET
  display_name = excluded.display_name,
  daily_rank = excluded.daily_rank,
  total_viewer_minutes = excluded.total_viewer_minutes,
  peak_viewers = excluded.peak_viewers,
  sample_count = excluded.sample_count,
  observed_minutes = excluded.observed_minutes,
  hourly_json = excluded.hourly_json,
  category_hourly_json = excluded.category_hourly_json,
  category_observed_samples = excluded.category_observed_samples,
  category_missing_samples = excluded.category_missing_samples,
  category_contract_version = excluded.category_contract_version,
  selection_state = excluded.selection_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  updated_at = excluded.updated_at
`

export const CATEGORY_STATUS_UPSERT_SQL = `
INSERT INTO intraday_rollup_status (
  provider,
  day,
  candidate_streamers,
  retained_streamers,
  retained_streamer_cap,
  source_snapshots,
  selection_state,
  coverage_state,
  source_mode,
  contract_version,
  refreshed_at,
  category_observed_streamers,
  category_observed_samples,
  category_missing_samples,
  category_coverage_state
)
SELECT
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  COUNT(CASE WHEN category_observed_samples > 0 THEN 1 END),
  COALESCE(SUM(category_observed_samples), 0),
  COALESCE(SUM(category_missing_samples), 0),
  CASE
    WHEN COALESCE(SUM(category_observed_samples), 0) = 0
     AND COALESCE(SUM(category_missing_samples), 0) = 0 THEN 'unavailable'
    WHEN COALESCE(SUM(category_missing_samples), 0) > 0 THEN 'missing_from_source'
    ELSE 'observed'
  END
FROM streamer_intraday_rollups
WHERE provider = ? AND day = ?
ON CONFLICT(provider, day) DO UPDATE SET
  candidate_streamers = excluded.candidate_streamers,
  retained_streamers = excluded.retained_streamers,
  retained_streamer_cap = excluded.retained_streamer_cap,
  source_snapshots = excluded.source_snapshots,
  selection_state = excluded.selection_state,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  refreshed_at = excluded.refreshed_at,
  category_observed_streamers = excluded.category_observed_streamers,
  category_observed_samples = excluded.category_observed_samples,
  category_missing_samples = excluded.category_missing_samples,
  category_coverage_state = excluded.category_coverage_state
`
