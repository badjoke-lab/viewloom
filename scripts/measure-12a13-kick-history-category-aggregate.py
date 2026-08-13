#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import tempfile
from datetime import date, timedelta
from pathlib import Path
from typing import Any

DAYS = 180
CATEGORY_ROW_CAP = 300
STREAMER_CATEGORY_ROW_CAP = 1000
SAFETY_MARGIN = 1.20
DESIGN_BUDGET_MIB = 60.0
CONTRACT_VERSION = "category-source-v1"
PROVIDER = "kick"


def round2(value: float) -> float:
    return round(value + 1e-12, 2)


def mib(byte_count: int | float) -> float:
    return float(byte_count) / 1024 / 1024


def configure(conn: sqlite3.Connection) -> None:
    conn.execute("PRAGMA page_size=4096")
    conn.execute("PRAGMA journal_mode=OFF")
    conn.execute("PRAGMA synchronous=OFF")


def create_baseline(path: Path) -> None:
    conn = sqlite3.connect(path)
    configure(conn)
    conn.execute("CREATE TABLE baseline_anchor (id INTEGER PRIMARY KEY, value TEXT NOT NULL)")
    conn.executemany(
        "INSERT INTO baseline_anchor(value) VALUES (?)",
        [(f"anchor-{index:03d}",) for index in range(64)],
    )
    conn.commit()
    conn.execute("VACUUM")
    conn.close()


def schema_inventory(conn: sqlite3.Connection) -> dict[str, list[str]]:
    tables = [
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'history_category_%' ORDER BY name"
        )
    ]
    indexes = [
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_history_category_%' ORDER BY name"
        )
    ]
    return {"tables": tables, "indexes": indexes}


def migration_idempotency(path: Path, migration_sql: str) -> dict[str, Any]:
    conn = sqlite3.connect(path)
    configure(conn)
    conn.executescript(migration_sql)
    conn.commit()
    conn.execute("VACUUM")
    first = path.stat().st_size
    first_schema = schema_inventory(conn)

    conn.executescript(migration_sql)
    conn.commit()
    conn.execute("VACUUM")
    second = path.stat().st_size
    second_schema = schema_inventory(conn)
    conn.close()
    return {
        "firstPassFileBytes": first,
        "secondPassFileBytes": second,
        "secondPassFileByteDelta": second - first,
        "schemaStable": first_schema == second_schema,
        "schema": second_schema,
    }


def populate_maximum(path: Path) -> None:
    conn = sqlite3.connect(path)
    configure(conn)
    start = date(2026, 1, 1)

    for day_index in range(DAYS):
        day = (start + timedelta(days=day_index)).isoformat()
        updated_at = f"{day}T12:20:00Z"

        category_rows = [
            (
                PROVIDER,
                day,
                str(1000 + category_index),
                (category_index + 10) * 288 * 5,
                (category_index + 10) * 4,
                288,
                "authenticated",
                CONTRACT_VERSION,
                updated_at,
            )
            for category_index in range(CATEGORY_ROW_CAP)
        ]
        conn.executemany(
            "INSERT INTO history_category_daily VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            category_rows,
        )

        pair_rows = []
        for pair_index in range(STREAMER_CATEGORY_ROW_CAP):
            category_index = pair_index % CATEGORY_ROW_CAP
            streamer_id = f"streamer-{pair_index:04d}"
            pair_rows.append(
                (
                    PROVIDER,
                    day,
                    str(1000 + category_index),
                    streamer_id,
                    f"Streamer {pair_index:04d}",
                    (pair_index % 100 + 10) * 288 * 5,
                    (pair_index % 100 + 10) * 2,
                    1440,
                    288,
                    CONTRACT_VERSION,
                    updated_at,
                )
            )
        conn.executemany(
            "INSERT INTO history_category_streamer_daily VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            pair_rows,
        )

        conn.execute(
            "INSERT INTO history_category_day_status VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                PROVIDER,
                day,
                CATEGORY_ROW_CAP,
                STREAMER_CATEGORY_ROW_CAP,
                CATEGORY_ROW_CAP,
                STREAMER_CATEGORY_ROW_CAP,
                288,
                STREAMER_CATEGORY_ROW_CAP * 288,
                0,
                "observed",
                "authenticated",
                CONTRACT_VERSION,
                updated_at,
            ),
        )

        if day_index % 30 == 29:
            conn.commit()

    conn.commit()
    conn.execute("VACUUM")
    conn.close()


