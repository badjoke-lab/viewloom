#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime, timedelta, timezone

MIN_WINDOW = timedelta(hours=23)
MAX_WINDOW = timedelta(hours=25)


def resolve(config: dict[str, str], now: datetime) -> str:
    requested = config.get("enabled", "").strip().lower() == "true"
    if not requested:
        return "disabled"
    if config.get("provider", "").strip().lower() != "twitch":
        return "invalid_provider"
    attempt = config.get("attempt", "").strip()
    if not attempt.isdigit() or int(attempt) <= 0:
        return "invalid_attempt"
    try:
        started = datetime.fromisoformat(config["started"].replace("Z", "+00:00"))
        expires = datetime.fromisoformat(config["until"].replace("Z", "+00:00"))
    except (KeyError, ValueError):
        return "invalid_window"
    window = expires - started
    if window < MIN_WINDOW or window > MAX_WINDOW:
        return "invalid_window"
    if now < started:
        return "pending"
    if now >= expires:
        return "expired"
    return "active"


start = datetime(2026, 7, 18, 0, 0, tzinfo=timezone.utc)
base = {
    "enabled": "true",
    "provider": "twitch",
    "attempt": "1",
    "started": start.isoformat().replace("+00:00", "Z"),
    "until": (start + timedelta(hours=24)).isoformat().replace("+00:00", "Z"),
}

assert resolve({}, start) == "disabled"
assert resolve({**base, "provider": "kick"}, start) == "invalid_provider"
assert resolve({**base, "attempt": "0"}, start) == "invalid_attempt"
assert resolve({**base, "until": (start + timedelta(hours=26)).isoformat()}, start) == "invalid_window"
assert resolve(base, start - timedelta(minutes=1)) == "pending"
assert resolve(base, start) == "active"
assert resolve(base, start + timedelta(hours=23, minutes=59)) == "active"
assert resolve(base, start + timedelta(hours=24)) == "expired"

sql = """
INSERT INTO provider_category_dictionary (
  provider,
  category_id,
  category_name,
  first_observed_at,
  last_observed_at,
  contract_version
)
SELECT
  ?,
  TRIM(CAST(json_extract(j.value, '$.id') AS TEXT)),
  TRIM(CAST(json_extract(j.value, '$.name') AS TEXT)),
  ?,
  ?,
  ?
FROM json_each(?) AS j
WHERE TRIM(CAST(json_extract(j.value, '$.id') AS TEXT)) != ''
  AND TRIM(CAST(json_extract(j.value, '$.name') AS TEXT)) != ''
ON CONFLICT(provider, category_id) DO UPDATE SET
  category_name = excluded.category_name,
  last_observed_at = excluded.last_observed_at,
  contract_version = excluded.contract_version
WHERE provider_category_dictionary.category_name != excluded.category_name
   OR provider_category_dictionary.contract_version != excluded.contract_version
"""

conn = sqlite3.connect(":memory:")
conn.execute("""
CREATE TABLE provider_category_dictionary (
  provider TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  PRIMARY KEY (provider, category_id)
)
""")
entries = json.dumps([
    {"id": "509658", "name": "Just Chatting"},
    {"id": "21779", "name": "League of Legends"},
])
params = ("twitch", "2026-07-18T00:00:00Z", "2026-07-18T00:00:00Z", "category-source-v1", entries)
before = conn.total_changes
conn.execute(sql, params)
first_changes = conn.total_changes - before
assert first_changes == 2, first_changes

before = conn.total_changes
conn.execute(sql, params)
second_changes = conn.total_changes - before
assert second_changes == 0, second_changes

updated_entries = json.dumps([
    {"id": "509658", "name": "Just Chatting Updated"},
    {"id": "21779", "name": "League of Legends"},
])
before = conn.total_changes
conn.execute(sql, ("twitch", "2026-07-18T00:05:00Z", "2026-07-18T00:05:00Z", "category-source-v1", updated_entries))
rename_changes = conn.total_changes - before
assert rename_changes == 1, rename_changes

assert conn.execute("SELECT COUNT(*) FROM provider_category_dictionary WHERE provider = 'kick'").fetchone()[0] == 0
assert conn.execute("SELECT COUNT(*) FROM provider_category_dictionary WHERE provider = 'twitch'").fetchone()[0] == 2

print(json.dumps({
    "ok": True,
    "canaryStates": ["disabled", "invalid_provider", "invalid_attempt", "invalid_window", "pending", "active", "expired"],
    "dictionaryFirstPassChanges": first_changes,
    "dictionarySecondPassChanges": second_changes,
    "dictionaryRenameChanges": rename_changes,
    "providerLeakageRows": 0,
}, indent=2))
