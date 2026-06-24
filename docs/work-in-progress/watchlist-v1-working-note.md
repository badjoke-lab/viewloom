# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w2b-history`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. Completed foundation records

```text
W0  work-watchlist-w0            PR #415  permanent specification and plan
W1  work-watchlist-w1-storage    PR #416  local model, storage, and URL state
W2A work-watchlist-w2a-latest    PR #417  latest Heatmap adapter/request foundation
```

W1 fixed exact provider keys, versioned local documents, id/URL normalization, immutable list operations, duplicate and 50-entry behavior, recoverable storage states, provider-isolated clear/reset and storage-event parsing, and clean period URL state without saved ids.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, four latest evidence states, normalized id index, zero/one request behavior, cache reuse, explicit refresh, in-flight deduplication, provider separation, and neutral request failures.

## 2. W2B record

Branch and PR:

```text
work-watchlist-w2b-history
#418 Add Watchlist retained History foundation
```

Implementation files:

```text
apps/web/src/live/watchlist/history-model.ts
apps/web/src/live/watchlist/history-adapter.ts
apps/web/src/live/watchlist/history-controller.ts
apps/web/src/live/watchlist/combined-model.ts
apps/web/src/live/watchlist/combined-controller.ts
```

Contract and verification files:

```text
apps/web/docs/watchlist-history-w2b-contract.md
apps/web/scripts/verify-watchlist-history.mjs
apps/web/scripts/watchlist-history-fixtures.mjs
apps/web/scripts/watchlist-history-adapter-core-cases.mjs
apps/web/scripts/watchlist-history-adapter-error-cases.mjs
apps/web/scripts/watchlist-history-evidence-cases.mjs
apps/web/scripts/watchlist-history-controller-core-cases.mjs
apps/web/scripts/watchlist-history-controller-error-cases.mjs
apps/web/scripts/watchlist-combined-model-cases.mjs
apps/web/scripts/watchlist-combined-controller-core-cases.mjs
apps/web/scripts/watchlist-combined-controller-error-cases.mjs
.github/workflows/watchlist-history.yml
```

Implemented:

- schema `viewloom-watchlist-history-v1`;
- provider states `ready`, `partial`, `empty`, and `error`;
- retained evidence states `present_retained`, `absent_usable`, `history_partial`, and `history_unavailable`;
- exact Twitch and Kick History endpoints for 7d/30d viewer-minutes;
- provider, period-day count, metric, and payload-array validation;
- normalized period `topStreamers[]` index;
- normalized bounded `daily[].topStreamers[]` appearance index;
- retained union index from period and daily evidence;
- daily-only retained presence support;
- first duplicate period id retained;
- first duplicate id per day retained;
- newest-first daily appearances;
- retained viewer-minutes, peak, average, observed minutes, ranks, bounded appearance count, and most recent appearance when supplied;
- source flags for period summary and daily appearance presence;
- missing numeric facts remain `null` rather than zero;
- complete ready payload only permits absence conclusion;
- partial/demo payload keeps matched facts while returning `history_partial`;
- empty/error/mismatch/unreadable/request/HTTP/JSON failures return `history_unavailable`;
- independent 7d and 30d page-memory caches;
- cached Back/Forward period restore with no request;
- same-period in-flight request deduplication;
- combined entries with independent `stored`, `latest`, and `retained` axes;
- latest failure preserves retained evidence;
- History failure preserves latest evidence.

Exact request behavior:

```text
empty list:                  0 Heatmap + 0 History
nonempty initial load:       1 Heatmap + 1 History
uncached period change:      0 Heatmap + 1 History
cached period restore:       0 Heatmap + 0 History
explicit combined refresh:   1 Heatmap + 1 History
task-local list operations:  0 Heatmap + 0 History
```

Verification:

- application typecheck passed;
- actual W1/W2A/W2B TypeScript sources were transpiled and imported;
- Twitch/Kick complete, partial, demo, empty, malformed, mismatch, duplicate, top-only, daily-only, and missing-number payloads passed;
- all four retained states passed;
- zero, one, and fifty-entry History and combined request counts passed;
- 7d/30d cache, Back/Forward restore, task-local reuse, explicit refresh, and in-flight deduplication passed;
- request, HTTP, JSON, provider, period, and metric failure cases passed;
- latest/History failure isolation passed;
- source scans confirmed no global fetch, DOM, browser-storage, API implementation, or CSS dependency;
- dedicated `Watchlist History` workflow passed.

Not changed:

- public Watchlist routes, HTML, CSS, or visible UI;
- Channel or provider Home integration;
- existing Heatmap or History API response contracts;
- per-channel requests or polling;
- API implementation, D1, bindings, collectors, cron, or retention;
- History UI, DOM, or CSS.

## 3. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           complete PR #416
W2A latest adapter               complete PR #417
W2B History/combined foundation  completion candidate PR #418
W3A routes and shell             next, not started
W3B evidence UI/entry points     queued
W3C candidate polish             queued
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 4. W3A handoff

Planned branch:

```text
work-watchlist-w3a-routes
```

W3A may add only:

- `/twitch/watchlist/` and `/kick/watchlist/` provider routes;
- provider metadata, canonical URL, and `noindex,follow`;
- existing masthead, provider breadcrumb, and unchanged primary feature tabs;
- Watchlist hero and local-only explanation;
- provider/storage/source fact regions;
- add form and 7d/30d controls;
- separate storage/latest/History feedback regions;
- empty state, scope, evidence, privacy, and limitation copy;
- W1 storage and URL-state connection;
- provider Home secondary utility link permitted by the implementation plan;
- static and local responsive browser shell gates.

W3A must preserve:

- primary feature tabs remain Heatmap, Day Flow, Battle Lines, History, Status;
- Watchlist is not a primary feature tab;
- saved ids are never embedded in static HTML;
- empty Watchlist makes zero feature-data requests;
- feature-data requests may remain disabled or fixture-injected until W3B;
- Channel save action and evidence-card completion remain queued for W3B;
- no API, D1, binding, collector, cron, or retention change;
- no speculative History UI change.

## 5. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
