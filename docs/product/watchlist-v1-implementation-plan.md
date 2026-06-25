# ViewLoom Local Watchlist v1 implementation plan

Status: active implementation plan
Version: 1.1
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1
Permanent specification: `local-watchlist-spec.md`
Capability authority: `next-feature-data-capability-audit.md`
Active working note: `../work-in-progress/watchlist-v1-working-note.md`

## 1. Objective

Implement and accept provider-specific, login-free Local Watchlist routes using only:

```text
provider-separated browser localStorage
one existing provider Heatmap response
one existing provider History response
```

The implementation must preserve:

- separate Twitch and Kick data and storage;
- the existing five-minute collectors and retention policy;
- existing API schemas and request meaning;
- existing Heatmap, Day Flow, Battle Lines, History, Channel, Home, and Status behavior;
- the rule that absence is not proof of offline status;
- the rule that retained History is not complete channel history.

## 2. Implemented architecture

Runtime ownership:

```text
apps/web/src/live/watchlist/model.ts                 provider and entry model
apps/web/src/live/watchlist/storage.ts               local storage contract
apps/web/src/live/watchlist/url-state.ts             period URL state
apps/web/src/live/watchlist/latest-model.ts          latest evidence model
apps/web/src/live/watchlist/latest-adapter.ts        Heatmap normalization
apps/web/src/live/watchlist/latest-controller.ts     latest cache/request lifecycle
apps/web/src/live/watchlist/history-model.ts         retained evidence model
apps/web/src/live/watchlist/history-adapter.ts       History normalization
apps/web/src/live/watchlist/history-controller.ts    period cache/request lifecycle
apps/web/src/live/watchlist/combined-model.ts        independent evidence axes
apps/web/src/live/watchlist/combined-controller.ts   combined action lifecycle
apps/web/src/live/watchlist-page.ts                   Watchlist DOM and interactions
apps/web/src/live/channel-watchlist.ts                Channel save/read action
apps/web/src/watchlist-page.css                       base Watchlist layout
apps/web/src/watchlist-touch.css                      touch/focus support
apps/web/src/watchlist-evidence.css                   evidence-state presentation
apps/web/src/channel-watchlist.css                    Channel action presentation
apps/web/twitch/watchlist/index.html                  Twitch route
apps/web/kick/watchlist/index.html                    Kick route
```

Verification ownership:

```text
apps/web/scripts/verify-watchlist-storage.mjs
apps/web/scripts/verify-watchlist-latest.mjs
apps/web/scripts/verify-watchlist-history.mjs
apps/web/scripts/verify-watchlist-page.mjs
apps/web/scripts/watchlist-shell-browser-fixture.mjs
apps/web/scripts/watchlist-shell-browser-core.mjs
apps/web/scripts/watchlist-shell-browser-narrow.mjs
.github/workflows/watchlist-storage.yml
.github/workflows/watchlist-latest.yml
.github/workflows/watchlist-history.yml
.github/workflows/watchlist-page.yml
```

Ownership rules:

- model and adapter files have no DOM or storage mutation;
- storage owns parse, validate, repair, read, write, remove, and storage-event handling;
- URL state owns only `period=7d|30d`; saved ids and filters never enter the URL;
- latest and History controllers own one-response caches and injected request functions;
- combined controller coordinates initial load, period change, refresh, retries, and task-local reuse;
- Watchlist page owns rendering, focus, feedback, list operations, and provider-safe links;
- Channel action owns local save/read state only and makes no data request.

## 3. PR and branch sequence

```text
W0   work-watchlist-w0
W1   work-watchlist-w1-storage
W2A  work-watchlist-w2a-latest
W2B  work-watchlist-w2b-history
W3A  work-watchlist-w3a-routes
W3B  work-watchlist-w3b-ui
W3C  work-watchlist-w3c-candidate
W4A  work-watchlist-w4-contracts
W4B  work-watchlist-w4-browser
W5A  work-watchlist-w5-hosted
     preview-watchlist-v1
W5B  work-watchlist-w5-production
```

Current implementation position:

```text
W0   complete PR #415
W1   complete PR #416
W2A  complete PR #417
W2B  complete PR #418
W3A  complete PR #419
W3B  completion candidate PR #420
W3C  next after PR #420 merge report
```

Each merged PR requires the full merge report and a new explicit proceed instruction before the next branch begins.

## 4. W0 — specification and implementation plan

Branch: `work-watchlist-w0`

Completed through PR #415.

Scope:

- permanent Watchlist specification;
- PR-sliced implementation plan;
- active temporary working note;
- roadmap, schedule, index, and policy governance;
- no runtime code.

