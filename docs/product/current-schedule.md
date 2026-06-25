# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-25

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Full acceptance must use the latest candidate head and exact deployed revision.
- After every merge, issue the full merge report before beginning another PR.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7 and production acceptance complete
Channel C0-C5B and production acceptance complete
Report/export R0-R4                      complete through PR #413
Phase 5 capability audit                 complete through PR #414
Local Watchlist W0                       complete through PR #415
Local Watchlist W1                       complete through PR #416
Local Watchlist W2A                      complete through PR #417
Local Watchlist W2B                      complete through PR #418
Local Watchlist W3A                      complete through PR #419
Local Watchlist W3B                      complete through PR #420
Local Watchlist W3C                      complete through PR #421
Local Watchlist W4A                      complete through PR #422
Local Watchlist W4B                      complete through PR #423
Local Watchlist W5A                      complete through PR #424
Local Watchlist W5B                      completion PR #425
History UI appearance revision           pending screenshots and instructions
Next major feature                        not selected
```

Active completion record:

```text
Phase 6 — Local Watchlist v1
W5B — production acceptance and documentation closure
branch: work-watchlist-w5-production
PR: #425
accepted production SHA: f3e0ee8741e96015c5440df167574b8002fccc0d
state: completion candidate
```

## 3. W5B accepted evidence

Production deployment identity:

```text
schema: viewloom-deployment-v1
environment: production
branch: main
commit_sha: f3e0ee8741e96015c5440df167574b8002fccc0d
pages_url: https://2e557de7.viewloom.pages.dev
generated_at: 2026-06-25T10:49:59.278Z
```

Provider evidence:

```text
Twitch
  binding: DB_TWITCH_HOT -> vl_twitch_hot
  source/state: real / partial
  collector: ok
  stale: false
  observed: 300
  latest normalized: 299
  retained 30d: 63
  retained 7d: 56
  retained state: partial

Kick
  binding: DB_KICK_HOT -> vl_kick_hot
  source/state: authenticated / fresh
  collector: snapshot_available
  stale: false
  observed: 100
  latest normalized: 100
  retained 30d: 59
  retained 7d: 51
  retained state: partial
```

Production acceptance:

```text
workflow: Watchlist Production Acceptance
run: 28166806560
result: success
schema: viewloom-watchlist-production-acceptance-v1
scenarios: 6 / 6 pass
artifact id: 7876704775
artifact digest: sha256:baad267afc68dca50ca08bf0227e8e0a1e46be3797965e9f982115f734cb5c33
```

Scenarios:

```text
twitch-home-entry-production
kick-home-entry-production
twitch-desktop-production
kick-mobile-production
twitch-channel-save-production
kick-channel-save-production
```

## 4. Accepted request and product contract

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
local add:                      0 Heatmap + 0 History
local remove:                   0 Heatmap + 0 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined refresh:               1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

Preserved boundaries:

- Twitch and Kick remain separate in routes, localStorage, requests, facts, links, bindings, and counts;
- Watchlist remains outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete channel history;
- no exact sessions;
- no per-channel request loop;
- no login, cloud sync, or alerts;
- no Watchlist-specific API;
- no D1 write, migration, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 5. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   complete PR #422
W4B  complete local browser candidate QA           complete PR #423
W5A  hosted Preview acceptance                     complete PR #424
W5B  production acceptance/documentation cleanup   completion PR #425
```

## 6. Completion and next-start rule

After PR #425 merges and its full merge report is issued:

- Phase 6 is complete;
- no Local Watchlist work branch remains active;
- no next major feature is automatically approved;
- a new branch requires an explicit user instruction and a roadmap/schedule update when necessary.

The pending History appearance revision remains blocked on screenshots and detailed instructions.
