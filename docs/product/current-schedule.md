# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- W2A is a nonvisual adapter/request foundation and does not require Preview.
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
Local Watchlist W2A                      completion candidate in PR #417
Local Watchlist W2B                      next, not started
History UI appearance revision           pending screenshots and instructions
```

After PR #417 merge, no implementation branch remains active until a new instruction.

Next approved work:

```text
Phase 6 — Local Watchlist v1
W2B — History adapter and combined evidence model
Branch: work-watchlist-w2b-history
```

Governing records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
apps/web/docs/watchlist-latest-w2a-contract.md
docs/work-in-progress/watchlist-v1-working-note.md
```

## 3. W2A completion record

```text
branch: work-watchlist-w2a-latest
PR: #417
Preview: not requested
public routes/UI: not added
History adapter: not added
```

Files added:

```text
apps/web/src/live/watchlist/latest-model.ts
apps/web/src/live/watchlist/latest-adapter.ts
apps/web/src/live/watchlist/latest-controller.ts
apps/web/docs/watchlist-latest-w2a-contract.md
apps/web/scripts/verify-watchlist-latest.mjs
apps/web/scripts/watchlist-latest-adapter-cases.mjs
apps/web/scripts/watchlist-latest-controller-cases.mjs
.github/workflows/watchlist-latest.yml
```

Implemented contracts:

- schema `viewloom-watchlist-latest-v1`;
- provider states `live`, `partial`, `stale`, `empty`, and `error`;
- freshness `fresh`, `stale`, or `unavailable`;
- per-entry states `present_fresh`, `present_stale`, `absent_usable`, and `latest_unavailable`;
- exact endpoints `/api/twitch-heatmap` and `/api/kick-heatmap`;
- direct Twitch/Kick `items[]` response normalization;
- Twitch nested `latest.payload_json` compatibility fallback;
- one normalized `ReadonlyMap` id index per response;
- provider, source, target source, raw state, update time, coverage mode/note, id, display name, viewers, title, momentum, URL, and start timestamp preservation;
- missing numeric values remain `null` rather than zero;
- invalid response ids are ignored and duplicate ids keep the first occurrence;
- empty valid-entry list makes zero requests;
- one through fifty entries make exactly one provider Heatmap request;
- repeated load/add/remove/reorder/filter rendering reuses the cached snapshot;
- explicit refresh makes one new provider request;
- concurrent load/refresh calls share the current in-flight request;
- HTTP, JSON, request, provider-mismatch, and unreadable-payload failures return neutral latest-unavailable evidence;
- request failure does not mutate Watchlist entries or storage.

Verification:

- application TypeScript check passed;
- actual W1/W2A TypeScript sources were transpiled and imported;
- direct, nested, fresh, partial, stale, empty, invalid, mismatch, duplicate, and missing-number payload cases passed;
- all four latest evidence states passed;
- zero, one, and fifty-entry request counts passed;
- cache reuse, explicit refresh, in-flight deduplication, provider endpoint separation, HTTP failure, JSON failure, and request failure passed;
- dedicated `Watchlist Latest` workflow passed.

Not changed:

- `/twitch/watchlist/` or `/kick/watchlist/` public routes;
- HTML, CSS, or visible Watchlist UI;
- History adapters or retained evidence;
- combined latest/History model;
- Channel or provider Home integration;
- global polling or per-channel requests;
- existing Heatmap API response contracts;
- API, D1, bindings, collectors, cron, or retention.

## 4. W2B scope

W2B may add only:

- neutral retained-History evidence types;
- Twitch `/api/history?period=<7d|30d>&metric=viewer_minutes` adapter;
- Kick `/api/kick-history?period=<7d|30d>&metric=viewer_minutes` adapter;
- normalized indexes for `topStreamers[]` and retained daily streamer rows;
- retained summary and most-recent retained appearance derivation;
- retained states `present_retained`, `absent_usable`, `history_partial`, and `history_unavailable`;
- a combined storage/latest/retained model that keeps evidence axes independent;
- initial-load, period-change, refresh, cache, failure-isolation, and exact request-count tests.

Required request behavior:

```text
empty list:                  0 Heatmap + 0 History
nonempty initial load:       1 Heatmap + 1 History
period change:               0 Heatmap + 1 History
explicit combined refresh:   1 Heatmap + 1 History
add/remove/reorder/filter:    0 requests
```

W2B must not add public routes, HTML, CSS, visible UI, Channel/Home integration, per-channel requests, polling, API schema, D1, binding, collector, cron, or retention changes.

## 5. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     completion candidate PR #417
W2B  History adapter and combined evidence         next
W3A  provider routes and storage-first shell       queued
W3B  evidence cards and approved entry points      queued
W3C  responsive/accessibility candidate pass       queued
W4A  executable contract closure                   queued
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 6. Stop rule

Do not begin W2B before the PR #417 merge report is issued.
