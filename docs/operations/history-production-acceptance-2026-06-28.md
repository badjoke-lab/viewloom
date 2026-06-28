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

## Browser proof

The accepted scenarios were:

```text
twitch-desktop-1440-hosted
kick-tablet-820-hosted
kick-mobile-390-hosted
twitch-mobile-360-hosted
twitch-forced-colors-390-hosted
```

All passed with zero horizontal overflow. Metric execution, direct links, Back/Forward, no-refetch task switching, keyboard and touch inspection, minimum targets, reduced motion, and forced colors passed. No console or page diagnostics remained.

## Artifact integrity

```text
Preview artifact digest: sha256:6478747e87b5bb749e9323343e22f7b521c0efad7fa8b788926e41b791c6c584
Pre-merge artifact digest: sha256:254f73e88d29ecbde1eff92df1eaa97baf14bd994ddb5a0f8fda7e9c44355742
Post-merge artifact digest: sha256:d7fb7d469ff112e611fdcd7d81dc918c9c719c1667f6b9802ffca7919dba369b
Keyboard artifact digest: sha256:0d98dbea15eb5640c0dd62cd28abc0fd7809f42fa875f0a0df2b7abba8af578f
```

## Decision

History Phase 9 is accepted in production. The exact next approved branch is `work-quality-u10a-baseline`. No Phase 10 branch was created during this closeout.
