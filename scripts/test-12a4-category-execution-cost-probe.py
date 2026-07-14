#!/usr/bin/env python3
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "db/d1/005_category_capture.sql"
PROBE_DAY = "1900-01-02"
PROBE_PREFIX = "__viewloom_category_cost_probe__:"


def columns(conn, table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info('{table}')")}


def controlled_apply(conn):
    sql = MIGRATION.read_text()
    statements = [part.strip() for part in sql.split(";") if part.strip()]
    applied = 0
    skipped = 0
    for statement in statements:
        clean = "\n".join(
            line for line in statement.splitlines()
            if not line.lstrip().startswith("--")
        ).strip()
        if not clean:
            continue
        match = re.match(
            r"ALTER TABLE\s+(\w+)\s+ADD COLUMN\s+(\w+)\s+",
            clean,
            flags=re.IGNORECASE | re.DOTALL,
        )
        if match:
            table, column = match.group(1), match.group(2)
            if column in columns(conn, table):
                skipped += 1
                continue
        conn.execute(clean)
        applied += 1
    conn.commit()
    return {"applied": applied, "skipped": skipped}


def dictionary_upsert(conn, provider, entries, observed_at):
    sql = """
    WITH incoming AS (
      SELECT
        TRIM(CAST(json_extract(j.value, '$.id') AS TEXT)) AS category_id,
        TRIM(CAST(json_extract(j.value, '$.name') AS TEXT)) AS category_name
      FROM json_each(?) j
    ),
    valid AS (
      SELECT category_id, MAX(category_name) AS category_name
      FROM incoming
      WHERE category_id != '' AND category_name != ''
      GROUP BY category_id
    )
    INSERT INTO provider_category_dictionary (
      provider, category_id, category_name,
      first_observed_at, last_observed_at, contract_version
    )
    SELECT ?, category_id, category_name, ?, ?, 'category-source-v1'
    FROM valid
    WHERE 1 = 1
    ON CONFLICT(provider, category_id) DO UPDATE SET
      category_name = excluded.category_name,
      last_observed_at = excluded.last_observed_at,
      contract_version = excluded.contract_version
    WHERE provider_category_dictionary.category_name != excluded.category_name
       OR provider_category_dictionary.contract_version != excluded.contract_version
    """
    before = conn.total_changes
    conn.execute(sql, (json.dumps(entries), provider, observed_at, observed_at))
    conn.commit()
    return conn.total_changes - before


def upsert_probe_rows(conn, provider):
    streamer_id = f"{PROBE_PREFIX}{provider}"
    category_json = json.dumps({
        "v": 1,
        "c": [f"{PROBE_PREFIX}{provider}:category"],
        "r": [0],
        "s": [1],
        "m": [0],
        "o": 1,
        "x": 0,
    }, separators=(",", ":"))
    conn.execute(
        """
        INSERT INTO streamer_intraday_rollups (
          provider, day, streamer_id, display_name, daily_rank,
          total_viewer_minutes, peak_viewers, sample_count, observed_minutes,
          hourly_json, selection_state, source_mode, contract_version, updated_at,
          category_hourly_json, category_observed_samples,
          category_missing_samples, category_contract_version
        ) VALUES (?, ?, ?, ?, 1, 60, 60, 1, 1, '[]',
                  'category_cost_probe', 'cost-probe', 'analytics-source-v1', ?,
                  ?, 1, 0, 'category-source-v1')
        ON CONFLICT(provider, day, streamer_id) DO UPDATE SET
          category_hourly_json = excluded.category_hourly_json,
          category_observed_samples = excluded.category_observed_samples,
          category_missing_samples = excluded.category_missing_samples,
          category_contract_version = excluded.category_contract_version,
          updated_at = excluded.updated_at
        """,
        (provider, PROBE_DAY, streamer_id, provider, "2026-07-14T00:00:00Z", category_json),
    )
    conn.execute(
        """
        INSERT INTO intraday_rollup_status (
          provider, day, candidate_streamers, retained_streamers,
          retained_streamer_cap, source_snapshots, selection_state,
          coverage_state, source_mode, contract_version, refreshed_at,
          category_observed_streamers, category_observed_samples,
          category_missing_samples, category_coverage_state
        ) VALUES (?, ?, 1, 1, 1, 1, 'category_cost_probe',
                  'good', 'cost-probe', 'analytics-source-v1', ?,
                  1, 1, 0, 'observed')
        ON CONFLICT(provider, day) DO UPDATE SET
          category_observed_streamers = excluded.category_observed_streamers,
          category_observed_samples = excluded.category_observed_samples,
          category_missing_samples = excluded.category_missing_samples,
          category_coverage_state = excluded.category_coverage_state,
          refreshed_at = excluded.refreshed_at
        """,
        (provider, PROBE_DAY, "2026-07-14T00:00:00Z"),
    )
    conn.commit()


def main():
    conn = sqlite3.connect(":memory:")
    conn.executescript(
        """
        CREATE TABLE streamer_intraday_rollups (
          provider TEXT NOT NULL,
          day TEXT NOT NULL,
          streamer_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          daily_rank INTEGER NOT NULL,
          total_viewer_minutes INTEGER NOT NULL,
          peak_viewers INTEGER NOT NULL,
          sample_count INTEGER NOT NULL,
          observed_minutes INTEGER NOT NULL,
          hourly_json TEXT NOT NULL,
          selection_state TEXT NOT NULL,
          source_mode TEXT NOT NULL,
          contract_version TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (provider, day, streamer_id)
        );
        CREATE TABLE intraday_rollup_status (
          provider TEXT NOT NULL,
          day TEXT NOT NULL,
          candidate_streamers INTEGER NOT NULL,
          retained_streamers INTEGER NOT NULL,
          retained_streamer_cap INTEGER NOT NULL,
          source_snapshots INTEGER NOT NULL,
          selection_state TEXT NOT NULL,
          coverage_state TEXT NOT NULL,
          source_mode TEXT NOT NULL,
          contract_version TEXT NOT NULL,
          refreshed_at TEXT NOT NULL,
          PRIMARY KEY (provider, day)
        );
        CREATE TABLE collector_status (
          provider TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          last_success_at TEXT
        );
        INSERT INTO collector_status VALUES ('twitch', 'ok', '2026-07-14T00:00:00Z');
        INSERT INTO collector_status VALUES ('kick', 'ok', '2026-07-14T00:00:00Z');
        """
    )

    first_apply = controlled_apply(conn)
    second_apply = controlled_apply(conn)

    required_rollup = {
        "category_hourly_json",
        "category_observed_samples",
        "category_missing_samples",
        "category_contract_version",
    }
    required_status = {
        "category_observed_streamers",
        "category_observed_samples",
        "category_missing_samples",
        "category_coverage_state",
    }
    assert required_rollup <= columns(conn, "streamer_intraday_rollups")
    assert required_status <= columns(conn, "intraday_rollup_status")

    twitch_entries = [{"id": f"{PROBE_PREFIX}tw:1", "name": "Twitch Probe"}]
    kick_entries = [{"id": f"{PROBE_PREFIX}ki:1", "name": "Kick Probe"}]
    twitch_first = dictionary_upsert(conn, "twitch", twitch_entries, "2026-07-14T00:00:00Z")
    twitch_second = dictionary_upsert(conn, "twitch", twitch_entries, "2026-07-14T00:00:00Z")
    kick_first = dictionary_upsert(conn, "kick", kick_entries, "2026-07-14T00:00:00Z")
    kick_second = dictionary_upsert(conn, "kick", kick_entries, "2026-07-14T00:00:00Z")

    assert twitch_first == 1 and kick_first == 1
    assert twitch_second == 0 and kick_second == 0

    for provider in ("twitch", "kick"):
        upsert_probe_rows(conn, provider)
        upsert_probe_rows(conn, provider)

    assert conn.execute(
        "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE day = ?",
        (PROBE_DAY,),
    ).fetchone()[0] == 2
    assert conn.execute(
        "SELECT COUNT(*) FROM intraday_rollup_status WHERE day = ?",
        (PROBE_DAY,),
    ).fetchone()[0] == 2

    collector_before = dict(conn.execute(
        "SELECT provider, status FROM collector_status ORDER BY provider"
    ).fetchall())
    failure_caught = False
    try:
        conn.execute("INSERT INTO provider_category_dictionary(no_such_column) VALUES (1)")
    except sqlite3.DatabaseError:
        failure_caught = True
    collector_after = dict(conn.execute(
        "SELECT provider, status FROM collector_status ORDER BY provider"
    ).fetchall())
    assert failure_caught
    assert collector_before == collector_after == {"kick": "ok", "twitch": "ok"}

    conn.execute(
        "DELETE FROM streamer_intraday_rollups WHERE day = ? AND selection_state = 'category_cost_probe'",
        (PROBE_DAY,),
    )
    conn.execute(
        "DELETE FROM intraday_rollup_status WHERE day = ? AND selection_state = 'category_cost_probe'",
        (PROBE_DAY,),
    )
    conn.execute(
        "DELETE FROM provider_category_dictionary WHERE category_id LIKE ?",
        (f"{PROBE_PREFIX}%",),
    )
    conn.commit()

    remaining = sum([
        conn.execute("SELECT COUNT(*) FROM streamer_intraday_rollups WHERE day = ?", (PROBE_DAY,)).fetchone()[0],
        conn.execute("SELECT COUNT(*) FROM intraday_rollup_status WHERE day = ?", (PROBE_DAY,)).fetchone()[0],
        conn.execute("SELECT COUNT(*) FROM provider_category_dictionary WHERE category_id LIKE ?", (f"{PROBE_PREFIX}%",)).fetchone()[0],
    ])
    assert remaining == 0

    print(json.dumps({
        "ok": True,
        "firstApply": first_apply,
        "secondApply": second_apply,
        "dictionary": {
            "twitchFirstChanges": twitch_first,
            "twitchSecondChanges": twitch_second,
            "kickFirstChanges": kick_first,
            "kickSecondChanges": kick_second,
        },
        "providerSeparated": True,
        "idempotentProbeRows": True,
        "failureContained": True,
        "cleanupRemainingRows": remaining,
        "remoteMigrationApplied": False,
        "productionCategoryCapture": False,
    }, indent=2))


if __name__ == "__main__":
    main()
