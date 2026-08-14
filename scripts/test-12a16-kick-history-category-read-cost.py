#!/usr/bin/env python3
import datetime as dt
import json
import sqlite3
from pathlib import Path

TARGET_DAY = '2026-08-14'
RETAINED_DAYS = 60
CADENCE_MINUTES = 5
SNAPSHOTS_PER_DAY = 24 * 60 // CADENCE_MINUTES
EXPECTED_RETAINED = RETAINED_DAYS * SNAPSHOTS_PER_DAY
PRODUCTION_OBSERVED_TARGET_SNAPSHOTS = 51

OLD_SQL = '''
SELECT bucket_minute
FROM minute_snapshots
WHERE provider = ? AND substr(bucket_minute, 1, 10) = ?
ORDER BY bucket_minute
'''

NEW_SQL = '''
WITH bounds AS (
  SELECT ? AS provider, ? AS day
)
SELECT m.bucket_minute
FROM minute_snapshots m, bounds b
WHERE m.provider = b.provider
  AND m.bucket_minute >= (b.day || 'T00:00:00.000Z')
  AND m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')
ORDER BY m.bucket_minute
'''


def iso_minute(value: dt.datetime) -> str:
    return value.strftime('%Y-%m-%dT%H:%M:00.000Z')


def plan_text(db: sqlite3.Connection, sql: str, params: tuple[str, str]) -> str:
    rows = db.execute('EXPLAIN QUERY PLAN ' + sql, params).fetchall()
    return ' | '.join(str(row[3]) for row in rows)


def main() -> None:
    source = Path('workers/shared/history-category-aggregate-sql.ts').read_text()
    schema = Path('db/kick/migrations/0001_kick_hot_schema.sql').read_text()
    collector = Path('workers/collector-kick/src/index-category.ts').read_text()

    assert 'PRIMARY KEY (provider, bucket_minute)' in schema
    assert 'idx_minute_snapshots_provider_bucket' in schema
    assert 'ON minute_snapshots (provider, bucket_minute DESC)' in schema
    assert 'return copy.toISOString()' in collector
    assert "unixepoch('now', '-60 days')" in collector

    assert 'substr(bucket_minute, 1, 10)' not in source
    assert 'substr(m.bucket_minute, 1, 10)' not in source
    assert source.count('SELECT ? AS provider, ? AS day') == 3
    assert source.count("m.bucket_minute >= (b.day || 'T00:00:00.000Z')") == 3
    assert source.count("m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')") == 3

    db = sqlite3.connect(':memory:')
    db.executescript('''
      CREATE TABLE minute_snapshots (
        provider TEXT NOT NULL,
        bucket_minute TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        total_viewers INTEGER NOT NULL DEFAULT 0,
        stream_count INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL,
        source_mode TEXT NOT NULL DEFAULT 'real',
        PRIMARY KEY (provider, bucket_minute)
      );
      CREATE INDEX idx_minute_snapshots_provider_bucket
        ON minute_snapshots (provider, bucket_minute DESC);
      CREATE INDEX idx_minute_snapshots_collected_at
        ON minute_snapshots (collected_at DESC);
    ''')

    target = dt.datetime.fromisoformat(TARGET_DAY + 'T00:00:00+00:00')
    first = target - dt.timedelta(days=RETAINED_DAYS - 1)
    rows = []
    for day_offset in range(RETAINED_DAYS):
        day_start = first + dt.timedelta(days=day_offset)
        for minute in range(0, 24 * 60, CADENCE_MINUTES):
            stamp = day_start + dt.timedelta(minutes=minute)
            bucket = iso_minute(stamp)
            rows.append(('kick', bucket, bucket, 0, 0, '{"items":[]}', 'authenticated'))
    # A second provider on the target day proves provider separation.
    for minute in range(0, 24 * 60, CADENCE_MINUTES):
        stamp = target + dt.timedelta(minutes=minute)
        bucket = iso_minute(stamp)
        rows.append(('twitch', bucket, bucket, 0, 0, '{"items":[]}', 'real'))

    db.executemany('''
      INSERT INTO minute_snapshots
        (provider,bucket_minute,collected_at,total_viewers,stream_count,payload_json,source_mode)
      VALUES (?,?,?,?,?,?,?)
    ''', rows)
    db.commit()

    retained = db.execute("SELECT COUNT(*) FROM minute_snapshots WHERE provider='kick'").fetchone()[0]
    assert retained == EXPECTED_RETAINED, (retained, EXPECTED_RETAINED)

    old_rows = [row[0] for row in db.execute(OLD_SQL, ('kick', TARGET_DAY)).fetchall()]
    new_rows = [row[0] for row in db.execute(NEW_SQL, ('kick', TARGET_DAY)).fetchall()]
    assert old_rows == new_rows
    assert len(new_rows) == SNAPSHOTS_PER_DAY
    assert all(value.startswith(TARGET_DAY) for value in new_rows)

    previous_day = (target - dt.timedelta(days=1)).strftime('%Y-%m-%d')
    next_day = (target + dt.timedelta(days=1)).strftime('%Y-%m-%d')
    assert not any(value.startswith(previous_day) for value in new_rows)
    assert not any(value.startswith(next_day) for value in new_rows)
    twitch_target = db.execute(NEW_SQL, ('twitch', TARGET_DAY)).fetchall()
    assert len(twitch_target) == SNAPSHOTS_PER_DAY

    old_plan = plan_text(db, OLD_SQL, ('kick', TARGET_DAY))
    new_plan = plan_text(db, NEW_SQL, ('kick', TARGET_DAY))
    assert 'provider=?' in old_plan, old_plan
    assert 'bucket_minute>?' not in old_plan, old_plan
    assert 'bucket_minute<?' not in old_plan, old_plan
    assert 'idx_minute_snapshots_provider_bucket' in new_plan, new_plan
    assert 'provider=?' in new_plan, new_plan
    assert 'bucket_minute>?' in new_plan, new_plan
    assert 'bucket_minute<?' in new_plan, new_plan

    report = {
        'retainedDays': RETAINED_DAYS,
        'cadenceMinutes': CADENCE_MINUTES,
        'retainedKickSnapshots': retained,
        'targetFullDaySnapshots': len(new_rows),
        'oldBaseCandidateRowsPerQueryModel': retained,
        'newBaseCandidateRowsPerQueryModel': len(new_rows),
        'baseCandidateReductionFactorFullDay': retained / len(new_rows),
        'productionObservedTargetSnapshots': PRODUCTION_OBSERVED_TARGET_SNAPSHOTS,
        'baseCandidateReductionFactorProductionObservedDayApprox': retained / PRODUCTION_OBSERVED_TARGET_SNAPSHOTS,
        'oldPlan': old_plan,
        'optimizedPlan': new_plan,
        'semanticSnapshotKeysEqual': old_rows == new_rows,
        'additionalIndexRequired': False,
        'productionExecutionAuthorized': False,
    }
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
