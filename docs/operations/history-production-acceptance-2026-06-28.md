# ViewLoom History production acceptance — 2026-06-28

Status: permanent acceptance record
Implementation PR: #451
Closeout PR: #453
Accepted production commit: `233a35ebe219c6be42723eb749e2bcc84ae7fc09`

History Phase 9 passed the exact-production acceptance matrix.

## Acceptance runs

```text
Preview attempt: workflow 28318577620, artifact 7933542788, unavailable before tests
Pre-merge production: workflow 28325492470, artifact 7935573120, pass
Post-merge production: workflow 28325951638, artifact 7935706617, pass
Keyboard diagnostic: workflow 28325387025, artifact 7935540388, pass
```

The post-merge evidence matched production branch `main` and commit `233a35ebe219c6be42723eb749e2bcc84ae7fc09`.

## Provider proof

```text
Twitch storage: DB_TWITCH_HOT / vl_twitch_hot
Twitch collector: ok
Twitch observed streams: 300
Kick storage: DB_KICK_HOT / vl_kick_hot
Kick collector: snapshot_available
Kick observed streams: 100
Viewer-minutes: real data, 30 observed days, top 50 on both providers
Peak viewers: real data, 30 observed days, top 50 on both providers
```
