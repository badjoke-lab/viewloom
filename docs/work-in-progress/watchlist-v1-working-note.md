# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w2a-latest`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. W0 record

```text
branch: work-watchlist-w0
PR: #415
```

W0 created the permanent product specification and implementation plan and fixed provider-separated routes, local storage, request counts, evidence language, approved entry points, and W1–W5 slicing.

## 2. W1 record

```text
branch: work-watchlist-w1-storage
PR: #416 Add Local Watchlist storage foundation
```

W1 added:

```text
apps/web/src/live/watchlist/model.ts
apps/web/src/live/watchlist/storage.ts
apps/web/src/live/watchlist/url-state.ts
apps/web/scripts/verify-watchlist-storage.mjs
.github/workflows/watchlist-storage.yml
```

W1 fixed exact provider keys, versioned local documents, id/URL normalization, immutable list operations, duplicate and 50-entry behavior, recoverable storage states, provider-isolated clear/reset and storage-event parsing, and clean period URL state without saved ids.

## 3. W2A record

Branch and PR:

```text
work-watchlist-w2a-latest
#417 Add Watchlist latest observation foundation
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

Implemented:

- schema `viewloom-watchlist-latest-v1`;
- provider states `live`, `partial`, `stale`, `empty`, and `error`;
- freshness `fresh`, `stale`, and `unavailable`;
- per-entry states `present_fresh`, `present_stale`, `absent_usable`, and `latest_unavailable`;
- exact provider endpoints `/api/twitch-heatmap` and `/api/kick-heatmap`;
- direct Twitch and Kick `items[]` payload normalization;
- Twitch nested `latest.payload_json` compatibility fallback;
- one normalized `ReadonlyMap` id index per response;
- preservation of provider source, target source, raw state, update time, coverage, id, display name, viewers, title, momentum, URL, and start timestamp when supplied;
- missing numeric values remain `null` rather than zero;
- invalid ids are ignored and duplicate response ids keep the first occurrence;
- zero request for an empty valid-entry list;
- exactly one provider Heatmap request for one through fifty entries;
- cached snapshot reuse for repeated load and task-local list changes;
- one new provider request for explicit refresh;
- in-flight deduplication for concurrent load/refresh;
- neutral request, HTTP, JSON, provider-mismatch, and unreadable-payload failure states;
- no global fetch, DOM, browser-storage, History, API implementation, or CSS dependency.

Verification:

- application typecheck passed;
- actual W1/W2A TypeScript sources were transpiled and imported;
- direct, nested, fresh, partial, stale, empty, invalid, duplicate, missing-number, and mismatch payload cases passed;
- all four latest evidence states passed;
- zero, one, and fifty-entry request counts passed;
- cache reuse, explicit refresh, in-flight deduplication, endpoint separation, HTTP failure, JSON failure, and request failure passed;
- dedicated `Watchlist Latest` workflow passed.

Not changed:

- public Watchlist routes, HTML, CSS, or visible UI;
- History adapters, retained evidence, or combined evidence;
- Channel or provider Home integration;
- existing Heatmap API response contracts;
- per-channel requests or polling;
- API, D1, bindings, collectors, cron, or retention.

## 4. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           complete PR #416
W2A latest adapter               completion candidate PR #417
W2B History adapter              next, not started
W3A routes and shell             queued
W3B evidence UI/entry points     queued
W3C candidate polish             queued
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 5. W2B handoff

Planned branch:

```text
work-watchlist-w2b-history
```

W2B may add only:

- neutral retained-History types;
- Twitch and Kick History adapters for 7d and 30d viewer-minutes payloads;
- `topStreamers[]` and retained daily streamer-row indexes;
- retained summary and most-recent retained appearance derivation;
- states `present_retained`, `absent_usable`, `history_partial`, and `history_unavailable`;
- combined storage/latest/retained evidence without collapsing axes;
- exact initial-load, period-change, explicit refresh, cache, Back/Forward, and failure-isolation request tests.

W2B must not add:

- public routes, HTML, CSS, or visible Watchlist UI;
- Channel or Home integration;
- per-channel requests or polling;
- API schema, D1, binding, collector, cron, retention, or production-route changes.

## 6. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
