-- Kick channel registry migration skeleton.
--
-- Do not run against production until the registry-backed collector PR is ready.
-- Current Kick coverage remains seed-list coverage.

CREATE TABLE IF NOT EXISTS kick_channels (
  slug TEXT PRIMARY KEY,
  display_name TEXT,
  url TEXT,
  last_seen_at TEXT,
  last_live_at TEXT,
  last_checked_at TEXT,
  last_viewer_count INTEGER,
  last_title TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'seed',
  status TEXT NOT NULL DEFAULT 'candidate',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kick_channels_status_priority
ON kick_channels (status, priority DESC, last_live_at DESC, last_checked_at ASC);

CREATE INDEX IF NOT EXISTS idx_kick_channels_last_live
ON kick_channels (last_live_at DESC);

CREATE INDEX IF NOT EXISTS idx_kick_channels_last_checked
ON kick_channels (last_checked_at ASC);