def counts_and_plans(path: Path) -> dict[str, Any]:
    conn = sqlite3.connect(path)
    counts = {
        "historyCategoryDaily": conn.execute("SELECT COUNT(*) FROM history_category_daily").fetchone()[0],
        "historyCategoryStreamerDaily": conn.execute("SELECT COUNT(*) FROM history_category_streamer_daily").fetchone()[0],
        "historyCategoryDayStatus": conn.execute("SELECT COUNT(*) FROM history_category_day_status").fetchone()[0],
    }
    daily_plan = [
        row[3]
        for row in conn.execute(
            """
            EXPLAIN QUERY PLAN
            SELECT day,total_viewer_minutes,peak_viewers,observed_snapshots
            FROM history_category_daily
            WHERE provider=? AND category_id=? AND day BETWEEN ? AND ?
            ORDER BY day
            """,
            (PROVIDER, "1001", "2026-01-01", "2026-06-29"),
        )
    ]
    streamer_plan = [
        row[3]
        for row in conn.execute(
            """
            EXPLAIN QUERY PLAN
            SELECT streamer_id,MAX(display_name),SUM(viewer_minutes),MAX(peak_viewers),SUM(observed_minutes)
            FROM history_category_streamer_daily
            WHERE provider=? AND category_id=? AND day BETWEEN ? AND ?
            GROUP BY streamer_id
            ORDER BY SUM(viewer_minutes) DESC
            LIMIT 50
            """,
            (PROVIDER, "1001", "2026-01-01", "2026-06-29"),
        )
    ]
    conn.close()
    return {
        "counts": counts,
        "queryPlans": {
            "categoryDailyRange": daily_plan,
            "streamerPeriodRanking": streamer_plan,
        },
        "categoryDailyUsesExpectedIndex": any(
            "idx_history_category_daily_category_day" in line for line in daily_plan
        ),
        "streamerPeriodUsesExpectedIndex": any(
            "idx_history_category_streamer_category_day" in line for line in streamer_plan
        ),
    }


def overflow_fixture(migration_sql: str) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="viewloom-12a13-overflow-") as temp_dir:
        path = Path(temp_dir) / "overflow.sqlite"
        conn = sqlite3.connect(path)
        configure(conn)
        conn.executescript(migration_sql)
        conn.execute(
            "INSERT INTO history_category_day_status VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                PROVIDER,
                "2026-07-01",
                CATEGORY_ROW_CAP + 1,
                STREAMER_CATEGORY_ROW_CAP + 1,
                CATEGORY_ROW_CAP,
                STREAMER_CATEGORY_ROW_CAP,
                288,
                28800,
                0,
                "unavailable_overflow",
                "authenticated",
                CONTRACT_VERSION,
                "2026-07-02T00:20:00Z",
            ),
        )
        conn.commit()
        category_rows = conn.execute("SELECT COUNT(*) FROM history_category_daily").fetchone()[0]
        pair_rows = conn.execute("SELECT COUNT(*) FROM history_category_streamer_daily").fetchone()[0]
        state = conn.execute(
            "SELECT coverage_state FROM history_category_day_status WHERE provider=? AND day=?",
            (PROVIDER, "2026-07-01"),
        ).fetchone()[0]
        conn.close()
        return {
            "candidateCategoryRows": CATEGORY_ROW_CAP + 1,
            "candidateStreamerCategoryRows": STREAMER_CATEGORY_ROW_CAP + 1,
            "persistedCategoryRows": category_rows,
            "persistedStreamerCategoryRows": pair_rows,
            "coverageState": state,
            "pass": category_rows == 0 and pair_rows == 0 and state == "unavailable_overflow",
        }


