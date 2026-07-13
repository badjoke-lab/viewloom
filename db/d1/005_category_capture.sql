-- ViewLoom Phase 12A-4 provider-specific category capture migration candidate.
--
-- Repository-only in this workstream. Do not apply to production until the later
-- production execution-cost and remote-migration gate is accepted.
--
-- SQLite does not support ALTER TABLE ... ADD COLUMN IF NOT EXISTS. Controlled
-- application must probe PRAGMA table_info before each ALTER statement. The
-- local acceptance fixture does this and verifies second-pass idempotency.

CREATE TABLE IF NOT EXISTS provider_category_dictionary (
  provider TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  PRIMARY KEY (provider, category_id)
);

ALTER TABLE streamer_intraday_rollups
  ADD COLUMN category_hourly_json TEXT NOT NULL
  DEFAULT '{"v":1,"c":[],"r":[],"s":[],"m":[],"o":0,"x":0}';

ALTER TABLE streamer_intraday_rollups
  ADD COLUMN category_observed_samples INTEGER NOT NULL DEFAULT 0;

ALTER TABLE streamer_intraday_rollups
  ADD COLUMN category_missing_samples INTEGER NOT NULL DEFAULT 0;

ALTER TABLE streamer_intraday_rollups
  ADD COLUMN category_contract_version TEXT NOT NULL DEFAULT 'unavailable';

ALTER TABLE intraday_rollup_status
  ADD COLUMN category_observed_streamers INTEGER NOT NULL DEFAULT 0;

ALTER TABLE intraday_rollup_status
  ADD COLUMN category_observed_samples INTEGER NOT NULL DEFAULT 0;

ALTER TABLE intraday_rollup_status
  ADD COLUMN category_missing_samples INTEGER NOT NULL DEFAULT 0;

ALTER TABLE intraday_rollup_status
  ADD COLUMN category_coverage_state TEXT NOT NULL DEFAULT 'unavailable';