## 5. W1 — local state and storage foundation

Branch: `work-watchlist-w1-storage`

Completed through PR #416.

Contracts:

```text
WatchlistProvider = twitch | kick
WatchlistPeriod = 7d | 30d
WatchlistStorageState = ready | repaired | empty | unavailable | corrupted | write_error
WatchlistEntry = channelId + displayName + addedAt
WatchlistDocument = schema + provider + revision + updatedAt + ordered entries
```

Implemented:

- exact provider key names;
- plain id and same-provider URL normalization;
- cross-provider and invalid input rejection;
- duplicate behavior and fifty-entry cap;
- new-entry top insertion and deterministic move/remove/clear/reset;
- corrupt, unavailable, repair, and write-error states;
- same-origin storage-event parsing;
- clean period URL state;
- no fetch or DOM dependency.

## 6. W2A — latest-observation foundation

Branch: `work-watchlist-w2a-latest`

Completed through PR #417.

Latest states:

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

Implemented:

- Twitch and Kick Heatmap normalization;
- provider state, update time, coverage, id, viewers, title, momentum, and URL retention;
- one normalized id index per response;
- missing numeric values remain unavailable rather than zero;
- empty list zero requests;
- one through fifty entries exactly one provider Heatmap request;
- cache reuse, explicit refresh, and in-flight deduplication;
- no route, UI, History interpretation, per-channel request, or polling.

## 7. W2B — retained-History and combined evidence foundation

Branch: `work-watchlist-w2b-history`

Completed through PR #418.

Retained states:

```text
present_retained
absent_usable
history_partial
history_unavailable
```

Implemented:

- Twitch and Kick History normalization for 7d and 30d;
- period Top Streamer, daily appearance, and retained union indexes;
- viewer-minutes, peak, average, observed minutes, ranks, daily count, and recent appearance retention;
- missing values remain null rather than zero;
- separate 7d and 30d page-memory caches;
- independent `stored`, `latest`, and `retained` evidence axes;
- latest and History failure isolation;
- exact initial, period, cached restore, refresh, and task-local request lifecycle;
- no route, UI, API, D1, or History visual change.

## 8. W3A — provider routes and storage-first shell

Branch: `work-watchlist-w3a-routes`

Completed through PR #419.

Implemented:

- `/twitch/watchlist/` and `/kick/watchlist/`;
- provider title, canonical, Open Graph URL, and `noindex,follow`;
- existing masthead, breadcrumb, and unchanged primary feature tabs;
- browser-local storage disclosure;
- provider, storage, key, period, latest, and retained regions;
- add, remove, move, clear, reset, filter, show all/recent, and cross-tab behavior;
- 7d/30d URL state with Back/Forward restoration;
- twelve initially visible entries and fifty-entry cap;
- provider Home secondary utility link;
- keyboard focus and desktop/360px local browser gates;
- no feature-data request in W3A.

### W3A completion criteria

- routes build and load locally;
- storage behavior is keyboard-operable;
- empty and storage-error states use permanent wording;
- saved ids do not enter metadata or URLs;
- no D1, API, collector, cron, retention, or History visual change;
- no hosted Preview.

## 9. W3B — evidence cards and approved entry points

Branch: `work-watchlist-w3b-ui`

Completion candidate in PR #420.

Implemented:

- W2 combined controller connected to both provider routes;
- independent latest and retained evidence per saved entry;
- loading, present, stale, partial, absent, empty, error, and retry states;
- combined `Refresh data` and source-specific retries;
- provider-safe external, Channel, History, and Heatmap links;
- API display names used for current rendering without overwriting stored names;
- additive `Save to Watchlist` / `Saved in Watchlist` action on Twitch and Kick Channel pages;
- deterministic desktop and 360px browser fixtures and artifacts.

Exact labels:

```text
In latest observed set
In latest available observed set
Provider data is stale
Not in latest observed set
Not confirmed offline
Latest observation unavailable
Present in retained History result
Not in retained History result
No complete history is implied
Retained History is partial
Retained History unavailable
```

Exact request contract:

```text
empty initial load             0 Heatmap + 0 History
nonempty initial load          1 Heatmap + 1 History
uncached period change         0 Heatmap + 1 History
cached period restore          0 Heatmap + 0 History
combined refresh               1 Heatmap + 1 History
Retry latest                   1 Heatmap + 0 History
Retry History                  0 Heatmap + 1 History
task-local list operations     0 Heatmap + 0 History
Channel save                   0 additional requests
```

Channel rules:

