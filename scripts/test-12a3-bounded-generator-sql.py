#!/usr/bin/env python3

import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "workers/shared/intraday-rollup.ts"
MIGRATION_PATH = ROOT / "db/d1/004_intraday_rollups.sql"
SOURCE = SOURCE_PATH.read_text(encoding="utf-8")


def extract_template(name: str) -> str:
    match = re.search(rf"const {re.escape(name)} = `([\s\S]*?)`\n", SOURCE)
    if not match:
        raise AssertionError(f"missing SQL template: {name}")
    return match.group(1).strip()


streamer_id_sql = extract_template("STREAMER_ID_SQL")
viewers_sql = extract_template("VIEWERS_SQL")
precheck_sql = extract_template("PRECHECK_SQL")
upsert_sql = extract_template("UPSERT_STREAMER_ROLLUPS_SQL")
for token, value in (
    ("${STREAMER_ID_SQL}", streamer_id_sql),
    ("${VIEWERS_SQL}", viewers_sql),
):
    precheck_sql = precheck_sql.replace(token, value)
    upsert_sql = upsert_sql.replace(token, value)

inline_templates = re.findall(r"db\.prepare\(`([\s\S]*?)`\)\.bind", SOURCE)
normalized_templates = [template.strip() for template in inline_templates]


def template_starting(prefix: str, *, containing: str | None = None) -> str:
    matches = [sql for sql in normalized_templates if sql.startswith(prefix)]
    if containing is not None:
        matches = [sql for sql in matches if containing in sql]
    if len(matches) != 1:
        raise AssertionError(
            f"expected one inline SQL template prefix={prefix!r} containing={containing!r}; found={len(matches)}"
        )
    return matches[0]


mark_pending_sql = template_starting("UPDATE streamer_intraday_rollups")
delete_pending_sql = template_starting(
    "DELETE FROM streamer_intraday_rollups", containing="selection_state = 'refresh_pending'"
)
upsert_status_sql = template_starting("INSERT INTO intraday_rollup_status")
retention_rollup_sql = template_starting(
    "DELETE FROM streamer_intraday_rollups", containing="date('now', ?)"
)
retention_status_sql = template_starting(
    "DELETE FROM intraday_rollup_status", containing="date('now', ?)"
)

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute(
    """
    CREATE TABLE minute_snapshots (
      provider TEXT NOT NULL,
      bucket_minute TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      source_mode TEXT NOT NULL
    )
    """
)
conn.executescript(MIGRATION_PATH.read_text(encoding="utf-8"))


def add_snapshot(provider: str, timestamp: str, items: list[dict], source_mode: str) -> None:
    conn.execute(
        "INSERT INTO minute_snapshots(provider,bucket_minute,payload_json,source_mode) VALUES(?,?,?,?)",
        (provider, timestamp, json.dumps({"items": items}), source_mode),
    )


add_snapshot(
    "twitch",
    "2026-07-11T00:00:00.000Z",
    [
        {"channelLogin": "alpha", "displayName": "Alpha", "viewers": 100},
        {"channelLogin": "beta", "displayName": "Beta", "viewers": 80},
        {"channelLogin": "gamma", "displayName": "Gamma", "viewers": 30},
        {"channelLogin": "delta", "displayName": "Delta", "viewers": 10},
    ],
    "real",
)
add_snapshot(
    "twitch",
    "2026-07-11T01:00:00.000Z",
    [
        {"channelLogin": "alpha", "displayName": "Alpha", "viewers": 50},
        {"channelLogin": "beta", "displayName": "Beta", "viewers": 90},
        {"channelLogin": "gamma", "displayName": "Gamma", "viewers": 60},
    ],
    "real",
)
add_snapshot(
    "kick",
    "2026-07-11T00:00:00.000Z",
    [
        {"slug": "kick-one", "displayName": "Kick One", "viewer_count": 70},
        {"slug": "kick-two", "displayName": "Kick Two", "viewer_count": 40},
    ],
    "authenticated",
)
add_snapshot(
    "kick",
    "2026-07-11T01:00:00.000Z",
    [
        {"slug": "kick-one", "displayName": "Kick One", "viewer_count": 30},
        {"slug": "kick-two", "displayName": "Kick Two", "viewer_count": 90},
    ],
    "public-channel-fallback",
)


