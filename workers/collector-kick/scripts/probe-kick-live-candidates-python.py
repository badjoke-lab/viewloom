#!/usr/bin/env python3

import argparse
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SEED_FILE = REPO_ROOT / "workers/collector-kick/src/kick-seed-slugs.ts"
DEFAULT_OUTPUT = REPO_ROOT / "workers/collector-kick/generated/kick-live-priority-boost.sql"


def parse_args():
    parser = argparse.ArgumentParser(description="Probe Kick candidate slugs and generate live priority boost SQL.")
    parser.add_argument("--input", default=None, help="Optional extra slug file. One slug per line or first CSV column.")
    parser.add_argument("--out", default=str(DEFAULT_OUTPUT), help="Output SQL path.")
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--sleep", type=float, default=0.0, help="Delay after each request inside a worker.")
    parser.add_argument("--progress-every", type=int, default=25)
    parser.add_argument("--limit", type=int, default=0)
    return parser.parse_args()


def parse_seed_slugs():
    text = SEED_FILE.read_text()
    match = re.search(r"DEFAULT_KICK_SEED_SLUGS\s*=\s*\[([\s\S]*?)\]", text)
    if not match:
        raise SystemExit("DEFAULT_KICK_SEED_SLUGS not found")
    return re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))


def parse_extra_slugs(path):
    if not path:
        return []
    values = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        values.append(line.split(",")[0].strip())
    return values


def normalize_slugs(values):
    seen = set()
    out = []
    for raw in values:
        slug = str(raw).strip().lower()
        if not slug or slug in seen:
            continue
        if not re.match(r"^[a-z0-9_][a-z0-9_.-]{1,63}$", slug):
            continue
        seen.add(slug)
        out.append(slug)
    return out


def check_slug(slug, timeout):
    url = f"https://kick.com/api/v2/channels/{slug}"
    try:
        req = urllib.request.Request(url, headers={
            "accept": "application/json",
            "user-agent": "ViewLoom live probe",
        })
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        live = data.get("livestream")
        if isinstance(live, dict):
            viewers = int(live.get("viewer_count") or live.get("viewers") or 0)
            title = live.get("session_title") or live.get("title") or ""
            return {"status": "live", "slug": slug, "viewers": viewers, "title": title[:120]}
        return {"status": "offline", "slug": slug, "viewers": 0, "title": ""}
    except Exception as exc:
        return {"status": "error", "slug": slug, "viewers": 0, "title": type(exc).__name__}


def quote_sql(value):
    return "'" + str(value).replace("'", "''") + "'"


def render_sql(live_rows):
    lines = [
        "-- Generated Kick live priority boost SQL.",
        "-- Review before running against production.",
    ]
    for index, row in enumerate(sorted(live_rows, key=lambda item: (-item["viewers"], item["slug"]))):
        priority = max(1210, 1300 - index - 1)
        lines.append(
            "UPDATE kick_channels "
            f"SET status='active', priority={priority}, failure_count=0, "
            f"last_viewer_count={row['viewers']}, last_title={quote_sql(row['title'])}, "
            "last_checked_at=datetime('now'), updated_at=datetime('now'), "
            "notes=COALESCE(notes, '') || ' | live probe priority boost' "
            f"WHERE slug={quote_sql(row['slug'])};"
        )
    lines.append("")
    lines.append("-- Verification:")
    lines.append("-- SELECT slug, status, priority, last_viewer_count, failure_count FROM kick_channels ORDER BY priority DESC LIMIT 20;")
    return "\n".join(lines) + "\n"


def main():
    args = parse_args()
    slugs = normalize_slugs(parse_seed_slugs() + parse_extra_slugs(args.input))
    if args.limit > 0:
        slugs = slugs[:args.limit]

    print(json.dumps({
        "mode": "probe-kick-live-candidates-python",
        "input": {"seedFile": str(SEED_FILE), "normalizedCount": len(slugs)},
        "options": {"concurrency": args.concurrency, "timeout": args.timeout, "outputPath": str(Path(args.out).resolve())},
    }, indent=2))

    live = []
    errors = 0
    done = 0
    workers = max(1, min(args.concurrency, 32))

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(check_slug, slug, args.timeout): slug for slug in slugs}
        for future in as_completed(futures):
            result = future.result()
            done += 1
            if result["status"] == "live":
                live.append(result)
                print("LIVE", result["slug"], result["viewers"], result["title"][:80])
            elif result["status"] == "error":
                errors += 1
            if done % args.progress_every == 0 or done == len(slugs):
                print("progress", done, "/", len(slugs), "live", len(live), "errors", errors)
            if args.sleep > 0:
                time.sleep(args.sleep)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render_sql(live))

    print(json.dumps({
        "ok": True,
        "checked": len(slugs),
        "liveCount": len(live),
        "errors": errors,
        "outputPath": str(out),
        "liveSlugs": [row["slug"] for row in sorted(live, key=lambda item: (-item["viewers"], item["slug"]))],
    }, indent=2))


if __name__ == "__main__":
    main()