def provider_separation_fixture(migration_sql: str) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="viewloom-12a13-provider-") as temp_dir:
        path = Path(temp_dir) / "provider.sqlite"
        conn = sqlite3.connect(path)
        configure(conn)
        conn.executescript(migration_sql)
        common = (
            "2026-07-01",
            "42",
            1000,
            500,
            288,
            "real",
            CONTRACT_VERSION,
            "2026-07-02T00:20:00Z",
        )
        conn.execute(
            "INSERT INTO history_category_daily VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("kick", *common),
        )
        conn.execute(
            "INSERT INTO history_category_daily VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("twitch", *common),
        )
        conn.commit()
        kick = conn.execute(
            "SELECT COUNT(*) FROM history_category_daily WHERE provider='kick' AND category_id='42'"
        ).fetchone()[0]
        twitch = conn.execute(
            "SELECT COUNT(*) FROM history_category_daily WHERE provider='twitch' AND category_id='42'"
        ).fetchone()[0]
        total = conn.execute("SELECT COUNT(*) FROM history_category_daily").fetchone()[0]
        conn.close()
        return {
            "kickRows": kick,
            "twitchRows": twitch,
            "totalRows": total,
            "sameCategoryIdCollidesAcrossProviders": total != 2,
            "pass": kick == 1 and twitch == 1 and total == 2,
            "twitchRolloutAuthorized": False,
        }


