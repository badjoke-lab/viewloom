#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import sqlite3
import statistics
import tempfile
import time
from pathlib import Path

CHUNK_SIZES = [32, 64, 128]
RETENTION_DAYS = 180
CATEGORY_ROWS_PER_DAY = 300
OBSERVED_FAILURE_MAX_PAIRS = 1108
SOURCE_THEORETICAL_PAIR_MAX = 100 * 288
START_DAY = dt.date(2026, 1, 1)
CONTRACT_VERSION = 'category-source-v2-chunked'
SCHEMA_PATH = Path('docs/prototypes/12a40-kick-history-chunked-contributors.sql')

BASELINE = {
    'acceptedKickProjectedMiB': 369.68,
    'providerCeilingMiB': 440.0,
    'providerHeadroomMinMiB': 10.0,
    'acceptedAccountHeadroomMiB': 879.59,
    'accountHeadroomMinMiB': 500.0,
    'designBudgetMiB': 60.0,
    'safetyMarginPct': 20,
    'snapshotItemCap': 100,
    'snapshotsPerDay': 288,
}


def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def build_pairs(day_index, pair_count, category_count, heavy_ratio=0.55):
    heavy = min(pair_count, max(1, int(round(pair_count * heavy_ratio))))
    pairs = []
    for j in range(heavy):
        streamer_id = f's{j:05d}'
        display_name = f'配信者{j}' if j % 97 == 0 else f'Streamer {j}'
        viewer_minutes = 1000 + (j * 13 + day_index * 17) % 100000
        peak_viewers = 10 + (j * 7 + day_index * 3) % 5000
        observed_minutes = 5 * ((j % 48) + 1)
        pairs.append(('cat-000', streamer_id, display_name, viewer_minutes, peak_viewers,
                      observed_minutes, observed_minutes // 5))

    remaining = pair_count - heavy
    for k in range(remaining):
        category_index = 1 + (k % (category_count - 1)) if category_count > 1 else 0
        j = (k * 7 + category_index * 11) % max(heavy, 1)
        streamer_id = f's{j:05d}'
        display_name = f'名"前\\テスト{j}' if k % 113 == 0 else f'Streamer {j}'
        viewer_minutes = 500 + (k * 19 + category_index * 23 + day_index * 11) % 80000
        peak_viewers = 5 + (k * 5 + category_index) % 4000
        observed_minutes = 5 * ((k % 36) + 1)
        pairs.append((f'cat-{category_index:03d}', streamer_id, display_name, viewer_minutes,
                      peak_viewers, observed_minutes, observed_minutes // 5))

    seen = set()
    normalized = []
    for index, row in enumerate(pairs):
        category_id, streamer_id, display_name, viewer_minutes, peak_viewers, observed_minutes, sample_count = row
        if (category_id, streamer_id) in seen:
            streamer_id = f'{streamer_id}x{index}'
            display_name = f'{display_name} x'
        seen.add((category_id, streamer_id))
        normalized.append((category_id, streamer_id, display_name, viewer_minutes,
                           peak_viewers, observed_minutes, sample_count))
    assert len(normalized) == pair_count
    assert len(seen) == pair_count
    return normalized


def grouped_pairs(day_index, pair_count, category_count):
    grouped = {}
    for category_id, streamer_id, display_name, viewer_minutes, peak_viewers, observed_minutes, sample_count in build_pairs(
        day_index, pair_count, category_count
    ):
        grouped.setdefault(category_id, []).append([
            streamer_id, display_name, viewer_minutes, peak_viewers, observed_minutes, sample_count
        ])
    for contributors in grouped.values():
        contributors.sort(key=lambda row: row[0])
    return grouped


def chunk_metrics(pair_count, category_count, chunk_size):
    grouped = grouped_pairs(0, pair_count, category_count)
    rows = 0
    encoded_bytes = 0
    maximum_chunk_bytes = 0
    recovered = 0
    for contributors in grouped.values():
        for offset in range(0, len(contributors), chunk_size):
            chunk = contributors[offset:offset + chunk_size]
            payload = canonical_json(chunk).encode('utf-8')
            rows += 1
            recovered += len(chunk)
            encoded_bytes += len(payload)
            maximum_chunk_bytes = max(maximum_chunk_bytes, len(payload))
    return {
        'logicalPairs': pair_count,
        'categories': len(grouped),
        'physicalChunkRows': rows,
        'recoveredLogicalPairs': recovered,
        'encodedBytes': encoded_bytes,
        'maximumEncodedChunkBytes': maximum_chunk_bytes,
        'noContributorLoss': recovered == pair_count,
    }


def empty_schema_size(schema):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / 'empty.sqlite'
        connection = sqlite3.connect(path)
        connection.executescript(schema)
        connection.execute('VACUUM')
        connection.close()
        return path.stat().st_size


def normalized_reference(pairs_by_day, category_id):
    connection = sqlite3.connect(':memory:')
    connection.execute('''
        CREATE TABLE reference_contributors (
          day TEXT NOT NULL,
          category_id TEXT NOT NULL,
          streamer_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          viewer_minutes INTEGER NOT NULL,
          peak_viewers INTEGER NOT NULL,
          observed_minutes INTEGER NOT NULL,
          sample_count INTEGER NOT NULL,
          PRIMARY KEY (day, category_id, streamer_id)
        )
    ''')
    rows = []
    for day, pairs in pairs_by_day:
        for category, streamer, name, viewer_minutes, peak_viewers, observed_minutes, sample_count in pairs:
            rows.append((day, category, streamer, name, viewer_minutes, peak_viewers,
                         observed_minutes, sample_count))
    connection.executemany('INSERT INTO reference_contributors VALUES (?, ?, ?, ?, ?, ?, ?, ?)', rows)
    result = connection.execute('''
        SELECT streamer_id, MAX(display_name), SUM(viewer_minutes), MAX(peak_viewers),
               SUM(observed_minutes), SUM(sample_count)
        FROM reference_contributors
        WHERE category_id = ?
        GROUP BY streamer_id
        ORDER BY SUM(viewer_minutes) DESC, MAX(peak_viewers) DESC, streamer_id
    ''', (category_id,)).fetchall()
    connection.close()
    return result


def expanded_query(connection, category_id, from_day, to_day):
    return connection.execute('''
        WITH expanded AS (
          SELECT c.day,
                 json_extract(j.value, '$[0]') AS streamer_id,
                 json_extract(j.value, '$[1]') AS display_name,
                 CAST(json_extract(j.value, '$[2]') AS INTEGER) AS viewer_minutes,
                 CAST(json_extract(j.value, '$[3]') AS INTEGER) AS peak_viewers,
                 CAST(json_extract(j.value, '$[4]') AS INTEGER) AS observed_minutes,
                 CAST(json_extract(j.value, '$[5]') AS INTEGER) AS sample_count
          FROM history_category_streamer_daily_chunks_v2 c,
               json_each(c.contributors_json) j
          WHERE c.provider = 'kick'
            AND c.category_id = ?
            AND c.day >= ? AND c.day <= ?
        )
        SELECT streamer_id, MAX(display_name), SUM(viewer_minutes), MAX(peak_viewers),
               SUM(observed_minutes), SUM(sample_count)
        FROM expanded
        GROUP BY streamer_id
        ORDER BY SUM(viewer_minutes) DESC, MAX(peak_viewers) DESC, streamer_id
    ''', (category_id, from_day, to_day)).fetchall()


def benchmark_chunk_size(schema, empty_bytes, chunk_size):
    with tempfile.TemporaryDirectory() as tmp:
        db_path = Path(tmp) / f'chunk-{chunk_size}.sqlite'
        connection = sqlite3.connect(db_path)
        connection.executescript(schema)
        connection.execute('BEGIN')

        category_rows = 0
        chunk_rows = 0
        total_encoded_bytes = 0
        max_chunk_bytes = 0

        for day_index in range(RETENTION_DAYS):
            day = (START_DAY + dt.timedelta(days=day_index)).isoformat()
            grouped = grouped_pairs(day_index, OBSERVED_FAILURE_MAX_PAIRS, CATEGORY_ROWS_PER_DAY)
            assert len(grouped) == CATEGORY_ROWS_PER_DAY
            day_chunk_rows = 0
            day_encoded_bytes = 0

            for category_id, contributors in sorted(grouped.items()):
                connection.execute(
                    'INSERT INTO history_category_daily_v2 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    ('kick', day, category_id, sum(x[2] for x in contributors),
                     max(x[3] for x in contributors), 288, 'authenticated', CONTRACT_VERSION,
                     f'{day}T00:20:00Z')
                )
                category_rows += 1
                for offset in range(0, len(contributors), chunk_size):
                    chunk = contributors[offset:offset + chunk_size]
                    payload = canonical_json(chunk)
                    encoded_bytes = len(payload.encode('utf-8'))
                    connection.execute(
                        'INSERT INTO history_category_streamer_daily_chunks_v2 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        ('kick', day, category_id, offset // chunk_size, len(chunk), payload,
                         encoded_bytes, CONTRACT_VERSION, f'{day}T00:20:00Z')
                    )
                    chunk_rows += 1
                    day_chunk_rows += 1
                    total_encoded_bytes += encoded_bytes
                    day_encoded_bytes += encoded_bytes
                    max_chunk_bytes = max(max_chunk_bytes, encoded_bytes)

            connection.execute(
                'INSERT INTO history_category_day_status_v2 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                ('kick', day, CATEGORY_ROWS_PER_DAY, OBSERVED_FAILURE_MAX_PAIRS,
                 day_chunk_rows, day_encoded_bytes, 300, 1000, 'observed', 'authenticated',
                 CONTRACT_VERSION, f'{day}T00:20:00Z')
            )

        connection.commit()
        connection.execute('VACUUM')
        connection.commit()
        candidate_bytes = db_path.stat().st_size
        incremental_bytes = candidate_bytes - empty_bytes
        incremental_mib = incremental_bytes / (1024 * 1024)
        incremental_with_safety = incremental_mib * 1.2

        period_start_index = 120
        period_end_index = 149
        from_day = (START_DAY + dt.timedelta(days=period_start_index)).isoformat()
        to_day = (START_DAY + dt.timedelta(days=period_end_index)).isoformat()
        reference_pairs = [
            ((START_DAY + dt.timedelta(days=index)).isoformat(),
             build_pairs(index, OBSERVED_FAILURE_MAX_PAIRS, CATEGORY_ROWS_PER_DAY))
            for index in range(period_start_index, period_end_index + 1)
        ]
        reference = normalized_reference(reference_pairs, 'cat-000')
        expanded = expanded_query(connection, 'cat-000', from_day, to_day)

        plans = [row[3] for row in connection.execute('''
            EXPLAIN QUERY PLAN
            SELECT day, contributors_json
            FROM history_category_streamer_daily_chunks_v2
            WHERE provider = ? AND category_id = ? AND day >= ? AND day <= ?
            ORDER BY day, chunk_index
        ''', ('kick', 'cat-000', from_day, to_day)).fetchall()]

        timings = []
        for _ in range(5):
            started = time.perf_counter()
            expanded_query(connection, 'cat-000', from_day, to_day)
            timings.append((time.perf_counter() - started) * 1000)

        expanded_rows = connection.execute('''
            SELECT COUNT(*)
            FROM history_category_streamer_daily_chunks_v2 c,
                 json_each(c.contributors_json) j
            WHERE c.provider = 'kick' AND c.category_id = ?
              AND c.day >= ? AND c.day <= ?
        ''', ('cat-000', from_day, to_day)).fetchone()[0]
        max_day_rows, max_day_bytes = connection.execute('''
            SELECT MAX(physical_contributor_chunk_rows), MAX(contributor_encoded_bytes)
            FROM history_category_day_status_v2
        ''').fetchone()
        connection.close()

    projected_kick = BASELINE['acceptedKickProjectedMiB'] + incremental_with_safety
    provider_headroom = BASELINE['providerCeilingMiB'] - projected_kick
    account_headroom = BASELINE['acceptedAccountHeadroomMiB'] - incremental_with_safety
    gates = {
        'exactResultEquivalence': reference == expanded,
        'noContributorLoss': expanded_rows == 609 * 30,
        'physicalRowsPerDayWithin1000': max_day_rows <= 1000,
        'storageBudgetWithin60MiB': incremental_with_safety <= 60,
        'providerProjectedSizeWithin440MiB': projected_kick <= 440,
        'providerHeadroomAtLeast10MiB': provider_headroom >= 10,
        'accountHeadroomAtLeast500MiB': account_headroom >= 500,
        'indexedProviderCategoryDayRange': any('idx_history_category_streamer_chunks_v2_category_day' in plan for plan in plans),
    }

    return {
        'chunkSize': chunk_size,
        'emptySchemaFileBytes': empty_bytes,
        'candidateFileBytes': candidate_bytes,
        'incrementalBytes': incremental_bytes,
        'incrementalMiB': round(incremental_mib, 2),
        'incrementalMiBWithSafety': round(incremental_with_safety, 2),
        'categoryRows180d': category_rows,
        'physicalChunkRows180d': chunk_rows,
        'maximumPhysicalChunkRowsPerDay': max_day_rows,
        'maximumEncodedChunkBytes': max_chunk_bytes,
        'maximumEncodedBytesPerDay': max_day_bytes,
        'totalEncodedBytes180d': total_encoded_bytes,
        'selectedCategoryExpandedRows30d': expanded_rows,
        'selectedCategoryPeriodResultRows': len(expanded),
        'queryPlan': plans,
        'queryWallMsMedianInformational': round(statistics.median(timings), 3),
        'projectedKickMiB': round(projected_kick, 2),
        'providerHeadroomMiB': round(provider_headroom, 2),
        'accountHeadroomMiB': round(account_headroom, 2),
        'gates': gates,
        'pass': all(gates.values()),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    schema = SCHEMA_PATH.read_text()
    empty_bytes = empty_schema_size(schema)
    measurements = [benchmark_chunk_size(schema, empty_bytes, size) for size in CHUNK_SIZES]

    logical_fixtures = {}
    for pair_count in [1000, 1066, 1108]:
        logical_fixtures[str(pair_count)] = {
            str(size): chunk_metrics(pair_count, CATEGORY_ROWS_PER_DAY, size)
            for size in CHUNK_SIZES
        }

    theoretical_stress = {
        str(size): chunk_metrics(SOURCE_THEORETICAL_PAIR_MAX, CATEGORY_ROWS_PER_DAY, size)
        for size in CHUNK_SIZES
    }
    for item in theoretical_stress.values():
        item['projectedEncodedPayloadMiB180d'] = round(
            item['encodedBytes'] * RETENTION_DAYS / (1024 * 1024), 2
        )

    passing = [m for m in measurements if m['pass']]
    winner = min(passing, key=lambda m: (m['incrementalMiBWithSafety'], m['maximumPhysicalChunkRowsPerDay'])) if passing else None
    requires_byte_fail_close = any(
        item['projectedEncodedPayloadMiB180d'] > BASELINE['designBudgetMiB']
        for item in theoretical_stress.values()
    )

    stable_signature_payload = {
        'measurements': [
            {k: v for k, v in m.items() if k != 'queryWallMsMedianInformational'}
            for m in measurements
        ],
        'logicalFixtures': logical_fixtures,
        'theoreticalStress': theoretical_stress,
        'winnerChunkSize': winner['chunkSize'] if winner else None,
    }
    signature = hashlib.sha256(canonical_json(stable_signature_payload).encode()).hexdigest()

    evidence = {
        'schemaVersion': 'viewloom-12a40-kick-history-chunked-contributor-benchmark-v1',
        'phase': '12A-40',
        'issue': 922,
        'provider': 'kick',
        'status': 'PASS' if winner else 'NO_GO',
        'engine': {'name': 'sqlite3', 'version': sqlite3.sqlite_version, 'pageSizeBytes': 4096},
        'prototypeSchema': str(SCHEMA_PATH),
        'retentionDays': RETENTION_DAYS,
        'storageFixture': {
            'categoryRowsPerDay': CATEGORY_ROWS_PER_DAY,
            'logicalStreamerCategoryContributorsPerDay': OBSERVED_FAILURE_MAX_PAIRS,
            'basis': 'Observed 1108-pair failure cardinality combined conservatively with the accepted 300-category/day boundary.'
        },
        'acceptedBaseline': BASELINE,
        'logicalFixtures': logical_fixtures,
        'measurements': measurements,
        'winner': {
            'chunkSize': winner['chunkSize'] if winner else None,
            'selectionRule': 'Smallest 20%-safety-adjusted 180-day incremental storage among candidates passing every hard gate; physical rows/day is tie-breaker.',
            'productionAuthorized': False,
        },
        'theoreticalSourceMaximumStress': {
            'logicalPairsPerDay': SOURCE_THEORETICAL_PAIR_MAX,
            'derivation': 'accepted snapshotItemCap 100 * snapshotsPerDay 288',
            'measurements': theoretical_stress,
            'requiresEncodedByteFailCloseBeforeProduction': requires_byte_fail_close,
            'reason': 'Chunking bounds physical rows but does not erase logical payload bytes. A separate encoded-byte/day fail-closed boundary is required before any production schema/runtime proposal.'
        },
        'semantics': {
            'lossless': True,
            'topK': False,
            'sampling': False,
            'categoryFilterBeforePeriodRanking': True,
            'canonicalContributorOrdering': 'streamer_id_ascending_before_chunking',
            'allSelectedChunksExpandedBeforeRanking': True,
        },
        'nextGate': 'repository_only_chunked_schema_query_candidate_decision_with_encoded_byte_fail_close',
        'authorizations': {
            'productionSchemaChange': False,
            'productionD1Read': False,
            'productionD1Mutation': False,
            'productionGeneratorChange': False,
            'productionDeployment': False,
            'backfill': False,
            'historyCategoryApiUiCutover': False,
            'twitchRollout': False,
            'thresholdRelaxation': False,
        },
        'stableBenchmarkSignatureSha256': signature,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({
        'status': evidence['status'],
        'winnerChunkSize': evidence['winner']['chunkSize'],
        'winnerStorageMiBWithSafety': winner['incrementalMiBWithSafety'] if winner else None,
        'requiresEncodedByteFailCloseBeforeProduction': requires_byte_fail_close,
        'stableBenchmarkSignatureSha256': signature,
    }, indent=2))
    if not winner:
        raise SystemExit(42)


if __name__ == '__main__':
    main()
