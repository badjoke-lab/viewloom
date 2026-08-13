#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SQL_SOURCE = Path('workers/shared/history-category-aggregate-sql.ts').read_text()
MIGRATION = Path('db/d1/006_history_category_aggregate.sql').read_text()
CONTRACT = 'category-source-v1'
DAY = '2026-08-13'


def extract(name: str) -> str:
    match = re.search(rf"export const {name} = `([\s\S]*?)`\n", SQL_SOURCE)
    assert match, f'missing SQL constant: {name}'
    return match.group(1).replace('${CATEGORY_CONTRACT_VERSION}', CONTRACT)


PRECHECK = extract('HISTORY_CATEGORY_PRECHECK_SQL')
INSERT_DAILY = extract('HISTORY_CATEGORY_INSERT_DAILY_SQL')
INSERT_STREAMER = extract('HISTORY_CATEGORY_INSERT_STREAMER_DAILY_SQL')
STATUS_UPSERT = extract('HISTORY_CATEGORY_STATUS_UPSERT_SQL')
RETENTION_DAILY = extract('HISTORY_CATEGORY_RETENTION_DELETE_DAILY_SQL')
RETENTION_STREAMER = extract('HISTORY_CATEGORY_RETENTION_DELETE_STREAMER_SQL')
RETENTION_STATUS = extract('HISTORY_CATEGORY_RETENTION_DELETE_STATUS_SQL')


def connection() -> sqlite3.Connection:
    db = sqlite3.connect(':memory:')
    db.row_factory = sqlite3.Row
    db.executescript('''
      CREATE TABLE minute_snapshots (
        provider TEXT NOT NULL,
        bucket_minute TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        total_viewers INTEGER NOT NULL,
        stream_count INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        source_mode TEXT NOT NULL,
        PRIMARY KEY (provider, bucket_minute)
      );
      CREATE INDEX idx_minute_snapshots_provider_bucket
        ON minute_snapshots (provider, bucket_minute);
    ''')
    db.executescript(MIGRATION)
    return db


def insert_snapshot(db: sqlite3.Connection, provider: str, minute: str, items: list[dict], category_ids: list[str], refs: list[object], contract: str = CONTRACT, source_mode: str = 'authenticated') -> None:
    payload = {
        'items': items,
        'categoryContractVersion': contract,
        'categoryIds': category_ids,
        'categoryRefs': refs,
    }
    db.execute(
        'INSERT INTO minute_snapshots VALUES (?, ?, ?, ?, ?, ?, ?)',
        (
            provider,
            minute,
            minute,
            sum(int(item.get('viewers', 0)) for item in items),
            len(items),
            json.dumps(payload, separators=(',', ':')),
            source_mode,
        ),
    )


def item(streamer: str, viewers: int) -> dict:
    return {'channelLogin': streamer, 'displayName': streamer.upper(), 'viewers': viewers}


def precheck(db: sqlite3.Connection, day: str) -> sqlite3.Row:
    return db.execute(PRECHECK, ('kick', day)).fetchone()


def generate_exact(db: sqlite3.Connection, day: str, source_mode: str = 'authenticated') -> None:
    db.execute('DELETE FROM history_category_daily WHERE provider=? AND day=?', ('kick', day))
    db.execute('DELETE FROM history_category_streamer_daily WHERE provider=? AND day=?', ('kick', day))
    db.execute(
        INSERT_DAILY,
        ('kick', day, 5, 'kick', day, source_mode, CONTRACT, f'{day}T12:30:00Z'),
    )
    db.execute(
        INSERT_STREAMER,
        ('kick', day, 5, 5, 'kick', day, CONTRACT, f'{day}T12:30:00Z'),
    )


