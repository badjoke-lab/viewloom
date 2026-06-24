# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w1-storage`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. W0 record

Previous policy marker: Status: active W0 specification work
Branch: `work-watchlist-w0`
Closure PR: #415

W0 created the permanent specification and implementation plan and fixed provider-separated routes, local storage, request counts, evidence language, approved entry points, and W1–W5 slicing.

## 2. W1 record

Branch:

```text
work-watchlist-w1-storage
```

PR:

```text
#416 Add Local Watchlist storage foundation
```

Files added:

```text
apps/web/src/live/watchlist/model.ts
apps/web/src/live/watchlist/storage.ts
apps/web/src/live/watchlist/url-state.ts
apps/web/scripts/verify-watchlist-storage.mjs
.github/workflows/watchlist-storage.yml
```

Implemented:

- exact provider keys `viewloom.watchlist.twitch.v1` and `viewloom.watchlist.kick.v1`;
- versioned `viewloom-watchlist-v1` documents with revision 1;
- maximum 50 entries and initial-visible constant 12;
- plain id and same-provider URL normalization;
- invalid host, path, id, and cross-provider URL rejection;
- display-name cleanup and 100-code-point cap;
- immutable add, remove, move, and clear operations;
- duplicate preservation and top insertion;
- injected storage read, write, remove, and storage-event contracts;
- missing, empty, ready, repaired, corrupted, unavailable, and write-error handling;
- repair of normalized, invalid, duplicate, and excess entries;
- preservation of corrupted raw values;
- rollback to the last persisted document on normal write failure;
- confirmed provider-specific clear/reset;
- `period=7d|30d` parsing and clean URL serialization;
- removal of ids, names, filters, saved state, order, and expansion state from URLs.

Verification:

- application typecheck passed;
- actual TypeScript sources were transpiled and imported by the W1 verifier;
- normalization, 50-entry cap, duplicate, movement, removal, clear, reset, repair, corruption, read/write failure, provider isolation, storage events, and URL state passed;
- source scans confirmed no direct fetch, browser-storage global, DOM, API-path, or CSS dependency;
- dedicated `Watchlist Storage` workflow passed;
- existing repository regression checks passed on the accepted W1 candidate.

Not changed:

- public Watchlist routes or UI;
- HTML or CSS;
- Heatmap or History adapters;
- any production data request;
- Channel or provider Home integration;
- API, D1, bindings, collectors, cron, or retention.

## 3. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           completion candidate PR #416
W2A latest adapter               next, not started
W2B History adapter              queued
W3A routes and shell             queued
W3B evidence UI/entry points     queued
W3C candidate polish             queued
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 4. W2A handoff

Planned branch:

```text
work-watchlist-w2a-latest
```

W2A may add only:

- neutral latest-observation types;
- Twitch and Kick Heatmap adapters;
- normalized id indexes;
- source, state, freshness, update time, coverage, viewers, title, and existing momentum mapping;
- zero-request empty-list behavior;
- exactly-one-provider-Heatmap-request nonempty behavior;
- request injection, in-flight deduplication, and executable tests.

W2A must not add:

- public routes, HTML, CSS, or visible Watchlist UI;
- History adapter or retained evidence;
- Channel or Home integration;
- per-channel requests or polling;
- API schema, D1, binding, collector, cron, retention, or production route changes.

## 5. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
