# ViewLoom Local Watchlist v1 production acceptance

Status: completed permanent record
Accepted on: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1
Closure PR: #425

## Accepted production revision

```text
branch: main
commit_sha: f3e0ee8741e96015c5440df167574b8002fccc0d
environment: production
deployment generated_at: 2026-06-25T10:49:59.278Z
Cloudflare Pages revision: https://2e557de7.viewloom.pages.dev
public origin: https://vl.badjoke-lab.com
```

The exact revision was confirmed through `/deployment.json` before public browser acceptance began.

## Hosted Preview acceptance

```text
Preview branch: preview-watchlist-v1
Preview candidate SHA: c75b4549bb50d7eb54c0135874dba63db0b7cc69
Workflow: Watchlist Hosted Preview
Final exact-head run id: 28164503316
Artifact: watchlist-w5a-hosted-preview
Artifact id: 7875780143
Artifact digest: sha256:c6a120eff8b7ace4f415c0c50dd371286eae6660171542eccb864351145b8252
```

Preview acceptance verified the W4B runtime candidate with real Twitch and Kick data, separate provider bindings, exact request counts, provider isolation, bounded evidence wording, responsive behavior, and zero-request Channel save.

## Production acceptance

```text
Workflow: Watchlist Production Acceptance
Run id: 28166806560
Accepted work-branch head: 36eb26790b15a80338c0ff241f5c63212fd77388
Artifact: watchlist-w5b-production-acceptance
Artifact id: 7876704775
Artifact digest: sha256:baad267afc68dca50ca08bf0227e8e0a1e46be3797965e9f982115f734cb5c33
Evidence schema: viewloom-watchlist-production-acceptance-v1
Result: pass
Scenarios: 6 / 6 pass
```

The production gate verified:

- `/deployment.json` reported `environment=production`;
- `/deployment.json` reported `branch=main`;
- `/deployment.json` reported the exact accepted SHA;
- Twitch used `DB_TWITCH_HOT -> vl_twitch_hot`;
- Kick used `DB_KICK_HOT -> vl_kick_hot`;
- Twitch collector state was `ok` and non-stale;
- Kick collector state was `snapshot_available` and non-stale;
- both provider Heatmap and History APIs returned usable real data;
- both provider Home pages exposed Local Watchlist as a secondary utility, not a primary feature card;
- both Watchlist routes returned the accepted metadata and local-only disclosures;
- Twitch and Kick localStorage documents remained independent;
- provider-specific external, Channel, History, and Heatmap links remained isolated;
- bounded absence did not claim offline status;
- partial retained payloads displayed `Retained History is partial`;
- local add and remove operations made no feature-data requests;
- period change, cached Back restore, and Refresh retained their exact request contract;
- Twitch and Kick Channel saves made zero additional requests and did not mutate the other provider storage;
- desktop and mobile routes produced no page-level horizontal overflow;
- Kick mobile general controls met the 44px minimum and management controls met the 48px minimum.

## Production data evidence

| Provider | Source/state | Collector | Latest observed | Latest normalized | Retained 30d | Retained 7d | History state |
|---|---|---|---:|---:|---:|---:|---|
| Twitch | real / partial | ok | 300 | 299 | 63 | 56 | partial |
| Kick | authenticated / fresh | snapshot_available | 100 | 100 | 59 | 51 | partial |

Accepted evidence ids:

```text
Twitch
  latest present: kato_junichi0817
  retained present: eslcs
  latest only: ramzes
  retained only: jynxzi
  deterministic absent: viewloom_w5b_absent_twitch

Kick
  latest present: absi
  retained present: absi
  latest only: lepapyofficiel
  retained only: maherco
  deterministic absent: viewloom_w5b_absent_kick
```

These ids describe the accepted observation snapshot, not permanent product fixtures or provider-wide coverage.

## Accepted request contract

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
local add:                      0 Heatmap + 0 History
local remove:                   0 Heatmap + 0 History
uncached period change:         0 Heatmap + 1 History
cached Back restore:            0 Heatmap + 0 History
combined Refresh data:          1 Heatmap + 1 History
Channel save:                   0 additional requests
```

The complete permanent product contract also retains:

```text
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
all task-local list operations: 0 Heatmap + 0 History
```

One through fifty saved entries continue to use one provider Heatmap response and one provider History response rather than per-channel requests.

## Accepted storage and entry points

```text
Twitch route: /twitch/watchlist/
Kick route:   /kick/watchlist/
Twitch key:   viewloom.watchlist.twitch.v1
Kick key:     viewloom.watchlist.kick.v1
```

Provider Home entry points remain secondary utilities. Channel pages expose `Save to Watchlist` and, after saving, `Saved in Watchlist` as a management link. Save is additive and is not a remove toggle.

## Visual evidence

The production artifact contains:

```text
watchlist-w5b-twitch-home.png
watchlist-w5b-kick-home.png
watchlist-w5b-twitch-desktop.png
watchlist-w5b-kick-mobile.png
watchlist-w5b-twitch-channel-save.png
watchlist-w5b-kick-channel-save.png
watchlist-w5b-evidence.json
watchlist-w5b.log
```

Manual review confirmed:

- accepted ViewLoom dark hierarchy;
- disciplined Twitch purple and Kick green accents;
- Local Watchlist visible as a secondary Home utility;
- readable independent latest and retained evidence;
- clear partial, absent, and local-scope language;
- provider-safe actions and destructive-action separation;
- usable 390px mobile stacking and wrapping;
- no visible page-level horizontal overflow.

## Accepted product boundary

Local Watchlist v1 remains a browser-local, provider-specific utility. It does not claim or introduce:

- authoritative live or offline status from absence;
- complete provider or channel history;
- exact session starts or ends;
- provider-wide rank or totals;
- cross-platform identity, totals, or combined rankings;
- server-side user storage;
- login or cloud sync;
- alerts, polling, or background monitoring;
- per-channel API requests;
- category or language history.

No Watchlist-specific API, D1 write or migration, binding change, collector change, cron change, retention change, rollup change, primary-tab insertion, or History UI change was introduced.

## Closure

PR #425 transfers stable W0–W5B behavior and acceptance evidence into permanent documentation, removes the temporary Watchlist implementation and hosted/production acceptance notes, and retains the permanent Watchlist contract, local browser, hosted Preview, and production acceptance workflows as regression and operational gates.

Phase 6 is complete after PR #425 merges and its full merge report is issued.