def test_exact_switching_peak_and_idempotency() -> None:
    db = connection()
    insert_snapshot(db, 'kick', f'{DAY}T00:00:00.000Z', [item('a', 100), item('b', 50), item('c', 200)], ['c1', 'c2'], [0, 0, 1])
    insert_snapshot(db, 'kick', f'{DAY}T00:05:00.000Z', [item('a', 80), item('b', 70), item('c', 100)], ['c1', 'c2'], [1, 0, 1])
    insert_snapshot(db, 'kick', f'{DAY}T00:10:00.000Z', [item('a', 120), item('b', 20), item('c', 90)], ['c1', 'c2'], [0, 0, 1])

    before = dict(precheck(db, DAY))
    assert before['source_snapshots'] == 3
    assert before['valid_stream_items'] == 9
    assert before['category_observed_items'] == 9
    assert before['category_missing_items'] == 0
    assert before['candidate_category_rows'] == 2
    assert before['candidate_streamer_category_rows'] == 4
    assert before['source_mode'] == 'authenticated'
    # Three snapshots is deliberately partial coverage, but accepted category
    # contributions for those snapshots remain exact.
    assert before['source_snapshots'] < 240

    # Twitch rows on the same day must never influence Kick aggregates.
    insert_snapshot(db, 'twitch', f'{DAY}T00:00:00.000Z', [item('foreign', 999999)], ['c1'], [0], source_mode='real')
    assert dict(precheck(db, DAY)) == before

    generate_exact(db, DAY)
    daily = {
        row['category_id']: dict(row)
        for row in db.execute('SELECT * FROM history_category_daily WHERE provider=? AND day=? ORDER BY category_id', ('kick', DAY))
    }
    assert set(daily) == {'c1', 'c2'}
    # c1 concurrent snapshot totals: 150, 70, 140 -> peak 150 and 1800 viewer-minutes.
    assert daily['c1']['peak_viewers'] == 150
    assert daily['c1']['total_viewer_minutes'] == 1800
    assert daily['c1']['observed_snapshots'] == 3
    # c2 concurrent snapshot totals: 200, 180, 90 -> peak 200 and 2350 viewer-minutes.
    assert daily['c2']['peak_viewers'] == 200
    assert daily['c2']['total_viewer_minutes'] == 2350
    assert daily['c2']['observed_snapshots'] == 3

    pairs = {
        (row['category_id'], row['streamer_id']): dict(row)
        for row in db.execute('SELECT * FROM history_category_streamer_daily WHERE provider=? AND day=?', ('kick', DAY))
    }
    assert len(pairs) == 4
    assert pairs[('c1', 'a')]['viewer_minutes'] == 1100
    assert pairs[('c1', 'a')]['peak_viewers'] == 120
    assert pairs[('c1', 'a')]['observed_minutes'] == 10
    assert pairs[('c1', 'a')]['sample_count'] == 2
    assert pairs[('c2', 'a')]['viewer_minutes'] == 400
    assert pairs[('c2', 'a')]['peak_viewers'] == 80
    assert pairs[('c1', 'b')]['viewer_minutes'] == 700
    assert pairs[('c2', 'c')]['viewer_minutes'] == 1950

    snapshot_before = [tuple(row) for row in db.execute('SELECT * FROM history_category_daily ORDER BY category_id')]
    pair_before = [tuple(row) for row in db.execute('SELECT * FROM history_category_streamer_daily ORDER BY category_id, streamer_id')]
    generate_exact(db, DAY)
    assert [tuple(row) for row in db.execute('SELECT * FROM history_category_daily ORDER BY category_id')] == snapshot_before
    assert [tuple(row) for row in db.execute('SELECT * FROM history_category_streamer_daily ORDER BY category_id, streamer_id')] == pair_before


def test_missing_and_ref_type_fail_close_precheck() -> None:
    missing_day = '2026-08-12'
    db = connection()
    insert_snapshot(db, 'kick', f'{missing_day}T00:00:00.000Z', [item('a', 10), item('b', 20)], ['c1'], [0, None])
    row = precheck(db, missing_day)
    assert row['category_observed_items'] == 1
    assert row['category_missing_items'] == 1

    typed_day = '2026-08-11'
    insert_snapshot(db, 'kick', f'{typed_day}T00:00:00.000Z', [item('a', 10), item('b', 20)], ['c1'], [0, '0'])
    typed = precheck(db, typed_day)
    assert typed['category_observed_items'] == 1
    assert typed['category_missing_items'] == 1, 'string ref must not be coerced into an accepted integer ref'

    wrong_contract_day = '2026-08-10'
    insert_snapshot(db, 'kick', f'{wrong_contract_day}T00:00:00.000Z', [item('a', 10)], ['c1'], [0], contract='wrong-contract')
    wrong = precheck(db, wrong_contract_day)
    assert wrong['category_observed_items'] == 0
    assert wrong['category_missing_items'] == 1


