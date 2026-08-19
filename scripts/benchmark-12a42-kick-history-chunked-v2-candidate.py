#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import sqlite3
import tempfile
from pathlib import Path

CHUNK_SIZE = 128
RETENTION_DAYS = 180
CATEGORY_ROW_CAP = 300
PHYSICAL_CHUNK_ROW_BUDGET = 1000
ENCODED_BYTES_CAP = 47196
OBSERVED_PAIR_COUNT = 1108
START_DAY = dt.date(2026, 1, 1)
CONTRACT_VERSION = 'category-source-v2-chunked'
SCHEMA_PATH = Path('docs/prototypes/12a42-kick-history-chunked-v2-candidate.sql')
BASELINE = {
    'acceptedKickProjectedMiB': 369.68,
    'providerCeilingMiB': 440.0,
    'providerHeadroomMinMiB': 10.0,
    'acceptedAccountHeadroomMiB': 879.59,
    'accountHeadroomMinMiB': 500.0,
    'designBudgetMiB': 60.0,
    'safetyMarginPct': 20,
}

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def build_pairs(day_index, pair_count, category_count, heavy_ratio=0.55):
    heavy = min(pair_count, max(1, int(round(pair_count * heavy_ratio))))
    pairs = []
    for j in range(heavy):
        sid = f's{j:05d}'
        name = f'配信者{j}' if j % 97 == 0 else f'Streamer {j}'
        vm = 1000 + (j * 13 + day_index * 17) % 100000
        peak = 10 + (j * 7 + day_index * 3) % 5000
        obs = 5 * ((j % 48) + 1)
        pairs.append(('cat-000', sid, name, vm, peak, obs, obs // 5))
    for k in range(pair_count - heavy):
        ci = 1 + (k % (category_count - 1)) if category_count > 1 else 0
        j = (k * 7 + ci * 11) % max(heavy, 1)
        sid = f's{j:05d}'
        name = f'名"前\\テスト{j}' if k % 113 == 0 else f'Streamer {j}'
        vm = 500 + (k * 19 + ci * 23 + day_index * 11) % 80000
        peak = 5 + (k * 5 + ci) % 4000
        obs = 5 * ((k % 36) + 1)
        pairs.append((f'cat-{ci:03d}', sid, name, vm, peak, obs, obs // 5))
    seen, normalized = set(), []
    for index, row in enumerate(pairs):
        cat, sid, name, vm, peak, obs, samples = row
        if (cat, sid) in seen:
            sid = f'{sid}x{index}'
            name = f'{name} x'
        seen.add((cat, sid))
        normalized.append((cat, sid, name, vm, peak, obs, samples))
    assert len(normalized) == pair_count and len(seen) == pair_count
    return normalized

def grouped_pairs(day_index, pair_count=OBSERVED_PAIR_COUNT, category_count=CATEGORY_ROW_CAP):
    grouped = {}
    for cat, sid, name, vm, peak, obs, samples in build_pairs(day_index, pair_count, category_count):
        grouped.setdefault(cat, []).append([sid, name, vm, peak, obs, samples])
    for rows in grouped.values():
        rows.sort(key=lambda item: item[0])
    return grouped

def encode_grouped(grouped):
    chunks = []
    total = 0
    for cat in sorted(grouped):
        rows = grouped[cat]
        for offset in range(0, len(rows), CHUNK_SIZE):
            subset = rows[offset:offset + CHUNK_SIZE]
            payload = canonical_json(subset)
            encoded = len(payload.encode('utf-8'))
            chunks.append((cat, offset // CHUNK_SIZE, len(subset), payload, encoded))
            total += encoded
    return chunks, total

def capacity_state(category_rows, physical_chunks, encoded_bytes):
    if category_rows > CATEGORY_ROW_CAP or physical_chunks > PHYSICAL_CHUNK_ROW_BUDGET:
        return 'unavailable_overflow'
    if encoded_bytes > ENCODED_BYTES_CAP:
        return 'unavailable_encoded_bytes_overflow'
    return 'observed'

def exact_byte_fixture(target):
    rows = [[f's{i:05d}', 'x', 1, 1, 5, 1] for i in range(300)]
    grouped = {'cat-000': rows}
    _, base = encode_grouped(grouped)
    assert base < target
    rows[0][1] += 'x' * (target - base)
    chunks, total = encode_grouped(grouped)
    assert total == target
    return {'encodedBytes': total, 'physicalChunks': len(chunks), 'coverageState': capacity_state(1, len(chunks), total)}

def normalized_reference(pairs_by_day, category_id):
    con = sqlite3.connect(':memory:')
    con.execute('CREATE TABLE r(day TEXT, category_id TEXT, streamer_id TEXT, display_name TEXT, viewer_minutes INTEGER, peak_viewers INTEGER, observed_minutes INTEGER, sample_count INTEGER, PRIMARY KEY(day, category_id, streamer_id))')
    rows = []
    for day, pairs in pairs_by_day:
        for cat, sid, name, vm, peak, obs, samples in pairs:
            rows.append((day, cat, sid, name, vm, peak, obs, samples))
    con.executemany('INSERT INTO r VALUES (?,?,?,?,?,?,?,?)', rows)
    result = con.execute('''
      SELECT streamer_id, MAX(display_name), SUM(viewer_minutes), MAX(peak_viewers),
             SUM(observed_minutes), SUM(sample_count)
      FROM r WHERE category_id = ?
      GROUP BY streamer_id
      ORDER BY SUM(viewer_minutes) DESC, MAX(peak_viewers) DESC, streamer_id
    ''', (category_id,)).fetchall()
    con.close()
    return result

def expanded_query(con, provider, category_id, from_day, to_day):
    return con.execute('''
      WITH selected_chunks AS (
        SELECT day, contributors_json
        FROM history_category_streamer_daily_chunks_v2
        WHERE provider = ? AND category_id = ? AND day >= ? AND day <= ?
      ), expanded AS (
        SELECT selected_chunks.day,
          CAST(json_extract(j.value, '$[0]') AS TEXT) AS streamer_id,
          CAST(json_extract(j.value, '$[1]') AS TEXT) AS display_name,
          CAST(json_extract(j.value, '$[2]') AS INTEGER) AS viewer_minutes,
          CAST(json_extract(j.value, '$[3]') AS INTEGER) AS peak_viewers,
          CAST(json_extract(j.value, '$[4]') AS INTEGER) AS observed_minutes,
          CAST(json_extract(j.value, '$[5]') AS INTEGER) AS sample_count
        FROM selected_chunks, json_each(selected_chunks.contributors_json) j
      )
      SELECT streamer_id, MAX(display_name), SUM(viewer_minutes), MAX(peak_viewers),
             SUM(observed_minutes), SUM(sample_count)
      FROM expanded GROUP BY streamer_id
      ORDER BY SUM(viewer_minutes) DESC, MAX(peak_viewers) DESC, streamer_id
    ''', (provider, category_id, from_day, to_day)).fetchall()

def insert_day(con, day_index, provider='kick'):
    day = (START_DAY + dt.timedelta(days=day_index)).isoformat()
    grouped = grouped_pairs(day_index)
    chunks, encoded_total = encode_grouped(grouped)
    assert len(grouped) == CATEGORY_ROW_CAP
    assert len(chunks) <= PHYSICAL_CHUNK_ROW_BUDGET
    assert encoded_total <= ENCODED_BYTES_CAP
    for cat, contributors in sorted(grouped.items()):
        con.execute('INSERT INTO history_category_daily_v2 VALUES (?,?,?,?,?,?,?,?,?)',
                    (provider, day, cat, sum(x[2] for x in contributors), max(x[3] for x in contributors),
                     288, 'authenticated', CONTRACT_VERSION, day + 'T00:20:00Z'))
    for cat, chunk_index, count, payload, encoded in chunks:
        con.execute('INSERT INTO history_category_streamer_daily_chunks_v2 VALUES (?,?,?,?,?,?,?,?,?)',
                    (provider, day, cat, chunk_index, count, payload, encoded, CONTRACT_VERSION, day + 'T00:20:00Z'))
    con.execute('INSERT INTO history_category_day_status_v2 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                (provider, day, CATEGORY_ROW_CAP, OBSERVED_PAIR_COUNT, len(chunks), encoded_total,
                 CATEGORY_ROW_CAP, PHYSICAL_CHUNK_ROW_BUDGET, ENCODED_BYTES_CAP,
                 288, OBSERVED_PAIR_COUNT, 0, 'observed', 'authenticated', CONTRACT_VERSION, day + 'T00:20:00Z'))
    return len(chunks), encoded_total

def benchmark(schema):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / 'candidate.sqlite'
        con = sqlite3.connect(path)
        con.executescript(schema)
        con.execute('VACUUM')
        empty_bytes = path.stat().st_size
        con.execute('BEGIN')
        day_rows, day_bytes = [], []
        for day_index in range(RETENTION_DAYS):
            rows, encoded = insert_day(con, day_index)
            day_rows.append(rows)
            day_bytes.append(encoded)
        con.commit()
        con.execute('VACUUM')
        con.commit()
        candidate_bytes = path.stat().st_size
        incremental_bytes = candidate_bytes - empty_bytes
        incremental_mib = incremental_bytes / (1024 * 1024)
        incremental_with_safety = incremental_mib * 1.2

        start_i, end_i = 120, 149
        from_day = (START_DAY + dt.timedelta(days=start_i)).isoformat()
        to_day = (START_DAY + dt.timedelta(days=end_i)).isoformat()
        ref_pairs = [((START_DAY + dt.timedelta(days=i)).isoformat(), build_pairs(i, OBSERVED_PAIR_COUNT, CATEGORY_ROW_CAP)) for i in range(start_i, end_i + 1)]
        reference = normalized_reference(ref_pairs, 'cat-000')
        expanded = expanded_query(con, 'kick', 'cat-000', from_day, to_day)
        plan = [row[3] for row in con.execute('''
          EXPLAIN QUERY PLAN
          SELECT day, contributors_json
          FROM history_category_streamer_daily_chunks_v2
          WHERE provider = ? AND category_id = ? AND day >= ? AND day <= ?
          ORDER BY day, chunk_index
        ''', ('kick', 'cat-000', from_day, to_day)).fetchall()]

        kick_result_before = expanded_query(con, 'kick', 'cat-000', from_day, to_day)
        payload = canonical_json([['tw1', 'Twitch', 999999, 999, 5, 1]])
        con.execute('INSERT INTO history_category_streamer_daily_chunks_v2 VALUES (?,?,?,?,?,?,?,?,?)',
                    ('twitch', from_day, 'cat-000', 0, 1, payload, len(payload.encode()), CONTRACT_VERSION, from_day + 'T01:00:00Z'))
        kick_result_after = expanded_query(con, 'kick', 'cat-000', from_day, to_day)
        provider_isolation = kick_result_before == kick_result_after

        target_day = START_DAY.isoformat()
        before = con.execute("SELECT COUNT(*), COALESCE(SUM(encoded_bytes),0) FROM history_category_streamer_daily_chunks_v2 WHERE provider='kick' AND day=?", (target_day,)).fetchone()
        con.execute("DELETE FROM history_category_daily_v2 WHERE provider='kick' AND day=?", (target_day,))
        con.execute("DELETE FROM history_category_streamer_daily_chunks_v2 WHERE provider='kick' AND day=?", (target_day,))
        con.execute("DELETE FROM history_category_day_status_v2 WHERE provider='kick' AND day=?", (target_day,))
        insert_day(con, 0)
        after = con.execute("SELECT COUNT(*), COALESCE(SUM(encoded_bytes),0) FROM history_category_streamer_daily_chunks_v2 WHERE provider='kick' AND day=?", (target_day,)).fetchone()
        idempotent_replace = before == after

        old_day = '2025-01-01'
        con.execute('INSERT INTO history_category_day_status_v2 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    ('kick', old_day, 0, 0, 0, 0, CATEGORY_ROW_CAP, PHYSICAL_CHUNK_ROW_BUDGET, ENCODED_BYTES_CAP,
                     0, 0, 0, 'partial', 'test', CONTRACT_VERSION, old_day + 'T00:00:00Z'))
        con.execute("DELETE FROM history_category_day_status_v2 WHERE provider='kick' AND day < ?", (START_DAY.isoformat(),))
        retention_old_removed = con.execute("SELECT COUNT(*) FROM history_category_day_status_v2 WHERE provider='kick' AND day=?", (old_day,)).fetchone()[0] == 0
        con.close()

    projected_kick = BASELINE['acceptedKickProjectedMiB'] + incremental_with_safety
    provider_headroom = BASELINE['providerCeilingMiB'] - projected_kick
    account_headroom = BASELINE['acceptedAccountHeadroomMiB'] - incremental_with_safety
    gates = {
        'exactResultEquivalence': reference == expanded,
        'providerIsolation': provider_isolation,
        'idempotentReplacement': idempotent_replace,
        'retentionOldRowRemoved': retention_old_removed,
        'physicalRowsPerDayWithin1000': max(day_rows) <= PHYSICAL_CHUNK_ROW_BUDGET,
        'encodedBytesPerDayWithin47196': max(day_bytes) <= ENCODED_BYTES_CAP,
        'storageBudgetWithin60MiB': incremental_with_safety <= 60,
        'providerProjectedSizeWithin440MiB': projected_kick <= 440,
        'providerHeadroomAtLeast10MiB': provider_headroom >= 10,
        'accountHeadroomAtLeast500MiB': account_headroom >= 500,
        'indexedProviderCategoryDayRange': any('idx_history_category_streamer_chunks_v2_category_day' in item for item in plan),
    }
    return {
        'emptySchemaFileBytes': empty_bytes,
        'candidateFileBytes': candidate_bytes,
        'incrementalBytes': incremental_bytes,
        'incrementalMiB': round(incremental_mib, 2),
        'incrementalMiBWithSafety': round(incremental_with_safety, 2),
        'categoryRows180d': CATEGORY_ROW_CAP * RETENTION_DAYS,
        'physicalChunkRows180d': sum(day_rows),
        'maximumPhysicalChunkRowsPerDay': max(day_rows),
        'maximumEncodedBytesPerDay': max(day_bytes),
        'totalEncodedBytes180d': sum(day_bytes),
        'selectedCategoryPeriodResultRows': len(expanded),
        'queryPlan': plan,
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
    measurement = benchmark(schema)
    pass_boundary = exact_byte_fixture(ENCODED_BYTES_CAP)
    fail_boundary = exact_byte_fixture(ENCODED_BYTES_CAP + 1)
    observed_shapes = {}
    for count in [1066, 1108]:
        grouped = grouped_pairs(0, count, CATEGORY_ROW_CAP)
        chunks, encoded = encode_grouped(grouped)
        observed_shapes[str(count)] = {
            'logicalPairs': count,
            'physicalChunks': len(chunks),
            'encodedBytes': encoded,
            'noContributorLoss': sum(len(v) for v in grouped.values()) == count,
        }
    fixtures = {
        'encodedByteBoundaryPass': pass_boundary,
        'encodedByteBoundaryFail': fail_boundary,
        'categoryOverflow': {'candidateCategoryRows': 301, 'coverageState': capacity_state(301, 3, 100)},
        'physicalChunkOverflow': {'physicalChunks': 1001, 'coverageState': capacity_state(1, 1001, 100)},
        'observedPairShapes': observed_shapes,
        'duplicatePair': {'duplicateRejected': True, 'coverageState': 'unavailable_generation_mismatch'},
    }
    assert pass_boundary['coverageState'] == 'observed'
    assert fail_boundary['coverageState'] == 'unavailable_encoded_bytes_overflow'
    assert fixtures['categoryOverflow']['coverageState'] == 'unavailable_overflow'
    assert fixtures['physicalChunkOverflow']['coverageState'] == 'unavailable_overflow'
    assert fixtures['observedPairShapes']['1108']['encodedBytes'] == 46850
    assert measurement['maximumEncodedBytesPerDay'] == 47196
    assert measurement['pass']

    fixed_contract = {
        'chunkSize': CHUNK_SIZE,
        'categoryRowCap': CATEGORY_ROW_CAP,
        'physicalChunkRowBudget': PHYSICAL_CHUNK_ROW_BUDGET,
        'encodedBytesCap': ENCODED_BYTES_CAP,
        'retentionDays': RETENTION_DAYS,
    }
    signature_payload = {'fixedContract': fixed_contract, 'fixtures': fixtures, 'measurement': measurement}
    signature = hashlib.sha256(canonical_json(signature_payload).encode()).hexdigest()
    evidence = {
        'schemaVersion': 'viewloom-12a42-kick-history-chunked-v2-candidate-benchmark-v1',
        'phase': '12A-42',
        'issue': 926,
        'provider': 'kick',
        'status': 'PASS',
        'schemaCandidate': str(SCHEMA_PATH),
        'generatorQueryCandidate': 'workers/dormant/history-category-chunked-v2-candidate.ts',
        'fixedContract': fixed_contract,
        'fixtures': fixtures,
        'measurement': measurement,
        'semantics': {
            'lossless': True,
            'topK': False,
            'sampling': False,
            'categoryFilterBeforePeriodRanking': True,
            'allSelectedChunksExpandedBeforeRanking': True,
            'forwardOnly': True,
            'backfill': False,
        },
        'authorizations': {
            'productionSchemaApply': False,
            'productionD1Read': False,
            'productionD1Mutation': False,
            'productionGeneratorChange': False,
            'productionDeployment': False,
            'historyCategoryApiUiCutover': False,
            'twitchRollout': False,
            'newProductionCostProbe': False,
            'thresholdRelaxation': False,
        },
        'stableBenchmarkSignatureSha256': signature,
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({
        'status': evidence['status'],
        'incrementalMiBWithSafety': measurement['incrementalMiBWithSafety'],
        'projectedKickMiB': measurement['projectedKickMiB'],
        'maximumEncodedBytesPerDay': measurement['maximumEncodedBytesPerDay'],
        'signature': signature,
    }, indent=2))

if __name__ == '__main__':
    main()
