-- Optional fixture seed for validating Kick pages before live collector wiring.
-- Run only against the Kick D1 database: vl_kick_hot.

INSERT OR REPLACE INTO minute_snapshots (
  provider,
  bucket_minute,
  collected_at,
  total_viewers,
  stream_count,
  payload_json,
  source_mode
) VALUES (
  'kick',
  strftime('%Y-%m-%dT%H:%M:00.000Z', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  5650,
  3,
  '{"items":[{"slug":"sample-kick-alpha","username":"sample-kick-alpha","displayName":"sample-kick-alpha","title":"Fixture stream alpha","viewer_count":2400,"url":"https://kick.com/sample-kick-alpha"},{"slug":"sample-kick-beta","username":"sample-kick-beta","displayName":"sample-kick-beta","title":"Fixture stream beta","viewer_count":1850,"url":"https://kick.com/sample-kick-beta"},{"slug":"sample-kick-gamma","username":"sample-kick-gamma","displayName":"sample-kick-gamma","title":"Fixture stream gamma","viewer_count":1400,"url":"https://kick.com/sample-kick-gamma"}]}' ,
  'fixture'
);
