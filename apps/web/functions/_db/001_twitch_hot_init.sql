PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS minute_snapshots (
  provider TEXT NOT NULL,
  bucket_minute TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  covered_pages INTEGER NOT NULL DEFAULT 0,
  has_more INTEGER NOT NULL DEFAULT 0,
  stream_count INTEGER NOT NULL DEFAULT 0,
  total_viewers INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  source_mode TEXT NOT NULL DEFAULT 'real',
  PRIMARY KEY (provider, bucket_minute)
);

CREATE INDEX IF NOT EXISTS idx_minute_snapshots_provider_bucket
  ON minute_snapshots(provider, bucket_minute DESC);

CREATE INDEX IF NOT EXISTS idx_minute_snapshots_collected_at
  ON minute_snapshots(collected_at DESC);

CREATE TABLE IF NOT EXISTS collector_status (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle',
  last_attempt_at TEXT,
  last_success_at TEXT,
  last_failure_at TEXT,
  last_error TEXT,
  latest_bucket_minute TEXT,
  latest_collected_at TEXT,
  latest_stream_count INTEGER NOT NULL DEFAULT 0,
  latest_total_viewers INTEGER NOT NULL DEFAULT 0,
  covered_pages INTEGER NOT NULL DEFAULT 0,
  has_more INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS collector_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  run_at TEXT NOT NULL,
  bucket_minute TEXT,
  status TEXT NOT NULL,
  error_text TEXT,
  stream_count INTEGER NOT NULL DEFAULT 0,
  total_viewers INTEGER NOT NULL DEFAULT 0,
  covered_pages INTEGER NOT NULL DEFAULT 0,
  has_more INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_collector_runs_provider_run_at
  ON collector_runs(provider, run_at DESC);

INSERT INTO collector_status (
  provider,
  status,
  updated_at
)
VALUES (
  'twitch',
  'idle',
  strftime('%Y-%m-%dT%H:%M:%fZ','now')
)
ON CONFLICT(provider) DO NOTHING;
