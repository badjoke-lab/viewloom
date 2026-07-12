#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import sqlite3
import tempfile
from datetime import date, timedelta
from pathlib import Path
from typing import Any

BENCHMARK_DAYS = 7
PROJECTION_DAYS = 90
SAFETY_MARGIN = 1.20
SNAPSHOTS_PER_DAY = 288
CATEGORY_DISTINCT_RATIO = 0.45
CATEGORY_CONTRACT = "category-source-v1"

PROVIDERS = {
    "twitch": {
        "retained_cap": 600,
        "snapshot_items": 300,
        "raw_retention_days": 30,
        "source_mode": "real",
        "dictionary_categories": 200,
    },
    "kick": {
        "retained_cap": 200,
        "snapshot_items": 100,
        "raw_retention_days": 60,
        "source_mode": "authenticated",
        "dictionary_categories": 100,
    },
}


def compact_json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def category_id(provider: str, index: int) -> str:
    return str((500_000 if provider == "twitch" else 1_000) + index)


def category_name(index: int) -> str:
    return f"Category {index:03d}"


def existing_hourly_json(streamer_index: int) -> str:
    return compact_json([[hour, (streamer_index % 100 + 10) * 12, 12] for hour in range(24)])


def category_hourly_json(provider: str, streamer_index: int, day_index: int) -> str:
    categories = [
        [
            category_id(provider, (streamer_index * 7 + day_index * 3 + offset) % 200),
            category_name((streamer_index * 7 + day_index * 3 + offset) % 200),
        ]
        for offset in range(3)
    ]
    return compact_json(
        {
            "v": 1,
            "c": categories,
            "r": [(hour // 8) % 3 for hour in range(24)],
            "s": [12] * 24,
            "m": [(streamer_index % 100 + 10) * 12 * 5] * 24,
            "o": 288,
            "x": 0,
        }
    )


def raw_payload_bytes(provider: str, item_count: int, include_category_refs: bool) -> int:
    items = [
        {
            "channelLogin": f"channel-{index:04d}",
            "displayName": f"Channel {index:04d}",
            "viewers": 1000 + index,
            "momentum": 0.1234,
            "activity": 0.2345,
        }
        for index in range(item_count)
    ]
    payload: dict[str, Any] = {
        "provider": provider,
        "bucketMinute": "2026-07-12T12:20:00Z",
        "bucketMinutes": 5,
        "items": items,
    }
    if include_category_refs:
        distinct = max(1, math.ceil(item_count * CATEGORY_DISTINCT_RATIO))
        payload.update(
            {
                "categoryContractVersion": CATEGORY_CONTRACT,
                "categoryIds": [category_id(provider, index) for index in range(distinct)],
                "categoryRefs": [index % distinct for index in range(item_count)],
            }
        )
    return len(compact_json(payload).encode("utf-8"))


def create_schema(connection: sqlite3.Connection, model: str) -> None:
    rollup_extra = ""
    status_extra = ""
    if model == "dominant_daily":
        rollup_extra = """
          , dominant_category_id TEXT
          , dominant_category_name TEXT
          , category_observed_samples INTEGER NOT NULL DEFAULT 0
          , category_missing_samples INTEGER NOT NULL DEFAULT 0
          , category_contract_version TEXT NOT NULL DEFAULT 'category-source-v1'
        """
        status_extra = category_status_columns()
    elif model == "embedded_hourly":
        rollup_extra = """
          , category_hourly_json TEXT NOT NULL DEFAULT '{"v":1,"c":[],"r":[],"s":[],"m":[],"o":0,"x":0}'
          , category_observed_samples INTEGER NOT NULL DEFAULT 0
          , category_missing_samples INTEGER NOT NULL DEFAULT 0
          , category_contract_version TEXT NOT NULL DEFAULT 'category-source-v1'
        """
        status_extra = category_status_columns()

    connection.executescript(
        f"""
        CREATE TABLE streamer_intraday_rollups (
          provider TEXT NOT NULL,
          day TEXT NOT NULL,
          streamer_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          daily_rank INTEGER NOT NULL,
          total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
          peak_viewers INTEGER NOT NULL DEFAULT 0,
          sample_count INTEGER NOT NULL DEFAULT 0,
          observed_minutes INTEGER NOT NULL DEFAULT 0,
          hourly_json TEXT NOT NULL DEFAULT '[]',
          selection_state TEXT NOT NULL DEFAULT 'complete_within_daily_cap',
          source_mode TEXT NOT NULL,
          contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1',
          updated_at TEXT NOT NULL
          {rollup_extra},
          PRIMARY KEY (provider, day, streamer_id)
        );
        CREATE INDEX idx_intraday_streamer_day
          ON streamer_intraday_rollups (provider, streamer_id, day);

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
          refreshed_at TEXT NOT NULL
          {status_extra},
          PRIMARY KEY (provider, day)
        );
        """
    )

    if model != "baseline":
        connection.executescript(
            """
            CREATE TABLE provider_category_dictionary (
              provider TEXT NOT NULL,
              category_id TEXT NOT NULL,
              category_name TEXT NOT NULL,
              first_observed_at TEXT NOT NULL,
              last_observed_at TEXT NOT NULL,
              contract_version TEXT NOT NULL,
              PRIMARY KEY (provider, category_id)
            );
            """
        )

    if model == "separate_hourly_table":
        connection.executescript(
            """
            CREATE TABLE streamer_category_hourly_rollups (
              provider TEXT NOT NULL,
              day TEXT NOT NULL,
              streamer_id TEXT NOT NULL,
              hour_utc INTEGER NOT NULL,
              category_id TEXT NOT NULL,
              category_name TEXT NOT NULL,
              category_sample_count INTEGER NOT NULL,
              category_viewer_minutes INTEGER NOT NULL,
              category_coverage_state TEXT NOT NULL,
              category_contract_version TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (provider, day, streamer_id, hour_utc)
            );
            CREATE INDEX idx_category_hourly_category_day
              ON streamer_category_hourly_rollups (provider, category_id, day, hour_utc);
            """
        )


def category_status_columns() -> str:
    return """
      , category_observed_streamers INTEGER NOT NULL DEFAULT 0
      , category_observed_samples INTEGER NOT NULL DEFAULT 0
      , category_missing_samples INTEGER NOT NULL DEFAULT 0
      , category_coverage_state TEXT NOT NULL DEFAULT 'unavailable'
    """


def populate_model(provider: str, model: str, database_path: Path) -> dict[str, Any]:
    settings = PROVIDERS[provider]
    cap = settings["retained_cap"]
    connection = sqlite3.connect(database_path)
    connection.execute("PRAGMA page_size=4096")
    connection.execute("PRAGMA journal_mode=OFF")
    connection.execute("PRAGMA synchronous=OFF")
    create_schema(connection, model)

    if model != "baseline":
        dictionary_rows = [
            (
                provider,
                category_id(provider, index),
                category_name(index),
                "2026-07-01T00:00:00Z",
                "2026-07-07T23:55:00Z",
                CATEGORY_CONTRACT,
            )
            for index in range(settings["dictionary_categories"])
        ]
        connection.executemany(
            "INSERT INTO provider_category_dictionary VALUES (?, ?, ?, ?, ?, ?)",
            dictionary_rows,
        )

    start_day = date(2026, 7, 1)
    for day_index in range(BENCHMARK_DAYS):
        day = (start_day + timedelta(days=day_index)).isoformat()
        status_values: list[Any] = [
            provider,
            day,
            cap * 2,
            cap,
            cap,
            288,
            "capped_at_daily_limit",
            "good",
            settings["source_mode"],
            "analytics-source-v1",
            f"{day}T12:20:00Z",
        ]
        if model in {"dominant_daily", "embedded_hourly"}:
            status_values.extend([cap, cap * 288, 0, "observed"])
        connection.execute(
            f"INSERT INTO intraday_rollup_status VALUES ({','.join('?' for _ in status_values)})",
            status_values,
        )

        rollup_rows: list[list[Any]] = []
        hourly_rows: list[tuple[Any, ...]] = []
        for streamer_index in range(cap):
            row: list[Any] = [
                provider,
                day,
                f"streamer-{streamer_index:04d}",
                f"Streamer {streamer_index:04d}",
                streamer_index + 1,
                (streamer_index + 10) * 288 * 5,
                (streamer_index + 10) * 2,
                288,
                1440,
                existing_hourly_json(streamer_index),
                "capped_at_daily_limit",
                settings["source_mode"],
                "analytics-source-v1",
                f"{day}T12:20:00Z",
            ]
            dominant_index = (streamer_index * 7 + day_index * 3) % 200
            if model == "dominant_daily":
                row.extend(
                    [
                        category_id(provider, dominant_index),
                        category_name(dominant_index),
                        288,
                        0,
                        CATEGORY_CONTRACT,
                    ]
                )
            elif model == "embedded_hourly":
                row.extend(
                    [
                        category_hourly_json(provider, streamer_index, day_index),
                        288,
                        0,
                        CATEGORY_CONTRACT,
                    ]
                )
            rollup_rows.append(row)

            if model == "separate_hourly_table":
                categories = [
                    (streamer_index * 7 + day_index * 3 + offset) % 200
                    for offset in range(3)
                ]
                for hour in range(24):
                    category_index = categories[(hour // 8) % 3]
                    hourly_rows.append(
                        (
                            provider,
                            day,
                            f"streamer-{streamer_index:04d}",
                            hour,
                            category_id(provider, category_index),
                            category_name(category_index),
                            12,
                            (streamer_index % 100 + 10) * 12 * 5,
                            "observed",
                            CATEGORY_CONTRACT,
                            f"{day}T12:20:00Z",
                        )
                    )

        connection.executemany(
            f"INSERT INTO streamer_intraday_rollups VALUES ({','.join('?' for _ in rollup_rows[0])})",
            rollup_rows,
        )
        if hourly_rows:
            connection.executemany(
                "INSERT INTO streamer_category_hourly_rollups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                hourly_rows,
            )

    connection.commit()
    connection.execute("VACUUM")
    query_plans = measure_query_plans(connection, provider, model)
    counts = {
        "rollupRows": connection.execute("SELECT COUNT(*) FROM streamer_intraday_rollups").fetchone()[0],
        "statusRows": connection.execute("SELECT COUNT(*) FROM intraday_rollup_status").fetchone()[0],
        "dictionaryRows": (
            connection.execute("SELECT COUNT(*) FROM provider_category_dictionary").fetchone()[0]
            if model != "baseline"
            else 0
        ),
        "categoryHourlyRows": (
            connection.execute("SELECT COUNT(*) FROM streamer_category_hourly_rollups").fetchone()[0]
            if model == "separate_hourly_table"
            else 0
        ),
    }
    connection.close()
    return {
        "fileBytes": database_path.stat().st_size,
        "counts": counts,
        "queryPlans": query_plans,
    }


def measure_query_plans(connection: sqlite3.Connection, provider: str, model: str) -> dict[str, list[str]]:
    plans: dict[str, list[str]] = {}
    plans["streamer90DayLookup"] = [
        row[3]
        for row in connection.execute(
            "EXPLAIN QUERY PLAN SELECT * FROM streamer_intraday_rollups WHERE provider=? AND streamer_id=? AND day BETWEEN ? AND ? ORDER BY day",
            (provider, "streamer-0001", "2026-01-01", "2026-12-31"),
        )
    ]
    plans["providerDayLookup"] = [
        row[3]
        for row in connection.execute(
            "EXPLAIN QUERY PLAN SELECT * FROM streamer_intraday_rollups WHERE provider=? AND day=? ORDER BY daily_rank",
            (provider, "2026-07-07"),
        )
    ]
    if model == "embedded_hourly":
        plans["categoryJsonExpansion"] = [
            row[3]
            for row in connection.execute(
                "EXPLAIN QUERY PLAN SELECT r.streamer_id, j.value FROM streamer_intraday_rollups r, json_each(r.category_hourly_json, '$.c') j WHERE r.provider=? AND r.day=?",
                (provider, "2026-07-07"),
            )
        ]
    if model == "separate_hourly_table":
        plans["categoryDayLookup"] = [
            row[3]
            for row in connection.execute(
                "EXPLAIN QUERY PLAN SELECT * FROM streamer_category_hourly_rollups WHERE provider=? AND category_id=? AND day BETWEEN ? AND ? ORDER BY day, hour_utc",
                (provider, category_id(provider, 1), "2026-01-01", "2026-12-31"),
            )
        ]
    return plans


def round_mb(byte_count: float) -> float:
    return round(byte_count / 1024 / 1024, 2)


def run_benchmark(storage_evidence_path: Path) -> dict[str, Any]:
    storage = json.loads(storage_evidence_path.read_text())
    providers: dict[str, Any] = {}
    account_incremental_safe_mb = 0.0

    for provider, settings in PROVIDERS.items():
        with tempfile.TemporaryDirectory(prefix=f"viewloom-12a4-{provider}-") as temp_dir:
            directory = Path(temp_dir)
            models: dict[str, Any] = {}
            for model in ["baseline", "dominant_daily", "embedded_hourly", "separate_hourly_table"]:
                measurement = populate_model(provider, model, directory / f"{model}.sqlite")
                models[model] = measurement

            baseline_bytes = models["baseline"]["fileBytes"]
            for model in ["dominant_daily", "embedded_hourly", "separate_hourly_table"]:
                delta_7d = max(0, models[model]["fileBytes"] - baseline_bytes)
                projected_90d = delta_7d * PROJECTION_DAYS / BENCHMARK_DAYS
                models[model].update(
                    {
                        "incrementalBytes7d": delta_7d,
                        "projectedIncrementalMb90d": round_mb(projected_90d),
                        "projectedIncrementalMb90dWithSafety": round_mb(projected_90d * SAFETY_MARGIN),
                    }
                )

            baseline_raw = raw_payload_bytes(provider, settings["snapshot_items"], False)
            category_raw = raw_payload_bytes(provider, settings["snapshot_items"], True)
            raw_delta = category_raw - baseline_raw
            raw_projection = raw_delta * SNAPSHOTS_PER_DAY * settings["raw_retention_days"]
            raw_safe_mb = round_mb(raw_projection * SAFETY_MARGIN)

            selected_long_mb = models["embedded_hourly"]["projectedIncrementalMb90dWithSafety"]
            selected_incremental_mb = round(raw_safe_mb + selected_long_mb, 2)
            current_projection = storage["providers"][provider]["projectedSizeMbWithSafety"]
            projected_total = round(current_projection + selected_incremental_mb, 2)
            operational_ceiling = storage["providers"][provider]["operationalCeilingMb"]
            headroom = round(operational_ceiling - projected_total, 2)
            selected_pass = projected_total <= operational_ceiling and headroom >= 10
            account_incremental_safe_mb += selected_incremental_mb

            providers[provider] = {
                "retainedStreamerCapPerDay": settings["retained_cap"],
                "snapshotItemCap": settings["snapshot_items"],
                "rawRetentionDays": settings["raw_retention_days"],
                "rawReferenceEncoding": {
                    "categoryContractVersion": CATEGORY_CONTRACT,
                    "categoryIds": "provider-native ids once per snapshot",
                    "categoryRefs": "item-order-aligned indexes; null means missing_from_source",
                    "categoryNamesRepeatedInRawItems": False,
                    "baselinePayloadBytes": baseline_raw,
                    "categoryPayloadBytes": category_raw,
                    "incrementalBytesPerSnapshot": raw_delta,
                    "projectedIncrementalMbAtRawRetention": round_mb(raw_projection),
                    "projectedIncrementalMbAtRawRetentionWithSafety": raw_safe_mb,
                },
                "models": models,
                "selectedModel": "embedded_hourly",
                "selectedIncrementalMbWithSafety": selected_incremental_mb,
                "existingProjectedSizeMbWithSafety": current_projection,
                "projectedSizeMbWithCategorySafety": projected_total,
                "operationalCeilingMb": operational_ceiling,
                "projectedHeadroomMb": headroom,
                "storageGatePass": selected_pass,
                "dictionaryWriteBudget": {
                    "additionalStatementsPerCollectorInvocation": 1,
                    "maximumDistinctCategoriesPerSnapshotFixture": math.ceil(
                        settings["snapshot_items"] * CATEGORY_DISTINCT_RATIO
                    ),
                    "maximumChangedRowsPerDayFixture": math.ceil(
                        settings["snapshot_items"] * CATEGORY_DISTINCT_RATIO
                    )
                    * SNAPSHOTS_PER_DAY,
                    "conflictRule": "update only when provider category name changes",
                    "productionCostMeasurementRequiredBeforeEnablement": True,
                },
                "generatorBudget": {
                    "additionalStatementsPerMaintenanceRefresh": 0,
                    "integration": "extend the existing set-based rollup upsert and status upsert",
                    "maximumQueriesRemains": 12,
                    "productionCostMeasurementRequiredBeforeEnablement": True,
                },
            }

    account_projected = round(storage["account"]["projectedSizeMbWithSafety"] + account_incremental_safe_mb, 2)
    account_headroom = round(storage["account"]["operationalCeilingMb"] - account_projected, 2)
    account_pass = account_projected <= storage["account"]["operationalCeilingMb"] and account_headroom >= 500

    return {
        "schemaVersion": "viewloom-12a4-category-storage-budget-v1",
        "workstream": "12A-4 provider-specific category storage design and budget gate",
        "status": "measured",
        "benchmark": {
            "engine": sqlite3.sqlite_version,
            "benchmarkDays": BENCHMARK_DAYS,
            "projectionDays": PROJECTION_DAYS,
            "snapshotsPerDay": SNAPSHOTS_PER_DAY,
            "categoryDistinctRatioFixture": CATEGORY_DISTINCT_RATIO,
            "safetyMarginPct": int((SAFETY_MARGIN - 1) * 100),
            "measurementBoundary": "Deterministic local SQLite file-size benchmark after VACUUM plus compact JSON byte projections. This is a design comparison, not remote D1 size or production query-duration evidence.",
        },
        "sourceContract": {
            "twitch": {"providerIdPath": "game_id", "namePath": "game_name"},
            "kick": {"providerIdPath": "category.id", "namePath": "category.name"},
            "providerSeparated": True,
            "categoryContractVersion": CATEGORY_CONTRACT,
        },
        "candidateModels": {
            "raw_payload_only": {
                "retains90DayCategoryEvidence": False,
                "preservesHourlyCategory": True,
                "categoryChangeFidelity": "five-minute within raw retention only",
                "decision": "rejected",
                "reason": "Raw retention remains Twitch 30 days and Kick 60 days, so this cannot support the 90-day foundation without an unauthorized retention extension.",
            },
            "dominant_daily": {
                "retains90DayCategoryEvidence": True,
                "preservesHourlyCategory": False,
                "categoryChangeFidelity": "one dominant provider category per streamer/day",
                "decision": "rejected",
                "reason": "Storage is small but time-of-day category changes required for later category-relative analysis are irreversibly lost.",
            },
            "embedded_hourly": {
                "retains90DayCategoryEvidence": True,
                "preservesHourlyCategory": True,
                "categoryChangeFidelity": "dominant provider category and support for each UTC hour",
                "decision": "selected",
                "reason": "Preserves bounded hourly evidence in existing streamer/day rows without multiplying row count or adding a category index before Phase 15.",
            },
            "separate_hourly_table": {
                "retains90DayCategoryEvidence": True,
                "preservesHourlyCategory": True,
                "categoryChangeFidelity": "one row per streamer/day/hour",
                "decision": "rejected",
                "reason": "Multiplies retained rows by up to 24 and consumes substantially more storage and write volume than the embedded representation.",
            },
        },
        "selectedDesign": {
            "model": "embedded_hourly",
            "rawPayload": {
                "categoryContractVersion": "root scalar",
                "categoryIds": "root provider-native id array",
                "categoryRefs": "root item-order-aligned reference array",
                "missingValue": None,
                "nameStorage": "set-based provider_category_dictionary upsert",
            },
            "dictionaryTable": {
                "name": "provider_category_dictionary",
                "primaryKey": ["provider", "category_id"],
                "fields": [
                    "provider",
                    "category_id",
                    "category_name",
                    "first_observed_at",
                    "last_observed_at",
                    "contract_version",
                ],
            },
            "rollupColumns": [
                "category_hourly_json",
                "category_observed_samples",
                "category_missing_samples",
                "category_contract_version",
            ],
            "statusColumns": [
                "category_observed_streamers",
                "category_observed_samples",
                "category_missing_samples",
                "category_coverage_state",
            ],
            "categoryHourlyJson": {
                "version": 1,
                "keys": {
                    "c": "per streamer/day provider-id and historical-name dictionary",
                    "r": "24 hourly dictionary references",
                    "s": "24 hourly category sample counts",
                    "m": "24 hourly category viewer-minute support",
                    "o": "daily observed category samples",
                    "x": "daily missing category samples",
                },
                "hourlyResolution": True,
                "exactSwitchTimeClaimAllowed": False,
                "exactSessionClaimAllowed": False,
            },
            "indexes": {
                "newCategoryIndex": False,
                "existingStreamerDayIndexReused": True,
                "dictionaryPrimaryKeyUsed": True,
                "futureMaterializationDecision": "Phase 15 may authorize category profiles if JSON expansion cost requires them.",
            },
            "retentionDays": 90,
            "newCron": False,
            "backfill": False,
            "rawRetentionChanged": False,
            "runtimeCaptureEnabled": False,
        },
        "coverageContract": {
            "observed": "A retained stream item has a valid category reference and provider id/name pair.",
            "missing_from_source": "The stream item was observed but its accepted provider category pair was absent or invalid.",
            "not_in_bounded_window": "The streamer/category was not present in ViewLoom's bounded provider window; this is not an offline claim.",
            "partial_source_coverage": "The collector source reports partial/bounded coverage for the observation period.",
            "stale": "The supporting collector or rollup timestamp is beyond its accepted freshness boundary.",
            "unavailable": "The category contract or runtime capture is unavailable for that observation.",
        },
        "providers": providers,
        "account": {
            "existingProjectedSizeMbWithSafety": storage["account"]["projectedSizeMbWithSafety"],
            "selectedCategoryIncrementalMbWithSafety": round(account_incremental_safe_mb, 2),
            "projectedSizeMbWithCategorySafety": account_projected,
            "operationalCeilingMb": storage["account"]["operationalCeilingMb"],
            "projectedHeadroomMb": account_headroom,
            "storageGatePass": account_pass,
        },
        "gate": {
            "twitchStoragePass": providers["twitch"]["storageGatePass"],
            "kickStoragePass": providers["kick"]["storageGatePass"],
            "accountStoragePass": account_pass,
            "categoryStorageDesignPass": providers["twitch"]["storageGatePass"]
            and providers["kick"]["storageGatePass"]
            and account_pass,
            "migrationAuthorized": False,
            "runtimeCaptureAuthorized": False,
            "productionCostProbeRequired": True,
        },
        "boundaries": {
            "productionSchemaChanged": False,
            "productionRowsWritten": False,
            "migrationAdded": False,
            "runtimeCaptureStarted": False,
            "rawRetentionChanged": False,
            "newCronAdded": False,
            "backfillPerformed": False,
            "categoryAnalyticsUiIncluded": False,
            "crossProviderCategoryIdentityAllowed": False,
            "combinedProviderCategoryRankingAllowed": False,
        },
        "limitations": [
            "Local SQLite page accounting is not identical to remote D1 storage accounting.",
            "The raw payload category distinct ratio is a deterministic conservative fixture, not a production distribution claim.",
            "Production D1 rows_read, rows_written, SQL duration, Worker duration, and collector latency must be measured before runtime capture enablement.",
            "The design preserves hourly dominant category evidence and support, not exact category switch timestamps or exact sessions.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--storage-evidence", default="docs/audits/12a3-account-storage-evidence.json")
    parser.add_argument("--output", default="artifacts/12a4-category-storage/evidence.json")
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    evidence = run_benchmark(Path(args.storage_evidence))
    output.write_text(json.dumps(evidence, indent=2) + "\n")


if __name__ == "__main__":
    main()
