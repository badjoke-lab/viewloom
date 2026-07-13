#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "db/d1/005_category_capture.sql"
CATEGORY_CAPTURE = ROOT / "workers/shared/category-capture.ts"
CATEGORY_SQL = ROOT / "workers/shared/category-intraday-sql.ts"
CATEGORY_CONTRACT = "category-source-v1"
ANALYTICS_CONTRACT = "analytics-source-v1"
DAY = "2026-07-14"
UPDATED_AT = "2026-07-14T12:25:00.000Z"


def extract_template(path: Path, name: str) -> str:
    source = path.read_text(encoding="utf-8")
    match = re.search(rf"(?:export\s+)?const\s+{re.escape(name)}\s*=\s*`([\s\S]*?)`", source)
    assert match, f"missing SQL template {name} in {path}"
    return match.group(1)


def split_sql(source: str) -> list[str]:
    statements: list[str] = []
    buffer = ""
    for line in source.splitlines():
        if line.strip().startswith("--"):
            continue
        buffer += line + "\n"
        if sqlite3.complete_statement(buffer):
            statement = buffer.strip()
            if statement:
                statements.append(statement)
            buffer = ""
    assert not buffer.strip(), f"incomplete SQL: {buffer}"
    return statements


def column_names(db: sqlite3.Connection, table: str) -> set[str]:
    return {str(row[1]) for row in db.execute(f"PRAGMA table_info({table})")}


def apply_migration_idempotently(db: sqlite3.Connection) -> None:
    for statement in split_sql(MIGRATION.read_text(encoding="utf-8")):
        alter = re.match(
            r"ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+ADD\s+COLUMN\s+([A-Za-z0-9_]+)",
            statement,
            re.IGNORECASE | re.DOTALL,
        )
        if alter:
            table, column = alter.group(1), alter.group(2)
            if column in column_names(db, table):
                continue
        db.execute(statement)
    db.commit()


def base_schema(db: sqlite3.Connection) -> None:
    db.executescript(
        """
        CREATE TABLE minute_snapshots (
          provider TEXT NOT NULL,
          bucket_minute TEXT NOT NULL,
          collected_at TEXT,
          covered_pages INTEGER NOT NULL DEFAULT 0,
          has_more INTEGER NOT NULL DEFAULT 0,
          stream_count INTEGER NOT NULL DEFAULT 0,
          total_viewers INTEGER NOT NULL DEFAULT 0,
          payload_json TEXT NOT NULL,
          source_mode TEXT NOT NULL,
          PRIMARY KEY (provider, bucket_minute)
        );

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
        """
    )


def compact_payload(provider: str, minute: int, missing_second: bool = False) -> str:
    items = [
        {
            "channelLogin" if provider == "twitch" else "slug": "alpha",
            "displayName": "Alpha",
            "viewers" if provider == "twitch" else "viewer_count": 100 + minute,
            "momentum": 0,
            "activity": 0.1,
        },
        {
            "channelLogin" if provider == "twitch" else "slug": "beta",
            "displayName": "Beta",
            "viewers" if provider == "twitch" else "viewer_count": 80 + minute,
            "momentum": 0,
            "activity": 0.1,
        },
    ]
    return json.dumps(
        {
            "provider": provider,
            "bucketMinute": f"{DAY}T00:{minute:02d}:00.000Z",
            "bucketMinutes": 5,
            "items": items,
            "categoryContractVersion": CATEGORY_CONTRACT,
            "categoryIds": ["cat-a", "cat-b"],
            "categoryRefs": [0, None if missing_second else 1],
        },
        separators=(",", ":"),
    )


def bind_rollup_sql(source: str) -> str:
    streamer_id_sql = extract_template(CATEGORY_SQL, "STREAMER_ID_SQL")
    viewers_sql = extract_template(CATEGORY_SQL, "VIEWERS_SQL")
    return (
        source.replace("${STREAMER_ID_SQL}", streamer_id_sql)
        .replace("${VIEWERS_SQL}", viewers_sql)
        .replace("${CATEGORY_CONTRACT_VERSION}", CATEGORY_CONTRACT)
    )


def run_provider_rollup(db: sqlite3.Connection, provider: str, missing_second: bool) -> None:
    for minute in (0, 5):
        db.execute(
            """
            INSERT OR REPLACE INTO minute_snapshots (
              provider, bucket_minute, collected_at, stream_count,
              total_viewers, payload_json, source_mode
            ) VALUES (?, ?, ?, 2, 200, ?, 'real')
            """,
            (
                provider,
                f"{DAY}T00:{minute:02d}:00.000Z",
                f"{DAY}T00:{minute:02d}:10.000Z",
                compact_payload(provider, minute, missing_second),
            ),
        )

    upsert_sql = bind_rollup_sql(extract_template(CATEGORY_SQL, "CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL"))
    status_sql = extract_template(CATEGORY_SQL, "CATEGORY_STATUS_UPSERT_SQL")
    db.execute(
        upsert_sql,
        (
            provider,
            DAY,
            5,
            5,
            20,
            5,
            5,
            provider,
            provider,
            DAY,
            CATEGORY_CONTRACT,
            "complete_within_daily_cap",
            "real",
            ANALYTICS_CONTRACT,
            UPDATED_AT,
        ),
    )
    retained = db.execute(
        "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider = ? AND day = ?",
        (provider, DAY),
    ).fetchone()[0]
    db.execute(
        status_sql,
        (
            provider,
            DAY,
            retained,
            retained,
            20,
            2,
            "complete_within_daily_cap",
            "poor",
            "real",
            ANALYTICS_CONTRACT,
            UPDATED_AT,
            provider,
            DAY,
        ),
    )


