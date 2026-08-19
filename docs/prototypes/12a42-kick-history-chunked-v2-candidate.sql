-- ViewLoom 12A-42 Kick History Category v2 concrete schema candidate.
-- REPOSITORY-ONLY. DO NOT APPLY TO PRODUCTION FROM THIS PACKAGE.
--
-- This prototype stays outside db/d1 so it cannot be picked up by an automatic
-- migration/bootstrap path. A separate production schema-application gate is
-- required after this candidate is accepted.

PRAGMA page_size = 4096;
PRAGMA journal_mode = DELETE;

CREATE TABLE history_category_daily_v2 (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  category_id TEXT NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  observed_snapshots INTEGER NOT NULL DEFAULT 0,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, category_id)
);

CREATE INDEX idx_history_category_daily_v2_category_day
  ON history_category_daily_v2 (provider, category_id, day);

CREATE TABLE history_category_streamer_daily_chunks_v2 (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  category_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  contributor_count INTEGER NOT NULL,
  contributors_json TEXT NOT NULL,
  encoded_bytes INTEGER NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, category_id, chunk_index)
);

CREATE INDEX idx_history_category_streamer_chunks_v2_category_day
  ON history_category_streamer_daily_chunks_v2 (provider, category_id, day, chunk_index);

CREATE TABLE history_category_day_status_v2 (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  candidate_category_rows INTEGER NOT NULL DEFAULT 0,
  logical_streamer_category_contributors INTEGER NOT NULL DEFAULT 0,
  physical_contributor_chunk_rows INTEGER NOT NULL DEFAULT 0,
  contributor_encoded_bytes INTEGER NOT NULL DEFAULT 0,
  category_row_cap INTEGER NOT NULL,
  physical_contributor_row_budget INTEGER NOT NULL,
  contributor_encoded_bytes_cap INTEGER NOT NULL,
  source_snapshots INTEGER NOT NULL DEFAULT 0,
  observed_category_items INTEGER NOT NULL DEFAULT 0,
  missing_category_items INTEGER NOT NULL DEFAULT 0,
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);

-- Candidate read shape. Select provider/category/day chunks first, expand every
-- contributor tuple, aggregate the selected period, then rank. A production API
-- candidate must preserve this order rather than pre-ranking individual days.
--
-- SELECT streamer_id, MAX(display_name), SUM(viewer_minutes), MAX(peak_viewers),
--        SUM(observed_minutes), SUM(sample_count)
-- FROM (
--   SELECT
--     CAST(json_extract(j.value, '$[0]') AS TEXT) AS streamer_id,
--     CAST(json_extract(j.value, '$[1]') AS TEXT) AS display_name,
--     CAST(json_extract(j.value, '$[2]') AS INTEGER) AS viewer_minutes,
--     CAST(json_extract(j.value, '$[3]') AS INTEGER) AS peak_viewers,
--     CAST(json_extract(j.value, '$[4]') AS INTEGER) AS observed_minutes,
--     CAST(json_extract(j.value, '$[5]') AS INTEGER) AS sample_count
--   FROM history_category_streamer_daily_chunks_v2 c,
--        json_each(c.contributors_json) j
--   WHERE c.provider = ?
--     AND c.category_id = ?
--     AND c.day >= ? AND c.day <= ?
-- )
-- GROUP BY streamer_id
-- ORDER BY SUM(viewer_minutes) DESC, MAX(peak_viewers) DESC, streamer_id;
