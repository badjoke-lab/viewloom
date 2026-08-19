-- ViewLoom 12A-40 Kick History chunked contributor schema prototype.
-- REPOSITORY-LOCAL BENCHMARK ONLY.
--
-- This file is intentionally outside db/d1 migrations. It must not be applied to
-- production by an automatic migration/bootstrap path. Production schema/runtime
-- changes remain separately gated.

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
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);