def main() -> None:
    db = sqlite3.connect(":memory:")
    base_schema(db)
    apply_migration_idempotently(db)
    first_schema = {
        "rollup": column_names(db, "streamer_intraday_rollups"),
        "status": column_names(db, "intraday_rollup_status"),
        "dictionary": column_names(db, "provider_category_dictionary"),
    }
    apply_migration_idempotently(db)
    second_schema = {
        "rollup": column_names(db, "streamer_intraday_rollups"),
        "status": column_names(db, "intraday_rollup_status"),
        "dictionary": column_names(db, "provider_category_dictionary"),
    }
    assert first_schema == second_schema
    assert {
        "category_hourly_json",
        "category_observed_samples",
        "category_missing_samples",
        "category_contract_version",
    }.issubset(first_schema["rollup"])
    assert {
        "category_observed_streamers",
        "category_observed_samples",
        "category_missing_samples",
        "category_coverage_state",
    }.issubset(first_schema["status"])

    dictionary_sql = extract_template(CATEGORY_CAPTURE, "CATEGORY_DICTIONARY_UPSERT_SQL")
    entries = json.dumps([{"id": "cat-a", "name": "Category A"}, {"id": "cat-b", "name": "Category B"}])
    before = db.total_changes
    db.execute(dictionary_sql, (entries, "twitch", UPDATED_AT, UPDATED_AT, CATEGORY_CONTRACT))
    first_changes = db.total_changes - before
    before = db.total_changes
    db.execute(dictionary_sql, (entries, "twitch", UPDATED_AT, UPDATED_AT, CATEGORY_CONTRACT))
    unchanged_changes = db.total_changes - before
    assert first_changes == 2
    assert unchanged_changes == 0

    renamed = json.dumps([{"id": "cat-a", "name": "Category A renamed"}])
    before = db.total_changes
    db.execute(dictionary_sql, (renamed, "twitch", UPDATED_AT, UPDATED_AT, CATEGORY_CONTRACT))
    assert db.total_changes - before == 1
    db.execute(dictionary_sql, (entries, "kick", UPDATED_AT, UPDATED_AT, CATEGORY_CONTRACT))
    assert db.execute("SELECT COUNT(*) FROM provider_category_dictionary").fetchone()[0] == 4
    assert db.execute(
        "SELECT category_name FROM provider_category_dictionary WHERE provider='twitch' AND category_id='cat-a'"
    ).fetchone()[0] == "Category A renamed"
    assert db.execute(
        "SELECT category_name FROM provider_category_dictionary WHERE provider='kick' AND category_id='cat-a'"
    ).fetchone()[0] == "Category A"

    run_provider_rollup(db, "twitch", missing_second=True)
    run_provider_rollup(db, "kick", missing_second=False)

    for provider, expected_state in (("twitch", "missing_from_source"), ("kick", "observed")):
        rows = db.execute(
            """
            SELECT category_hourly_json, category_observed_samples,
                   category_missing_samples, category_contract_version
            FROM streamer_intraday_rollups
            WHERE provider = ? AND day = ?
            ORDER BY streamer_id
            """,
            (provider, DAY),
        ).fetchall()
        assert len(rows) == 2
        for payload_text, observed, missing, contract in rows:
            payload = json.loads(payload_text)
            assert payload["v"] == 1
            assert len(payload["r"]) == 24
            assert len(payload["s"]) == 24
            assert len(payload["m"]) == 24
            assert observed + missing == 2
            assert payload["o"] == observed
            assert payload["x"] == missing
            assert contract in (CATEGORY_CONTRACT, "unavailable")

        status = db.execute(
            """
            SELECT category_observed_streamers, category_observed_samples,
                   category_missing_samples, category_coverage_state
            FROM intraday_rollup_status
            WHERE provider = ? AND day = ?
            """,
            (provider, DAY),
        ).fetchone()
        assert status is not None
        assert status[0] >= 1
        assert status[1] > 0
        assert status[3] == expected_state

    before_rows = db.execute("SELECT COUNT(*) FROM streamer_intraday_rollups").fetchone()[0]
    run_provider_rollup(db, "twitch", missing_second=True)
    after_rows = db.execute("SELECT COUNT(*) FROM streamer_intraday_rollups").fetchone()[0]
    assert before_rows == after_rows

    print("12A-4 category migration/runtime local fixture passed.")
    print("- migration second pass: idempotent")
    print("- unchanged dictionary names: zero changed rows")
    print("- Twitch/Kick dictionary and rollups: provider-separated")
    print("- compact hourly category arrays: 24 buckets")
    print("- repeated rollup generation: no row multiplication")


if __name__ == "__main__":
    main()
