#!/usr/bin/env python3
import json
import sqlite3
from pathlib import Path

SNAPSHOTS = 288
STREAMS = 100
ITEMS = SNAPSHOTS * STREAMS
RAW_PATHS = 3
RAW_ITEM_TOUCHES = ITEMS * RAW_PATHS
RAW_SNAPSHOT_TOUCHES = SNAPSHOTS * RAW_PATHS
AGGREGATE_MAX = 300 + 1000 + 1
SCHEMA_TOUCHES = 5 * 3
LATEST_TOUCHES = 1
LEAKAGE_TOUCHES = 2
BASE = RAW_ITEM_TOUCHES + RAW_SNAPSHOT_TOUCHES + AGGREGATE_MAX + AGGREGATE_MAX + SCHEMA_TOUCHES + LATEST_TOUCHES + LEAKAGE_TOUCHES
WITH_SAFETY = int(BASE * 1.25)

LEAKAGE_SQL = '''
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM minute_snapshots WHERE provider < 'kick' LIMIT 1)
    OR EXISTS (SELECT 1 FROM minute_snapshots WHERE provider > 'kick' LIMIT 1)
  THEN 1 ELSE 0
END AS count
'''


def plan(db, sql):
    return ' | '.join(str(r[3]) for r in db.execute('EXPLAIN QUERY PLAN ' + sql).fetchall())


def main():
    sql_source = Path('workers/shared/history-category-aggregate-sql.ts').read_text()
    probe = Path('workers/history-category-aggregate-cost-probe/src/index.ts').read_text()
    precheck = sql_source.split('export const HISTORY_CATEGORY_PRECHECK_SQL = `', 1)[1].split('`\n\nexport const HISTORY_CATEGORY_INSERT_DAILY_SQL', 1)[0]

    assert 'item_stats AS (' in precheck
    assert 'source_stats AS (' in precheck
    assert 'accepted AS (' not in precheck
    assert '(SELECT COUNT(*) FROM observed)' not in precheck
    assert '(SELECT COUNT(*) FROM accepted)' not in precheck
    assert 'COUNT(DISTINCT CASE WHEN' in precheck
    assert 'json_array(category_id, streamer_id)' in precheck
    assert "m.bucket_minute >= (b.day || 'T00:00:00.000Z')" in precheck
    assert "m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')" in precheck

    assert "SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider != 'kick'" not in probe
    assert "WHERE provider < 'kick'" in probe
    assert "WHERE provider > 'kick'" in probe
    assert "providerLeakageCheck: 'indexed_exists_ranges'" in probe

    db = sqlite3.connect(':memory:')
    db.executescript('''
      CREATE TABLE minute_snapshots (
        provider TEXT NOT NULL,
        bucket_minute TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY(provider, bucket_minute)
      );
      CREATE INDEX idx_minute_snapshots_provider_bucket
        ON minute_snapshots(provider, bucket_minute DESC);
    ''')
    for i in range(60 * SNAPSHOTS):
        db.execute('INSERT INTO minute_snapshots VALUES (?,?,?)', ('kick', f'2026-01-{1 + i // SNAPSHOTS:02d}T00:{i % 60:02d}:00.000Z', '{}'))
    db.commit()
    assert db.execute(LEAKAGE_SQL).fetchone()[0] == 0

    db.execute("INSERT INTO minute_snapshots VALUES ('aaa','2026-08-14T00:00:00.000Z','{}')")
    assert db.execute(LEAKAGE_SQL).fetchone()[0] == 1
    db.execute("DELETE FROM minute_snapshots WHERE provider='aaa'")
    db.execute("INSERT INTO minute_snapshots VALUES ('zzz','2026-08-14T00:00:00.000Z','{}')")
    assert db.execute(LEAKAGE_SQL).fetchone()[0] == 1

    p = plan(db, LEAKAGE_SQL)
    assert 'provider<?' in p, p
    assert 'provider>?' in p, p

    assert ITEMS == 28800
    assert RAW_ITEM_TOUCHES == 86400
    assert RAW_SNAPSHOT_TOUCHES == 864
    assert BASE == 89884
    assert WITH_SAFETY == 112355
    assert WITH_SAFETY <= 125000
    assert WITH_SAFETY < 250000

    print(json.dumps({
      'maxSnapshotsPerDay': SNAPSHOTS,
      'maxStreamsPerSnapshot': STREAMS,
      'maxStreamItemsPerDay': ITEMS,
      'rawCategoryPaths': RAW_PATHS,
      'rawItemLogicalTouches': RAW_ITEM_TOUCHES,
      'rawSnapshotLogicalTouches': RAW_SNAPSHOT_TOUCHES,
      'baseLogicalTouches': BASE,
      'logicalTouchesWith25PctSafety': WITH_SAFETY,
      'repositoryModelCeiling': 125000,
      'productionRowsReadMaximum': 250000,
      'leakagePlan': p,
      'modelIsRemoteD1Evidence': False,
      'productionExecutionAuthorized': False,
    }, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
