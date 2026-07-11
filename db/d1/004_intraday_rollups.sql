-- ViewLoom Phase 12A-2 compact intraday rollup schema.
-- Apply to both vl_twitch_hot and vl_kick_hot.
-- Schema only: no backfill, refresh, generation, retention, or category capture.

CREATE TABLE IF NOT EXISTS streamer_intraday_rollups (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  streamer_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  daily_rank INTEGER NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  observed_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_json TEXT NOT NULL DEFAULT '[]',
  selection_state TEXT NOT NULL DEFAULT 'complete_within_daily_cap',
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, streamer_id)
);

CREATE INDEX IF NOT EXISTS idx_intraday_streamer_day
  ON streamer_intraday_rollups (provider, streamer_id, day);

CREATE TABLE IF NOT EXISTS intraday_rollup_status (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  candidate_streamers INTEGER NOT NULL,
  retained_streamers INTEGER NOT NULL,
  retained_streamer_cap INTEGER NOT NULL,
  source_snapshots INTEGER NOT NULL,
  selection_state TEXT NOT NULL,
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  refreshed_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);
