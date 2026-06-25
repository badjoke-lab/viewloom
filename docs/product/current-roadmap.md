# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-25

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick data paths.

Verified production foundations:

- production branch: `main`;
- automatic production deployment: enabled;
- Preview branches restricted to `preview-*`;
- Twitch and Kick Pages Functions use separate D1 bindings;
- collectors expose bounded observations and freshness state;
- explicit 404 behavior is deployed;
- `/deployment.json` identifies the active production branch and commit;
- permanent Production Smoke automation is present.

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production-ready core | maintain and audit |
| Heatmap | production core complete | verified defects only |
| Day Flow | production core complete | verified defects only |
| Battle Lines | production core complete | verified defects only |
| History & Trends | production acceptance complete | preserve; visual revision pending separate instructions |
| Data Status | production core complete | maintain |
| Channel / Streamer | v1 and production acceptance complete | preserve retained-footprint contract |
| Report/export shared layer | R0–R4 complete through PR #413 | maintain exact contracts |
| Phase 5 capability audit | complete through PR #414 | permanent decision recorded |
| Local Watchlist v1 | W0–W5B complete through PR #425 | production accepted; maintain contracts |
| Session / Category / Language / Event / Alerts | not approved for immediate implementation | data or infrastructure expansion required |

## 2. Permanent acceptance records

```text
History:
  docs/operations/history-production-acceptance-2026-06-23.md
  accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel:
  docs/operations/channel-production-acceptance-2026-06-23.md
  accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
  closure PR: #408

Report & Export:
  docs/operations/report-export-consolidation-acceptance-2026-06-24.md
  closure PR: #413

Next-feature capability audit:
  docs/product/next-feature-data-capability-audit.md
  closure PR: #414

Local Watchlist v1:
  docs/product/local-watchlist-spec.md
  docs/product/watchlist-v1-implementation-plan.md
  docs/operations/watchlist-production-acceptance-2026-06-25.md
  accepted production SHA: f3e0ee8741e96015c5440df167574b8002fccc0d
  production acceptance run: 28166806560
  closure PR: #425
```

## 3. Current priority

Phase 6 — Local Watchlist v1 is complete after PR #425 merges and its full merge report is issued.

There is no automatically approved next major feature. The next branch must be selected from verified defects, maintenance, an explicitly approved roadmap item, or the pending History appearance revision after screenshots and detailed instructions are available.

Do not begin Session, Category/Game trends, Language trends, Event Layer, or Alerts without a new data-capability and product-scope approval.

## 4. Phase 6 — Local Watchlist v1 completion

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
W5B  production acceptance and documentation close completion PR #425
```

Accepted production identity:

```text
environment: production
branch: main
commit_sha: f3e0ee8741e96015c5440df167574b8002fccc0d
pages_url: https://2e557de7.viewloom.pages.dev
```

Accepted provider bindings:

```text
Twitch: DB_TWITCH_HOT -> vl_twitch_hot
Kick:   DB_KICK_HOT -> vl_kick_hot
```

Accepted machine-readable production evidence:

```text
schema: viewloom-watchlist-production-acceptance-v1
result: pass
scenarios: 6 / 6 pass
workflow run: 28166806560
artifact id: 7876704775
artifact digest: sha256:baad267afc68dca50ca08bf0227e8e0a1e46be3797965e9f982115f734cb5c33
```

Accepted request contract:

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined refresh:               1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

Accepted boundary:

- browser-local storage only;
- separate Twitch and Kick routes, storage, requests, facts, links, bindings, and counts;
- Watchlist remains a secondary utility outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete history;
- no exact sessions;
- no per-channel request loop;
- no login, cloud sync, or alerts;
- no Watchlist-specific API;
- no D1 write, migration, binding, collector, cron, retention, or rollup change;
- no History UI change.

## 5. Completed product phases

### Phase 1 — production baseline and accepted core

Completed. Includes Cloudflare production cutover, separate provider D1 bindings, deployment identity, explicit 404 behavior, permanent Production Smoke, and accepted Heatmap, Day Flow, Battle Lines, History, Status, and Channel cores.

### Phase 1B / 1C — History rebuild and acceptance

Completed on 2026-06-23. The pending History appearance revision remains separate and requires screenshots plus explicit instructions.

### Phase 2 — production P0/P1 repair window

Conditional maintenance phase. Enter only for a reproducible production defect, failed permanent gate, or explicit acceptance gap.

### Phase 3 — Channel / Streamer v1

Completed through PR #408 with provider-specific retained daily Top 10 footprint and no exact session claim.

### Phase 4 — Report & Export shared-layer consolidation

Completed through PR #413.

### Phase 5 — next-feature data-capability audit

Completed through PR #414. Local Watchlist was approved and is now complete. Other major feature candidates remain deferred.

### Phase 6 — Local Watchlist v1

Completed through PR #425 with local, hosted Preview, and production acceptance evidence.

## 6. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
- exact Session page or complete session history;
- on-demand multi-day raw JSON scans for session reconstruction;
- Category/Game trends before verified new collection and rollups;
- Language trends without a verified source and accuracy policy;
- Event Layer without an approved source and storage model;
- Alerts without persistent subscriptions and delivery infrastructure;
- cross-platform combined totals or rankings;
- login or cloud user accounts;
- AI-generated interpretation;
- multiple major expansions in parallel.

## 7. Roadmap update rule

Update this file when a phase begins or completes, a blocker changes priority, a feature is approved or deferred, or the pending History UI revision receives enough evidence to begin.