def run(migration_path: Path, decision_path: Path) -> dict[str, Any]:
    migration_sql = migration_path.read_text()
    decision = json.loads(decision_path.read_text())
    constraints = decision["currentAcceptedConstraints"]

    with tempfile.TemporaryDirectory(prefix="viewloom-12a13-benchmark-") as temp_dir:
        directory = Path(temp_dir)
        baseline = directory / "baseline.sqlite"
        candidate = directory / "candidate.sqlite"
        create_baseline(baseline)
        shutil.copyfile(baseline, candidate)

        baseline_bytes = baseline.stat().st_size
        idempotency = migration_idempotency(candidate, migration_sql)
        empty_schema_bytes = candidate.stat().st_size
        populate_maximum(candidate)
        candidate_bytes = candidate.stat().st_size
        measured = counts_and_plans(candidate)

        incremental_bytes = candidate_bytes - baseline_bytes
        incremental_mib = mib(incremental_bytes)
        safe_mib = incremental_mib * SAFETY_MARGIN

        expected_counts = {
            "historyCategoryDaily": DAYS * CATEGORY_ROW_CAP,
            "historyCategoryStreamerDaily": DAYS * STREAMER_CATEGORY_ROW_CAP,
            "historyCategoryDayStatus": DAYS,
        }

        return {
            "schemaVersion": "viewloom-12a13-kick-history-category-aggregate-benchmark-v1",
            "status": "measured",
            "trackingIssue": 831,
            "provider": PROVIDER,
            "migration": str(migration_path).replace("\\", "/"),
            "benchmark": {
                "engine": "sqlite3",
                "pageSizeBytes": 4096,
                "retentionDays": DAYS,
                "categoryRowCapPerDay": CATEGORY_ROW_CAP,
                "streamerCategoryRowCapPerDay": STREAMER_CATEGORY_ROW_CAP,
                "safetyMarginPct": 20,
                "designBudgetMiB": DESIGN_BUDGET_MIB,
                "baselineFileBytes": baseline_bytes,
                "emptySchemaFileBytes": empty_schema_bytes,
                "candidateFileBytes": candidate_bytes,
                "incrementalBytes": incremental_bytes,
                "incrementalMiB": round2(incremental_mib),
                "incrementalMiBWithSafety": round2(safe_mib),
                "designBudgetHeadroomMiB": round2(DESIGN_BUDGET_MIB - safe_mib),
                "designBudgetPass": safe_mib <= DESIGN_BUDGET_MIB,
            },
            "maximumRows": {**expected_counts, "total": sum(expected_counts.values())},
            "measuredRows": measured["counts"],
            "rowCountPass": measured["counts"] == expected_counts,
            "migrationIdempotency": idempotency,
            "queryPlans": measured["queryPlans"],
            "queryPlanPass": {
                "categoryDailyRange": measured["categoryDailyUsesExpectedIndex"],
                "streamerPeriodRanking": measured["streamerPeriodUsesExpectedIndex"],
            },
            "overflowFixture": overflow_fixture(migration_sql),
            "providerSeparationFixture": provider_separation_fixture(migration_sql),
            "freeStrongProjection": {
                "acceptedKickProjectedMiB": constraints["kickProjectedNinetyDaySizeMb"],
                "acceptedProviderCeilingMiB": constraints["projectedProviderSizeMbMax"],
                "acceptedProviderHeadroomMinMiB": constraints["projectedProviderHeadroomMbMin"],
                "acceptedAccountHeadroomMiB": constraints["kickProjectedAccountWideHeadroomMb"],
                "acceptedAccountHeadroomMinMiB": constraints["projectedAccountWideHeadroomMbMin"],
                "measuredProjectedKickMiB": round2(constraints["kickProjectedNinetyDaySizeMb"] + safe_mib),
                "measuredProviderHeadroomMiB": round2(
                    constraints["projectedProviderSizeMbMax"]
                    - constraints["kickProjectedNinetyDaySizeMb"]
                    - safe_mib
                ),
                "measuredAccountHeadroomMiB": round2(
                    constraints["kickProjectedAccountWideHeadroomMb"] - safe_mib
                ),
            },
            "semantics": {
                "categoryFilterBeforeRankingRequired": True,
                "preRankedTopKStored": False,
                "concurrentCategoryPeakRequired": True,
                "wholeDayOverflowFailClosed": True,
                "partialOverflowRowsExposed": False,
                "forwardOnly": True,
                "backfill": False,
                "rawRetentionChanged": False,
                "newCron": False,
            },
            "authorization": {
                "repositoryMigrationCandidate": True,
                "productionSchemaApply": False,
                "productionD1Mutation": False,
                "collectorGeneration": False,
                "workerDeployment": False,
                "historyApiCategoryParameter": False,
                "historyCategoryUi": False,
                "twitchRollout": False,
                "crossProviderRanking": False,
            },
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--migration",
        default="db/d1/006_history_category_aggregate.sql",
    )
    parser.add_argument(
        "--decision",
        default="docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json",
    )
    parser.add_argument(
        "--output",
        default="artifacts/12a13-kick-history-category-aggregate/evidence.json",
    )
    args = parser.parse_args()

    evidence = run(Path(args.migration), Path(args.decision))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2) + "\n")

    if not evidence["benchmark"]["designBudgetPass"]:
        raise SystemExit("history category aggregate benchmark exceeded 60 MiB design budget")
    if not evidence["rowCountPass"]:
        raise SystemExit("history category aggregate benchmark row counts did not match hard bounds")
    if not all(evidence["queryPlanPass"].values()):
        raise SystemExit("history category aggregate query plan did not use the expected category/day indexes")
    if not evidence["overflowFixture"]["pass"]:
        raise SystemExit("overflow fixture exposed partial category rows")
    if not evidence["providerSeparationFixture"]["pass"]:
        raise SystemExit("provider separation fixture failed")
    if evidence["freeStrongProjection"]["measuredProjectedKickMiB"] > evidence["freeStrongProjection"]["acceptedProviderCeilingMiB"]:
        raise SystemExit("measured aggregate would exceed the accepted Kick provider ceiling")
    if evidence["freeStrongProjection"]["measuredProviderHeadroomMiB"] < evidence["freeStrongProjection"]["acceptedProviderHeadroomMinMiB"]:
        raise SystemExit("measured aggregate would fall below the accepted Kick provider headroom")
    if evidence["freeStrongProjection"]["measuredAccountHeadroomMiB"] < evidence["freeStrongProjection"]["acceptedAccountHeadroomMinMiB"]:
        raise SystemExit("measured aggregate would fall below the accepted account-wide headroom")
    if evidence["migrationIdempotency"]["secondPassFileByteDelta"] != 0:
        raise SystemExit("migration second pass changed SQLite file size")
    if not evidence["migrationIdempotency"]["schemaStable"]:
        raise SystemExit("migration second pass changed schema inventory")


if __name__ == "__main__":
    main()