def test_overflow_counts() -> None:
    category_day = '2026-08-09'
    db = connection()
    category_index = 0
    for snap in range(4):
        count = 100 if snap < 3 else 1
        items = []
        ids = []
        refs = []
        for position in range(count):
            ids.append(f'cat-{category_index}')
            items.append(item(f's-{category_index}', 1))
            refs.append(position)
            category_index += 1
        insert_snapshot(db, 'kick', f'{category_day}T00:{snap:02d}:00.000Z', items, ids, refs)
    category_overflow = precheck(db, category_day)
    assert category_overflow['candidate_category_rows'] == 301
    assert category_overflow['candidate_streamer_category_rows'] == 301
    assert category_overflow['candidate_category_rows'] > 300

    pair_day = '2026-08-08'
    pair_index = 0
    for snap in range(11):
        count = 100 if snap < 10 else 1
        items = []
        refs = []
        category_ids = [f'cat-{index}' for index in range(10)]
        for position in range(count):
            items.append(item(f'pair-{pair_index}', 1))
            refs.append(position % 10)
            pair_index += 1
        insert_snapshot(db, 'kick', f'{pair_day}T{snap:02d}:00:00.000Z', items, category_ids, refs)
    pair_overflow = precheck(db, pair_day)
    assert pair_overflow['candidate_category_rows'] == 10
    assert pair_overflow['candidate_streamer_category_rows'] == 1001
    assert pair_overflow['candidate_streamer_category_rows'] > 1000


def test_status_and_retention() -> None:
    db = connection()
    now_day = datetime.now(timezone.utc).date().isoformat()
    old_day = '2000-01-01'
    for day in [old_day, now_day]:
        db.execute(
            'INSERT INTO history_category_daily VALUES (?, ?, ?, 1, 1, 1, ?, ?, ?)',
            ('kick', day, 'c1', 'authenticated', CONTRACT, f'{day}T00:00:00Z'),
        )
        db.execute(
            'INSERT INTO history_category_streamer_daily VALUES (?, ?, ?, ?, ?, 1, 1, 5, 1, ?, ?)',
            ('kick', day, 'c1', 's1', 'S1', CONTRACT, f'{day}T00:00:00Z'),
        )
        db.execute(
            STATUS_UPSERT,
            ('kick', day, 1, 1, 300, 1000, 1, 1, 0, 'observed', 'authenticated', CONTRACT, f'{day}T00:00:00Z'),
        )
    boundary = '-180 days'
    db.execute(RETENTION_DAILY, ('kick', boundary))
    db.execute(RETENTION_STREAMER, ('kick', boundary))
    db.execute(RETENTION_STATUS, ('kick', boundary))
    assert db.execute('SELECT COUNT(*) FROM history_category_daily WHERE day=?', (old_day,)).fetchone()[0] == 0
    assert db.execute('SELECT COUNT(*) FROM history_category_streamer_daily WHERE day=?', (old_day,)).fetchone()[0] == 0
    assert db.execute('SELECT COUNT(*) FROM history_category_day_status WHERE day=?', (old_day,)).fetchone()[0] == 0
    assert db.execute('SELECT COUNT(*) FROM history_category_daily WHERE day=?', (now_day,)).fetchone()[0] == 1
    assert db.execute('SELECT COUNT(*) FROM history_category_streamer_daily WHERE day=?', (now_day,)).fetchone()[0] == 1
    assert db.execute('SELECT COUNT(*) FROM history_category_day_status WHERE day=?', (now_day,)).fetchone()[0] == 1


def main() -> None:
    test_exact_switching_peak_and_idempotency()
    test_missing_and_ref_type_fail_close_precheck()
    test_overflow_counts()
    test_status_and_retention()
    print('12A-15 Kick History category aggregate SQL fixtures passed: exact concurrent peaks/viewer-minutes, category switching, provider isolation, integer refs, missing metadata, 301/1001 overflow counts, idempotency, status and 180-day retention.')


if __name__ == '__main__':
    main()
