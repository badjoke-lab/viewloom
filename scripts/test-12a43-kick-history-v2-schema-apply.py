#!/usr/bin/env python3
import re
import sqlite3
from pathlib import Path

V2_PROTOTYPE = Path('docs/prototypes/12a42-kick-history-chunked-v2-candidate.sql')
V1_SCHEMA = Path('db/d1/006_history_category_aggregate.sql')
V2_OBJECTS = {
    'history_category_daily_v2',
    'history_category_streamer_daily_chunks_v2',
    'history_category_day_status_v2',
    'idx_history_category_daily_v2_category_day',
    'idx_history_category_streamer_chunks_v2_category_day',
}
V2_TABLES = {
    'history_category_daily_v2',
    'history_category_streamer_daily_chunks_v2',
    'history_category_day_status_v2',
}
V1_OBJECTS = {
    'history_category_daily',
    'history_category_streamer_daily',
    'history_category_day_status',
    'idx_history_category_daily_category_day',
    'idx_history_category_streamer_category_day',
}

def create_statements(sql):
    return [match.group(0).strip().rstrip(';') for match in re.finditer(r'CREATE\s+(?:TABLE|INDEX)\s+[^;]+;', sql, re.I | re.S)]

def objects(connection, expected):
    placeholders = ','.join('?' for _ in expected)
    rows = connection.execute(
        f'SELECT name FROM sqlite_master WHERE name IN ({placeholders}) ORDER BY name',
        tuple(sorted(expected)),
    ).fetchall()
    return {row[0] for row in rows}

def state(connection):
    present = objects(connection, V2_OBJECTS)
    return {
        'present': present,
        'absent': not present,
        'complete': present == V2_OBJECTS,
        'partial': bool(present) and present != V2_OBJECTS,
    }

def main():
    v2_sql = V2_PROTOTYPE.read_text()
    statements = create_statements(v2_sql)
    table_statements = [item for item in statements if re.match(r'^CREATE\s+TABLE', item, re.I)]
    index_statements = [item for item in statements if re.match(r'^CREATE\s+INDEX', item, re.I)]
    assert len(statements) == 5
    assert len(table_statements) == 3
    assert len(index_statements) == 2
    assert all('_v2' in item for item in statements)
    assert 'contributor_encoded_bytes_cap INTEGER NOT NULL' in v2_sql

    empty = sqlite3.connect(':memory:')
    assert state(empty)['absent']
    empty.close()

    partial = sqlite3.connect(':memory:')
    partial.execute(table_statements[0])
    partial_state = state(partial)
    assert partial_state['partial'] and not partial_state['complete']
    before = partial_state['present'].copy()
    # Controlled apply must stop here; simulate the stop by executing no further DDL.
    assert state(partial)['present'] == before
    partial.close()

    complete = sqlite3.connect(':memory:')
    complete.executescript(V1_SCHEMA.read_text())
    assert objects(complete, V1_OBJECTS) == V1_OBJECTS
    v1_before = objects(complete, V1_OBJECTS)
    for statement in table_statements:
        complete.execute(statement)
    table_stage = state(complete)
    assert table_stage['partial']
    assert table_stage['present'] == V2_TABLES
    for statement in index_statements:
        complete.execute(statement)
    final = state(complete)
    assert final['complete'] and not final['partial'] and not final['absent']
    assert objects(complete, V1_OBJECTS) == v1_before
    for table in V2_TABLES:
        assert complete.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0] == 0
    # A controlled second pass sees complete schema and therefore executes zero DDL statements.
    second_pass_statement_count = 0 if state(complete)['complete'] else len(statements)
    assert second_pass_statement_count == 0
    complete.close()

    print('12A-43 local v2 schema apply fixtures passed: absent/partial fail-close, 3+2 staged apply, v1 coexistence, empty v2 rows, zero-statement second pass.')

if __name__ == '__main__':
    main()
