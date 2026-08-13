#!/usr/bin/env python3

import re
import sqlite3
from pathlib import Path

MIGRATION = Path('db/d1/006_history_category_aggregate.sql').read_text()
EXPECTED_TABLES = {
    'history_category_daily',
    'history_category_streamer_daily',
    'history_category_day_status',
}
EXPECTED_INDEXES = {
    'idx_history_category_daily_category_day',
    'idx_history_category_streamer_category_day',
}
EXPECTED_OBJECTS = EXPECTED_TABLES | EXPECTED_INDEXES


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
        for table in sorted(EXPECTED_TABLES)
    )


def migration_statements():
    cleaned = re.sub(r'--[^\n]*', '', MIGRATION)
    return [statement.strip() for statement in cleaned.split(';') if statement.strip()]


def main():
    statements = migration_statements()
    assert len(statements) == 5
    table_statements = [statement for statement in statements if statement.startswith('CREATE TABLE')]
    index_statements = [statement for statement in statements if statement.startswith('CREATE INDEX')]
    assert len(table_statements) == 3
    assert len(index_statements) == 2

    # Model the repaired production order: independent tables first, verify,
    # then indexes whose target tables are now observable.
    conn = sqlite3.connect(':memory:')
    assert objects(conn) == set()
    for statement in table_statements:
        conn.execute(statement)
    assert objects(conn) == EXPECTED_TABLES
    assert aggregate_rows(conn) == 0

    for statement in index_statements:
        conn.execute(statement)
    assert objects(conn) == EXPECTED_OBJECTS
    assert aggregate_rows(conn) == 0

    before = conn.execute(
        "SELECT group_concat(type || ':' || name, '|') FROM sqlite_master WHERE name IN (%s)"
        % ','.join('?' for _ in EXPECTED_OBJECTS),
        tuple(EXPECTED_OBJECTS),
    ).fetchone()[0]
    conn.executescript(MIGRATION)
    after = conn.execute(
        "SELECT group_concat(type || ':' || name, '|') FROM sqlite_master WHERE name IN (%s)"
        % ','.join('?' for _ in EXPECTED_OBJECTS),
        tuple(EXPECTED_OBJECTS),
    ).fetchone()[0]
    assert before == after
    assert aggregate_rows(conn) == 0
    conn.close()

    partial = sqlite3.connect(':memory:')
    partial.execute('CREATE TABLE history_category_daily (provider TEXT, day TEXT, category_id TEXT)')
    present = objects(partial)
    assert present == {'history_category_daily'}
    assert present != EXPECTED_OBJECTS
    partial.close()

    print('12A-14 staged fixtures passed: 3 table statements become observable before 2 dependent indexes; final 5-object schema is idempotent; rows remain zero; partial state stays detectable.')


if __name__ == '__main__':
    main()
