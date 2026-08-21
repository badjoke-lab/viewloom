#!/usr/bin/env python3
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_TS = (ROOT / 'workers/dormant/history-category-v2-generator-sql.ts').read_text()
CANDIDATE_TS = (ROOT / 'workers/dormant/history-category-chunked-v2-candidate.ts').read_text()
SCHEMA_SQL = (ROOT / 'docs/prototypes/12a42-kick-history-chunked-v2-candidate.sql').read_text()


def extract(source: str, name: str) -> str:
    match = re.search(rf"export const {re.escape(name)} = `\n(.*?)\n`", source, re.S)
    if not match:
        raise AssertionError(f'missing SQL template: {name}')
    return match.group(1).replace("${CATEGORY_CONTRACT_VERSION}", "category-source-v1")


CATEGORY_SELECT = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_CATEGORY_ROWS_SELECT_SQL')
CONTRIBUTOR_SELECT = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_CONTRIBUTOR_ROWS_SELECT_SQL')
DELETE_CATEGORY = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_DELETE_CATEGORY_DAY_SQL')
DELETE_CHUNKS = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_DELETE_CHUNK_DAY_SQL')
INSERT_CATEGORY = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_INSERT_CATEGORY_JSON_SQL')
INSERT_CHUNKS = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_INSERT_CHUNK_JSON_SQL')
STATUS_UPSERT = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_STATUS_UPSERT_SQL')
RETENTION_CATEGORY = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CATEGORY_SQL')
RETENTION_CHUNKS = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CHUNK_SQL')
RETENTION_STATUS = extract(SQL_TS, 'KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_STATUS_SQL')
PERIOD_RANKING = extract(CANDIDATE_TS, 'KICK_HISTORY_CATEGORY_V2_PERIOD_RANKING_SQL')


def payload(items, category_ids, refs):
    return json.dumps({
        'items': items,
        'categoryContractVersion': 'category-source-v1',
        'categoryIds': category_ids,
        'categoryRefs': refs,
    }, ensure_ascii=False, separators=(',', ':'))


def chunk_rows(contributors, chunk_size=128):
    groups = {}
    for row in contributors:
        groups.setdefault(row['categoryId'], []).append(row)
    out = []
    for category_id in sorted(groups):
        rows = sorted(groups[category_id], key=lambda row: row['streamerId'])
        for offset in range(0, len(rows), chunk_size):
            tuples = [[
                row['streamerId'], row['displayName'], row['viewerMinutes'],
                row['peakViewers'], row['observedMinutes'], row['sampleCount'],
            ] for row in rows[offset:offset + chunk_size]]
            encoded = json.dumps(tuples, ensure_ascii=False, separators=(',', ':'))
            out.append({
                'categoryId': category_id,
                'chunkIndex': offset // chunk_size,
                'contributorCount': len(tuples),
                'contributorsJson': encoded,
                'encodedBytes': len(encoded.encode('utf-8')),
            })
    return out


