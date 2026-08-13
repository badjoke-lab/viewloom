-- ViewLoom 12A-13 Kick History category aggregate migration candidate.
-- Repository-only candidate. Do not apply remotely or add to automatic bootstrap
-- without a separate controlled production schema-apply gate.
--
-- The tables are provider-scoped so the logical shape can be reused later, but
-- this gate authorizes Kick only. It does not authorize Twitch schema/runtime use.

CREATE TABLE IF NOT EXISTS history_category_daily (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  category_id TEXT NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  observed_snapshots INTEGER NOT NULL DEFAULT 0,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, category_id)
);

CREATE INDEX IF NOT EXISTS idx_history_category_daily_category_day
  ON history_category_daily (provider, category_id, day);

CREATE TABLE IF NOT EXISTS history_category_streamer_daily (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  category_id TEXT NOT NULL,
  streamer_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  observed_minutes INTEGER NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, category_id, streamer_id)
);

CREATE INDEX IF NOT EXISTS idx_history_category_streamer_category_day
  ON history_category_streamer_daily (provider, category_id, day, streamer_id);

CREATE TABLE IF NOT EXISTS history_category_day_status (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  candidate_category_rows INTEGER NOT NULL DEFAULT 0,
  candidate_streamer_category_rows INTEGER NOT NULL DEFAULT 0,
  category_row_cap INTEGER NOT NULL,
  streamer_category_row_cap INTEGER NOT NULL,
  source_snapshots INTEGER NOT NULL DEFAULT 0,
  observed_category_items INTEGER NOT NULL DEFAULT 0,
  missing_category_items INTEGER NOT NULL DEFAULT 0,
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);
