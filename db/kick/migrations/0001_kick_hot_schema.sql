-- ViewLoom Kick hot snapshot schema
-- Target D1 name: vl_kick_hot
-- Required Pages Functions binding: DB_KICK_HOT

CREATE TABLE IF NOT EXISTS minute_snapshots (
  provider TEXT NOT NULL,
  bucket_minute TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  total_viewers INTEGER NOT NULL DEFAULT 0,
  stream_count INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  source_mode TEXT NOT NULL DEFAULT 'real',
  PRIMARY KEY (provider, bucket_minute)
);

CREATE INDEX IF NOT EXISTS idx_minute_snapshots_provider_bucket
  ON minute_snapshots (provider, bucket_minute DESC);

CREATE INDEX IF NOT EXISTS idx_minute_snapshots_collected_at
  ON minute_snapshots (collected_at DESC);
