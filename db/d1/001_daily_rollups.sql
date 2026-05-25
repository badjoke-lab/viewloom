-- ViewLoom Free Strong daily rollups schema.
-- Apply to both vl_twitch_hot and vl_kick_hot.
-- This table is the long-term History read path.

CREATE TABLE IF NOT EXISTS daily_rollups (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  peak_streamer_id TEXT,
  peak_streamer_name TEXT,
  observed_snapshots INTEGER NOT NULL DEFAULT 0,
  observed_stream_count INTEGER NOT NULL DEFAULT 0,
  top_streamers_json TEXT NOT NULL DEFAULT '[]',
  coverage_state TEXT NOT NULL DEFAULT 'partial',
  source_mode TEXT NOT NULL DEFAULT 'real',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_rollups_provider_day
  ON daily_rollups (provider, day);
