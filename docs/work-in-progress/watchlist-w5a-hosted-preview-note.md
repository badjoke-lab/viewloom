# TEMPORARY — ViewLoom Local Watchlist W5A hosted Preview note

Status: W5A completion candidate
Created: 2026-06-25
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1 / W5A
Implementation branch: `work-watchlist-w5-hosted`
Pull request: `#424 Verify Local Watchlist on hosted Preview`
Hosted branch: `preview-watchlist-v1`
Hosted candidate SHA: `c75b4549bb50d7eb54c0135874dba63db0b7cc69`
Deployment-specific origin: `https://c0228ac1.viewloom.pages.dev`
Delete when: W5B production acceptance and permanent documentation closure are complete.

## Accepted boundary

The hosted branch points exactly to the accepted W4B merge commit. W5A adds acceptance automation and records only; it adds no runtime Watchlist feature code.

No D1 write or migration, binding change, collector, cron, retention, rollup, Watchlist-specific API, per-channel request loop, login, sync, alert, primary-tab, or History UI change was made.

## Deployment identity

```text
schema: viewloom-deployment-v1
environment: preview
branch: preview-watchlist-v1
commit_sha: c75b4549bb50d7eb54c0135874dba63db0b7cc69
pages_url: https://c0228ac1.viewloom.pages.dev
```

## Provider bindings and real data

```text
Twitch: DB_TWITCH_HOT -> vl_twitch_hot
  source mode: real
  provider state: partial
  latest rows: 300
  retained 30d ids: 63
  retained 7d ids: 56
  latest/retained id: kato_junichi0817
  latest-only id: shinjifromjapanxd
  retained-only id: jynxzi

Kick: DB_KICK_HOT -> vl_kick_hot
  source mode: authenticated
  provider state: fresh
  latest rows: 100
  retained 30d ids: 59
  retained 7d ids: 51
  latest/retained id: absi
  latest-only id: thedoctor
  retained-only id: maherco
```

Both History payloads were partial. The hosted UI correctly rendered `Retained History is partial` and did not claim complete retained presence or absence.

## Hosted acceptance

Evidence schema:

```text
viewloom-watchlist-hosted-preview-acceptance-v1
```

```text
twitch-desktop-hosted     pass
kick-mobile-hosted        pass
kick-channel-save-hosted  pass
```

Request evidence for both provider Watchlist routes:

```text
empty initial load:       0 Heatmap + 0 History
nonempty initial load:    1 Heatmap + 1 History
uncached 7d change:       0 Heatmap + 1 History
cached Back restore:      0 Heatmap + 0 History
combined refresh:         1 Heatmap + 1 History
```

Kick Channel save used `viewloom.watchlist.kick.v1` and made zero additional requests. Desktop and 390px mobile routes had no horizontal overflow. Mobile general controls were at least 44px and management controls were at least 48px.

## Implementation and artifacts

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml

Watchlist Hosted Preview run: 28162895177
result: success
accepted work-branch head: eac0d0f941818b64a357802fe3bfed02479c482a

watchlist-w5a-evidence.json
watchlist-w5a.log
watchlist-w5a-twitch-desktop.png
watchlist-w5a-kick-mobile.png
watchlist-w5a-channel-save.png
```

## Next step

After PR #424 merges and its full merge report is issued, W5B may begin on a new explicitly approved work branch. W5B must verify the exact production deployment and then delete the temporary Watchlist notes after transferring stable evidence to permanent documentation.