- valid unsaved Channel shows `Save to Watchlist`;
- saved Channel shows `Saved in Watchlist` linking to management;
- missing or invalid id disables the action;
- save makes no History, Heatmap, or other request;
- saved action is not a remove toggle;
- existing Channel URL, task, report, export, and one-History-request contract remain unchanged.

### W3B completion criteria

- one and fifty entries use identical initial request counts;
- uncached/cached period behavior is exact;
- source-specific retries request only their source;
- endpoint failures remain isolated;
- all exact limitation labels render;
- Channel save makes no additional request;
- desktop and 360px browser gates pass;
- no API, D1, binding, collector, cron, retention, rollup, or History visual change.

## 10. W3C — responsive, visual, and accessibility candidate pass

Branch: `work-watchlist-w3c-candidate`

State: next after PR #420 merge report.

Scope:

- final dark-theme visual hierarchy after functionality is complete;
- desktop, tablet, 390px, and 360px compositions;
- long content, storage/data messages, and destructive action placement;
- focus, keyboard, live-region, touch-target, symbol, and reduced-motion behavior;
- local full-page artifacts for both providers and key evidence states;
- no serialized, storage, request, API, or product-contract change.

Required artifact matrix:

```text
Twitch desktop 1440 — populated mixed evidence
Twitch tablet 820 — storage controls and reordered list
Twitch mobile 390 — populated, latest absent, retained present
Kick desktop 1440 — populated partial/candidate coverage
Kick mobile 390 — empty state
Kick mobile 360 — storage error and long id/name wrapping
```

## 11. W4A — executable contract closure

Branch: `work-watchlist-w4-contracts`

Scope:

- consolidate storage, adapter, request, wording, route, SEO, privacy, provider-separation, and Channel-integration checks;
- prevent Watchlist-specific API, D1, KV, R2, collector, cron, service worker, interval polling, and analytics-id leakage;
- require permanent labels and key names;
- verify saved ids are absent from URLs and metadata;
- verify core feature tabs remain unchanged;
- verify Development policy governance.

## 12. W4B — complete local browser candidate QA

Branch: `work-watchlist-w4-browser`

Scope:

- integrated deterministic browser flow;
- storage reload and cross-tab behavior;
- Back/Forward, periods, refresh, retries, and focus;
- desktop/tablet/mobile artifacts and machine-readable evidence;
- full affected and shared regression matrix;
- candidate freeze for hosted acceptance.

## 13. W5A — hosted Preview acceptance

Implementation branch: `work-watchlist-w5-hosted`

Approved hosted branch: `preview-watchlist-v1`

Scope:

- deploy only the complete W4 candidate;
- verify exact Preview SHA and Pages Functions;
- probe separate Twitch and Kick bindings;
- seed localStorage without server mutation;
- verify real-data mixed states, request counts, routes, and artifacts;
- no D1 writes, migrations, collectors, retention, or new feature scope.

## 14. W5B — production acceptance and documentation closure

Branch: `work-watchlist-w5-production`

Scope:

- merge accepted candidate to `main`;
- verify exact production deployment identity;
- verify routes, metadata, APIs, storage, Channel/Home entry points, request counts, and responsive behavior;
- retain production artifacts;
- record permanent acceptance SHA and workflow evidence;
- update roadmap, schedule, specification, and plan status;
- delete and unlink the temporary Watchlist working note;
- retain permanent regression workflows.

## 15. Preview policy

```text
W0-W4: no hosted Preview required
W5A: deliberate preview-watchlist-v1 hosted acceptance required
W5B: exact production acceptance required
```

## 16. Cross-cutting regression matrix

At candidate closure, run at minimum:

- Development policy;
- Web build, checks, and verification;
- provider naming and coverage contracts;
- Data Status page and browser;
- History Overview, Archives, Calendar, Peaks, Battles, comparisons, report, export, and browser gates;
- Channel profile, overview, report, candidate, and browser gates;
- shared output contracts;
- all Watchlist storage, latest, History, page, request, and browser gates.

A pre-existing flaky browser gate may be rerun only on the exact same head with no code change and must be reported explicitly.

## 17. Scope-change rule

Stop and update the permanent specification before implementation when a branch would require:

- a Watchlist-specific server API;
- D1/KV/R2 user storage;
- login or cloud sync;
- background polling or alerts;
- a new collector field or cadence;
- category/language/session claims;
- cross-provider identity or totals;
- more than one Heatmap and one History request per provider load;
- per-channel requests;
- changing existing provider API schemas;
- inserting Watchlist as a primary visualization tab.

## 18. Final stop rule

After each PR merge:

1. issue the full merge report;
2. state the exact current phase and next branch;
3. stop;
4. do not create the next branch until the user explicitly instructs continuation.
