# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- W1 is a nonvisual foundation and does not require Preview.
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
Local Watchlist W1                       completion candidate in PR #416
Local Watchlist W2A                      next, not started
History UI appearance revision           pending screenshots and instructions
```

After PR #416 merge, no implementation branch remains active until a new instruction.

Next approved work:

```text
Phase 6 — Local Watchlist v1
W2A — latest Heatmap adapter and request foundation
Branch: work-watchlist-w2a-latest
```

Governing records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
docs/work-in-progress/watchlist-v1-working-note.md
```

## 3. W1 completion record

```text
branch: work-watchlist-w1-storage
PR: #416
Preview: not requested
public routes/UI: not added
network layer: not added
```

Files added:

```text
apps/web/src/live/watchlist/model.ts
apps/web/src/live/watchlist/storage.ts
apps/web/src/live/watchlist/url-state.ts
apps/web/scripts/verify-watchlist-storage.mjs
.github/workflows/watchlist-storage.yml
```

Implemented contracts:

- exact keys `viewloom.watchlist.twitch.v1` and `viewloom.watchlist.kick.v1`;
- provider, period, entry, document, and neutral operation-result types;
- plain id and same-provider Twitch/Kick URL normalization;
- invalid and cross-provider URL rejection;
- display-name cleanup and 100-code-point limit;
- immutable add, remove, move, and clear operations;
- duplicate preservation, new-entry top insertion, and 50-entry cap;
- missing, empty, ready, repaired, corrupted, unavailable, and write-error states;
- repair of normalized, invalid, duplicate, and excess entries;
- preservation of corrupted raw values;
- write-failure rollback to the last persisted document;
- provider-specific confirmed clear/reset;
- provider-isolated storage-event parsing;
- clean `period=7d|30d` URL state without ids, names, filters, order, or expansion state;
- no direct fetch, browser-storage global, DOM, API-path, or CSS dependency.

Verification:

- application TypeScript check passed;
- dedicated Watchlist Storage source and runtime contract passed;
- existing Web, History, Channel, Data Status, naming, policy, readiness, and output checks remained green.

Not changed:

- `/twitch/watchlist/` and `/kick/watchlist/` routes;
- HTML, CSS, or visible Watchlist UI;
- Heatmap or History adapters;
- Channel or provider Home integration;
- API, D1, bindings, collectors, cron, or retention.

## 4. W2A scope

W2A may add only:

- a neutral latest-observation model;
- Twitch/Kick Heatmap payload adapters;
- one normalized id index per payload;
- source, state, freshness, update time, coverage, viewers, title, and existing momentum preservation;
- zero-request empty-list behavior;
- exactly-one-Heatmap-request nonempty behavior;
- request injection, in-flight deduplication, and executable tests.

Required evidence states:

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

W2A must not add public routes, HTML, CSS, History adapters, combined evidence, per-channel requests, polling, Channel/Home integration, API schema, D1, binding, collector, cron, or retention changes.

## 5. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  completion candidate PR #416
W2A  latest Heatmap adapter/request foundation     next
W2B  History adapter and combined evidence         queued
W3A  provider routes and storage-first shell       queued
W3B  evidence cards and approved entry points      queued
W3C  responsive/accessibility candidate pass       queued
W4A  executable contract closure                   queued
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 6. Stop rule

Do not begin W2A before the PR #416 merge report is issued.
