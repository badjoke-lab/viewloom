# TEMPORARY — ViewLoom Local Watchlist W5A hosted Preview note

Status: active W5A acceptance note
Created: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1 / W5A
Implementation branch: `work-watchlist-w5-hosted`
Hosted branch: `preview-watchlist-v1`
Hosted candidate SHA: `c75b4549bb50d7eb54c0135874dba63db0b7cc69`
Expected branch origin: `https://preview-watchlist-v1.viewloom.pages.dev`
Delete when: W5B production acceptance and permanent documentation closure are complete.

## Fixed boundary

The hosted branch points exactly to the accepted W4B merge commit. W5A adds no runtime feature code to the deployed candidate.

W5A verifies:

- `/deployment.json` reports Preview environment, exact branch, and exact candidate SHA;
- Twitch Preview Functions resolve `DB_TWITCH_HOT -> vl_twitch_hot`;
- Kick Preview Functions resolve `DB_KICK_HOT -> vl_kick_hot`;
- real Heatmap and History payloads contain usable observed ids;
- provider-specific Watchlist routes render mixed real-data evidence;
- initial, period-change, cached-restore, refresh, and Channel-save request counts remain exact;
- Twitch and Kick requests, facts, links, and storage remain separate;
- desktop and mobile hosted rendering have no horizontal overflow;
- hosted Channel save performs zero additional API requests.

## Acceptance implementation

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
```

Machine-readable evidence schema:

```text
viewloom-watchlist-hosted-preview-acceptance-v1
```

Expected artifacts:

```text
watchlist-w5a-evidence.json
watchlist-w5a.log
watchlist-w5a-twitch-desktop.png
watchlist-w5a-kick-mobile.png
watchlist-w5a-channel-save.png
```

## Forbidden changes

- no Watchlist-specific API;
- no D1 writes or migrations;
- no binding changes;
- no collector, cron, retention, or rollup changes;
- no per-channel request loop;
- no login, sync, or alert work;
- no primary-tab insertion;
- no History UI changes.