def main():
    db = sqlite3.connect(':memory:')
    db.row_factory = sqlite3.Row
    db.executescript('''
      CREATE TABLE minute_snapshots (
        provider TEXT NOT NULL,
        bucket_minute TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        source_mode TEXT NOT NULL
      );
      CREATE TABLE history_category_daily (
        provider TEXT, day TEXT, category_id TEXT, marker TEXT,
        PRIMARY KEY(provider, day, category_id)
      );
      CREATE TABLE history_category_streamer_daily (
        provider TEXT, day TEXT, category_id TEXT, streamer_id TEXT, marker TEXT,
        PRIMARY KEY(provider, day, category_id, streamer_id)
      );
      CREATE TABLE history_category_day_status (
        provider TEXT, day TEXT, marker TEXT,
        PRIMARY KEY(provider, day)
      );
    ''')
    db.executescript(SCHEMA_SQL)

    db.execute("INSERT INTO history_category_daily VALUES ('kick','2026-08-20','v1','sentinel')")
    db.execute("INSERT INTO history_category_streamer_daily VALUES ('kick','2026-08-20','v1','v1','sentinel')")
    db.execute("INSERT INTO history_category_day_status VALUES ('kick','2026-08-20','sentinel')")

    category_ids = ['cat-a', 'cat-b']
    db.execute(
        'INSERT INTO minute_snapshots VALUES (?,?,?,?)',
        ('kick', '2026-08-20T00:00:00.000Z', payload([
            {'channelLogin': 'alpha', 'displayName': 'Álpha 雪', 'viewers': 10},
            {'channelLogin': 'beta', 'displayName': 'Beta', 'viewers': 5},
        ], category_ids, [0, 1]), 'official'),
    )
    db.execute(
        'INSERT INTO minute_snapshots VALUES (?,?,?,?)',
        ('kick', '2026-08-20T00:05:00.000Z', payload([
            {'channelLogin': 'alpha', 'displayName': 'Álpha 雪', 'viewers': 20},
            {'channelLogin': 'gamma', 'displayName': 'Gamma', 'viewers': 7},
        ], category_ids, [0, 0]), 'official'),
    )
    db.execute(
        'INSERT INTO minute_snapshots VALUES (?,?,?,?)',
        ('twitch', '2026-08-20T00:00:00.000Z', payload([
            {'channelLogin': 'other', 'displayName': 'Other', 'viewers': 999},
        ], ['cat-a'], [0]), 'fixture'),
    )

    categories = [dict(row) for row in db.execute(CATEGORY_SELECT, ('kick', '2026-08-20', 5))]
    contributors = [dict(row) for row in db.execute(CONTRIBUTOR_SELECT, ('kick', '2026-08-20', 5, 5))]
    assert categories == [
        {'category_id': 'cat-a', 'total_viewer_minutes': 185, 'peak_viewers': 27, 'observed_snapshots': 2},
        {'category_id': 'cat-b', 'total_viewer_minutes': 25, 'peak_viewers': 5, 'observed_snapshots': 1},
    ], categories
    assert contributors == [
        {'category_id': 'cat-a', 'streamer_id': 'alpha', 'display_name': 'Álpha 雪', 'viewer_minutes': 150, 'peak_viewers': 20, 'observed_minutes': 10, 'sample_count': 2},
        {'category_id': 'cat-a', 'streamer_id': 'gamma', 'display_name': 'Gamma', 'viewer_minutes': 35, 'peak_viewers': 7, 'observed_minutes': 5, 'sample_count': 1},
        {'category_id': 'cat-b', 'streamer_id': 'beta', 'display_name': 'Beta', 'viewer_minutes': 25, 'peak_viewers': 5, 'observed_minutes': 5, 'sample_count': 1},
    ], contributors

    category_json = [{
        'categoryId': row['category_id'],
        'totalViewerMinutes': row['total_viewer_minutes'],
        'peakViewers': row['peak_viewers'],
        'observedSnapshots': row['observed_snapshots'],
    } for row in categories]
    contributor_objects = [{
        'categoryId': row['category_id'],
        'streamerId': row['streamer_id'],
        'displayName': row['display_name'],
        'viewerMinutes': row['viewer_minutes'],
        'peakViewers': row['peak_viewers'],
        'observedMinutes': row['observed_minutes'],
        'sampleCount': row['sample_count'],
    } for row in contributors]
    chunks = chunk_rows(contributor_objects)
    encoded_bytes = sum(row['encodedBytes'] for row in chunks)
    updated_at = '2026-08-21T00:00:00.000Z'

    def persist():
        db.execute(DELETE_CATEGORY, ('kick', '2026-08-20'))
        db.execute(DELETE_CHUNKS, ('kick', '2026-08-20'))
        db.execute(INSERT_CATEGORY, (
            'kick', '2026-08-20', 'official', 'category-source-v2-chunked', updated_at,
            json.dumps(category_json, ensure_ascii=False, separators=(',', ':')),
        ))
        db.execute(INSERT_CHUNKS, (
            'kick', '2026-08-20', 'category-source-v2-chunked', updated_at,
            json.dumps(chunks, ensure_ascii=False, separators=(',', ':')),
        ))
        db.execute(STATUS_UPSERT, (
            'kick', '2026-08-20', len(category_json), len(contributor_objects), len(chunks), encoded_bytes,
            300, 1000, 47196, 2, 4, 0, 'partial', 'official', 'category-source-v2-chunked', updated_at,
        ))
        db.commit()

    persist()
    first_counts = (
        db.execute("SELECT COUNT(*) FROM history_category_daily_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM history_category_streamer_daily_chunks_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM history_category_day_status_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
    )
    assert first_counts == (2, 2, 1), first_counts

    ranked_a = [dict(row) for row in db.execute(PERIOD_RANKING, ('kick', 'cat-a', '2026-08-20', '2026-08-20'))]
    assert ranked_a == [
        {'streamer_id': 'alpha', 'display_name': 'Álpha 雪', 'viewer_minutes': 150, 'peak_viewers': 20, 'observed_minutes': 10, 'sample_count': 2},
        {'streamer_id': 'gamma', 'display_name': 'Gamma', 'viewer_minutes': 35, 'peak_viewers': 7, 'observed_minutes': 5, 'sample_count': 1},
    ], ranked_a

    # Same-day replacement is idempotent: no duplicate rows and ranking is unchanged.
    persist()
    second_counts = (
        db.execute("SELECT COUNT(*) FROM history_category_daily_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM history_category_streamer_daily_chunks_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM history_category_day_status_v2 WHERE provider='kick' AND day='2026-08-20'").fetchone()[0],
    )
    assert second_counts == first_counts
    assert [dict(row) for row in db.execute(PERIOD_RANKING, ('kick', 'cat-a', '2026-08-20', '2026-08-20'))] == ranked_a

    # V1 sentinel rows are untouched by all v2 operations.
    assert db.execute("SELECT marker FROM history_category_daily WHERE category_id='v1'").fetchone()[0] == 'sentinel'
    assert db.execute("SELECT marker FROM history_category_streamer_daily WHERE category_id='v1'").fetchone()[0] == 'sentinel'
    assert db.execute("SELECT marker FROM history_category_day_status WHERE day='2026-08-20'").fetchone()[0] == 'sentinel'

    # Provider separation: Twitch raw fixture never enters Kick v2 materialization.
    assert db.execute("SELECT COUNT(*) FROM history_category_daily_v2 WHERE provider!='kick'").fetchone()[0] == 0

    # Retention SQL touches v2 only and removes an old v2 sentinel.
    db.execute("INSERT INTO history_category_daily_v2 VALUES ('kick','2020-01-01','old',1,1,1,'fixture','category-source-v2-chunked',?)", (updated_at,))
    db.execute("INSERT INTO history_category_streamer_daily_chunks_v2 VALUES ('kick','2020-01-01','old',0,1,'[]',2,'category-source-v2-chunked',?)", (updated_at,))
    db.execute("INSERT INTO history_category_day_status_v2 VALUES ('kick','2020-01-01',1,1,1,2,300,1000,47196,1,1,0,'observed','fixture','category-source-v2-chunked',?)", (updated_at,))
    db.execute(RETENTION_CATEGORY, ('kick', '-180 days'))
    db.execute(RETENTION_CHUNKS, ('kick', '-180 days'))
    db.execute(RETENTION_STATUS, ('kick', '-180 days'))
    assert db.execute("SELECT COUNT(*) FROM history_category_daily_v2 WHERE day='2020-01-01'").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM history_category_streamer_daily_chunks_v2 WHERE day='2020-01-01'").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM history_category_day_status_v2 WHERE day='2020-01-01'").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM history_category_daily WHERE category_id='v1'").fetchone()[0] == 1

    print(json.dumps({
        'status': 'PASS',
        'categoryRows': len(category_json),
        'logicalContributors': len(contributor_objects),
        'physicalChunks': len(chunks),
        'encodedBytes': encoded_bytes,
        'periodRankingRows': len(ranked_a),
        'idempotentCounts': list(second_counts),
        'v1Untouched': True,
        'providerSeparated': True,
        'retentionV2Only': True,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
