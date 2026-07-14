#!/usr/bin/env python3
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "db/d1/005_category_capture.sql"

ROLLUP_COLUMNS = {
    "category_hourly_json",
    "category_observed_samples",
    "category_missing_samples",
    "category_contract_version",
}
STATUS_COLUMNS = {
    "category_observed_streamers",
    "category_observed_samples",
    "category_missing_samples",
    "category_coverage_state",
}


def columns(conn, table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info('{table}')")}


def dictionary_present(conn):
    return conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='provider_category_dictionary'"
    ).fetchone()[0] == 1


def state(conn):
    rollup = columns(conn, "streamer_intraday_rollups") & ROLLUP_COLUMNS
    status = columns(conn, "intraday_rollup_status") & STATUS_COLUMNS
    dictionary = dictionary_present(conn)
    complete = dictionary and rollup == ROLLUP_COLUMNS and status == STATUS_COLUMNS
    absent = not dictionary and not rollup and not status
    return {
        "dictionary": dictionary,
        "rollup": sorted(rollup),
        "status": sorted(status),
        "complete": complete,
        "absent": absent,
        "partial": not complete and not absent,
    }


def migration_statements():
    statements = []
    for part in MIGRATION.read_text().split(";"):
        clean = "\n".join(
            line for line in part.splitlines()
            if not line.lstrip().startswith("--")
        ).strip()
        if clean:
            statements.append(clean)
    return statements


def controlled_apply(conn, require_absent=True):
    pre = state(conn)
    if pre["complete"]:
        return {"attempted": True, "applied": 0, "skipped": 9, "reason": "already-complete", "pre": pre, "post": pre}
    if require_absent and pre["partial"]:
        return {"attempted": False, "applied": 0, "skipped": 0, "reason": "partial-schema-stop", "pre": pre, "post": pre}

    applied = 0
    skipped = 0
    for statement in migration_statements():
        match = re.match(
            r"ALTER TABLE\s+(\w+)\s+ADD COLUMN\s+(\w+)\s+",
            statement,
            flags=re.IGNORECASE | re.DOTALL,
        )
        if match:
            table, column = match.group(1), match.group(2)
            if column in columns(conn, table):
                skipped += 1
                continue
        if statement.upper().startswith("CREATE TABLE IF NOT EXISTS PROVIDER_CATEGORY_DICTIONARY") and dictionary_present(conn):
            skipped += 1
            continue
        conn.execute(statement)
        applied += 1
    conn.commit()
    post = state(conn)
    assert post["complete"]
    return {"attempted": True, "applied": applied, "skipped": skipped, "reason": "applied", "pre": pre, "post": post}


def base_connection():
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
        INSERT INTO collector_status VALUES ('twitch', 'ok', '2026-07-14T08:35:58.872Z');
        INSERT INTO collector_status VALUES ('kick', 'ok', '2026-07-14T08:35:57.068Z');
        INSERT INTO streamer_intraday_rollups VALUES (
          'twitch', '2026-07-14', 'existing-streamer', 'Existing Streamer', 1,
          600, 100, 6, 30, '[]', 'complete_within_daily_cap', 'real',
          'analytics-source-v1', '2026-07-14T08:35:00Z'
        );
        INSERT INTO intraday_rollup_status VALUES (
          'twitch', '2026-07-14', 1, 1, 600, 6,
          'complete_within_daily_cap', 'good', 'real',
          'analytics-source-v1', '2026-07-14T08:35:00Z'
        );
        """
    )
    return conn


def main():
    statements = migration_statements()
    assert len(statements) == 9

    conn = base_connection()
    collector_before = conn.execute(
        "SELECT provider, status, last_success_at FROM collector_status ORDER BY provider"
    ).fetchall()
    existing_before = conn.execute(
        "SELECT provider, day, streamer_id, total_viewer_minutes FROM streamer_intraday_rollups"
    ).fetchall()

    initial = state(conn)
    assert initial["absent"]
    first = controlled_apply(conn)
    second = controlled_apply(conn)

    assert first["applied"] == 9
    assert first["skipped"] == 0
    assert second["applied"] == 0
    assert second["reason"] == "already-complete"
    assert second["post"]["complete"]

    collector_after = conn.execute(
        "SELECT provider, status, last_success_at FROM collector_status ORDER BY provider"
    ).fetchall()
    existing_after = conn.execute(
        "SELECT provider, day, streamer_id, total_viewer_minutes FROM streamer_intraday_rollups"
    ).fetchall()
    assert collector_before == collector_after
    assert existing_before == existing_after

    defaults = conn.execute(
        """
        SELECT category_hourly_json, category_observed_samples,
               category_missing_samples, category_contract_version
        FROM streamer_intraday_rollups
        WHERE streamer_id = 'existing-streamer'
        """
    ).fetchone()
    assert defaults == ('{"v":1,"c":[],"r":[],"s":[],"m":[],"o":0,"x":0}', 0, 0, 'unavailable')

    status_defaults = conn.execute(
        """
        SELECT category_observed_streamers, category_observed_samples,
               category_missing_samples, category_coverage_state
        FROM intraday_rollup_status
        WHERE provider = 'twitch' AND day = '2026-07-14'
        """
    ).fetchone()
    assert status_defaults == (0, 0, 0, 'unavailable')
    assert conn.execute("SELECT COUNT(*) FROM provider_category_dictionary").fetchone()[0] == 0

    partial = base_connection()
    partial.execute(statements[0])
    partial.commit()
    partial_before = state(partial)
    partial_result = controlled_apply(partial, require_absent=True)
    partial_after = state(partial)
    assert partial_before["partial"]
    assert partial_result["reason"] == "partial-schema-stop"
    assert partial_result["attempted"] is False
    assert partial_before == partial_after
    assert not ROLLUP_COLUMNS & columns(partial, "streamer_intraday_rollups")
    assert not STATUS_COLUMNS & columns(partial, "intraday_rollup_status")

    print(json.dumps({
        "ok": True,
        "migrationStatementCount": len(statements),
        "initialState": initial,
        "firstApply": {"applied": first["applied"], "skipped": first["skipped"], "complete": first["post"]["complete"]},
        "secondApply": {"applied": second["applied"], "reason": second["reason"]},
        "partialSchemaStop": True,
        "existingRowsPreserved": existing_before == existing_after,
        "collectorStatePreserved": collector_before == collector_after,
        "dictionaryRowsAfterApply": conn.execute("SELECT COUNT(*) FROM provider_category_dictionary").fetchone()[0],
        "productionExecution": False,
    }, indent=2))


if __name__ == "__main__":
    main()
