#!/usr/bin/env python3

import sqlite3
from pathlib import Path

MIGRATION = Path('db/d1/006_history_category_aggregate.sql').read_text()
EXPECTED_OBJECTS = {
    'history_category_daily',
    'idx_history_category_daily_category_day',
    'history_category_streamer_daily',
    'idx_history_category_streamer_category_day',
    'history_category_day_status',
}


def objects(conn):
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE name IN (%s) ORDER BY name"
        % ','.join('?' for _ in EXPECTED_OBJECTS),
        tuple(EXPECTED_OBJECTS),
    ).fetchall()
    return {row[0] for row in rows}


def aggregate_rows(conn):
    return sum(
        conn.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
        for table in [
            'history_category_daily',
            'history_category_streamer_daily',
            'history_category_day_status',
        ]
    )


def main():
    conn = sqlite3.connect(':memory:')
    assert objects(conn) == set()
    conn.executescript(MIGRATION)
    assert objects(conn) == EXPECTED_OBJECTS
    assert aggregate_rows(conn) == 0

    before = conn.execute("SELECT group_concat(type || ':' || name, '|') FROM sqlite_master WHERE name IN (%s)" % ','.join('?' for _ in EXPECTED_OBJECTS), tuple(EXPECTED_OBJECTS)).fetchone()[0]
    conn.executescript(MIGRATION)
    after = conn.execute("SELECT group_concat(type || ':' || name, '|') FROM sqlite_master WHERE name IN (%s)" % ','.join('?' for _ in EXPECTED_OBJECTS), tuple(EXPECTED_OBJECTS)).fetchone()[0]
    assert before == after
    assert aggregate_rows(conn) == 0
    conn.close()

    partial = sqlite3.connect(':memory:')
    partial.execute('CREATE TABLE history_category_daily (provider TEXT, day TEXT, category_id TEXT)')
    present = objects(partial)
    assert present == {'history_category_daily'}
    assert present != EXPECTED_OBJECTS
    # The runtime contract must classify this as partial and stop before any DDL.
    partial.close()

    print('12A-14 local schema fixtures passed: absent -> exact 5-object schema -> second-pass idempotent; aggregate rows remain zero; partial fixture is detectable before apply.')


if __name__ == '__main__':
    main()