def add_rollup(provider: str, day: str, streamer_id: str, state: str = "complete_within_daily_cap") -> None:
    conn.execute(
        """
        INSERT INTO streamer_intraday_rollups (
          provider,day,streamer_id,display_name,daily_rank,total_viewer_minutes,
          peak_viewers,sample_count,observed_minutes,hourly_json,selection_state,
          source_mode,contract_version,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            provider,
            day,
            streamer_id,
            streamer_id,
            99,
            1,
            1,
            1,
            5,
            "[]",
            state,
            "fixture",
            "analytics-source-v1",
            "2026-07-10T00:00:00.000Z",
        ),
    )


add_rollup("twitch", "2026-07-11", "stale")
add_rollup("kick", "2026-07-11", "kick-sentinel")
add_rollup("twitch", "2026-07-10", "preserve-no-source")
conn.commit()


def refresh(provider: str, day: str, cap: int, bucket_minutes: int) -> dict | None:
    precheck = conn.execute(precheck_sql, (provider, day)).fetchone()
    source_snapshots = int(precheck["source_snapshots"] or 0)
    if source_snapshots <= 0:
        return None

    candidates = int(precheck["candidate_streamers"] or 0)
    retained = min(candidates, cap)
    selection_state = "capped_at_daily_limit" if candidates > cap else "complete_within_daily_cap"
    coverage_state = "good" if source_snapshots >= 240 else "partial" if source_snapshots >= 60 else "poor"
    source_mode = str(precheck["source_mode"] or "unknown")
    updated_at = "2026-07-12T00:20:00.000Z"

    with conn:
        conn.execute(mark_pending_sql, (provider, day))
        conn.execute(
            upsert_sql,
            (
                provider,
                day,
                bucket_minutes,
                bucket_minutes,
                cap,
                bucket_minutes,
                provider,
                day,
                selection_state,
                source_mode,
                "analytics-source-v1",
                updated_at,
            ),
        )
        conn.execute(delete_pending_sql, (provider, day))
        conn.execute(
            upsert_status_sql,
            (
                provider,
                day,
                candidates,
                retained,
                cap,
                source_snapshots,
                selection_state,
                coverage_state,
                source_mode,
                "analytics-source-v1",
                updated_at,
            ),
        )

    return {
        "source_snapshots": source_snapshots,
        "candidate_streamers": candidates,
        "retained_streamers": retained,
        "selection_state": selection_state,
        "coverage_state": coverage_state,
        "source_mode": source_mode,
    }


def rollup_rows(provider: str, day: str) -> list[dict]:
    rows = conn.execute(
        """
        SELECT streamer_id,daily_rank,total_viewer_minutes,peak_viewers,sample_count,
               observed_minutes,hourly_json,selection_state,source_mode
        FROM streamer_intraday_rollups
        WHERE provider=? AND day=?
        ORDER BY daily_rank,streamer_id
        """,
        (provider, day),
    ).fetchall()
    return [dict(row) for row in rows]


def status_row(provider: str, day: str) -> dict:
    row = conn.execute(
        "SELECT * FROM intraday_rollup_status WHERE provider=? AND day=?",
        (provider, day),
    ).fetchone()
    if row is None:
        raise AssertionError(f"status row missing: {provider} {day}")
    return dict(row)


twitch_result = refresh("twitch", "2026-07-11", cap=2, bucket_minutes=5)
assert twitch_result == {
    "source_snapshots": 2,
    "candidate_streamers": 4,
    "retained_streamers": 2,
    "selection_state": "capped_at_daily_limit",
    "coverage_state": "poor",
    "source_mode": "real",
}

twitch_rows = rollup_rows("twitch", "2026-07-11")
assert [row["streamer_id"] for row in twitch_rows] == ["beta", "alpha"]
assert [row["daily_rank"] for row in twitch_rows] == [1, 2]
assert twitch_rows[0]["total_viewer_minutes"] == 850
assert twitch_rows[0]["peak_viewers"] == 90
assert twitch_rows[0]["sample_count"] == 2
assert twitch_rows[0]["observed_minutes"] == 10
assert twitch_rows[0]["selection_state"] == "capped_at_daily_limit"
assert [cell["hour"] for cell in json.loads(twitch_rows[0]["hourly_json"])] == [0, 1]
assert conn.execute(
    "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider='twitch' AND streamer_id='stale'"
).fetchone()[0] == 0
assert conn.execute(
    "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider='kick' AND streamer_id='kick-sentinel'"
).fetchone()[0] == 1

twitch_status = status_row("twitch", "2026-07-11")
assert twitch_status["candidate_streamers"] == 4
assert twitch_status["retained_streamers"] == 2
assert twitch_status["retained_streamer_cap"] == 2
assert twitch_status["source_snapshots"] == 2
assert twitch_status["selection_state"] == "capped_at_daily_limit"
assert twitch_status["coverage_state"] == "poor"
assert twitch_status["source_mode"] == "real"

first_twitch_rows = rollup_rows("twitch", "2026-07-11")
refresh("twitch", "2026-07-11", cap=2, bucket_minutes=5)
second_twitch_rows = rollup_rows("twitch", "2026-07-11")
assert second_twitch_rows == first_twitch_rows

assert refresh("twitch", "2026-07-10", cap=2, bucket_minutes=5) is None
assert conn.execute(
    "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider='twitch' AND day='2026-07-10' AND streamer_id='preserve-no-source'"
).fetchone()[0] == 1

kick_result = refresh("kick", "2026-07-11", cap=5, bucket_minutes=5)
assert kick_result == {
    "source_snapshots": 2,
    "candidate_streamers": 2,
    "retained_streamers": 2,
    "selection_state": "complete_within_daily_cap",
    "coverage_state": "poor",
    "source_mode": "mixed",
}
kick_rows = rollup_rows("kick", "2026-07-11")
assert [row["streamer_id"] for row in kick_rows] == ["kick-two", "kick-one"]
assert len(kick_rows) == 2
assert all(row["selection_state"] == "complete_within_daily_cap" for row in kick_rows)
assert status_row("kick", "2026-07-11")["source_mode"] == "mixed"
assert len(rollup_rows("twitch", "2026-07-11")) == 2

add_rollup("twitch", "1900-01-01", "old-rollup")
conn.execute(
    """
    INSERT INTO intraday_rollup_status (
      provider,day,candidate_streamers,retained_streamers,retained_streamer_cap,
      source_snapshots,selection_state,coverage_state,source_mode,contract_version,refreshed_at
    ) VALUES ('twitch','1900-01-01',1,1,600,1,'complete_within_daily_cap','poor','fixture','analytics-source-v1','1900-01-01T00:00:00Z')
    """
)
with conn:
    conn.execute(retention_rollup_sql, ("twitch", "-90 days"))
    conn.execute(retention_status_sql, ("twitch", "-90 days"))
assert conn.execute(
    "SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider='twitch' AND day='1900-01-01'"
).fetchone()[0] == 0
assert conn.execute(
    "SELECT COUNT(*) FROM intraday_rollup_status WHERE provider='twitch' AND day='1900-01-01'"
).fetchone()[0] == 0
assert len(rollup_rows("twitch", "2026-07-11")) == 2

print("12A-3 bounded generator SQLite fixture passed.")
print("- runtime SQL extracted directly from workers/shared/intraday-rollup.ts")
print("- capped and complete selection states verified")
print("- hourly JSON order and aggregate math verified")
print("- stale-row removal and second-pass idempotency verified")
print("- provider separation and no-source preservation verified")
print("- 90-day retention cleanup verified")
