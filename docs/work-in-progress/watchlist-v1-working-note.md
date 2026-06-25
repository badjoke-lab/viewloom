# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w3a-routes`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. Completed foundation records

```text
W0  work-watchlist-w0            PR #415  permanent specification and plan
W1  work-watchlist-w1-storage    PR #416  local model, storage, and URL state
W2A work-watchlist-w2a-latest    PR #417  latest Heatmap adapter/request foundation
W2B work-watchlist-w2b-history   PR #418  retained History and combined evidence
```

W1 fixed exact provider keys, versioned local documents, id/URL normalization, immutable list operations, duplicate and 50-entry behavior, recoverable storage states, provider-isolated clear/reset and storage-event parsing, and clean period URL state without saved ids.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, four latest evidence states, normalized id index, zero/one request behavior, cache reuse, explicit refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the neutral retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence axes, period-specific page-memory caches, exact request counts, and endpoint failure isolation.

## 2. W3A record

Branch and PR:

```text
work-watchlist-w3a-routes
#419 Add Local Watchlist provider route shells
```

Public routes and controller:

```text
apps/web/twitch/watchlist/index.html
apps/web/kick/watchlist/index.html
apps/web/src/live/watchlist-page.ts
apps/web/src/live/watchlist-move-focus.ts
```

Styles and provider Home integration:

```text
apps/web/src/watchlist-page.css
apps/web/src/watchlist-touch.css
apps/web/src/provider-watchlist-link.css
apps/web/src/provider-home-shell.ts
apps/web/src/provider-home.ts
```

Verification and workflow:

```text
apps/web/scripts/verify-watchlist-page.mjs
apps/web/scripts/watchlist-shell-browser-core.mjs
apps/web/scripts/watchlist-shell-browser-fixture.mjs
apps/web/scripts/watchlist-shell-browser-narrow.mjs
.github/workflows/watchlist-page.yml
```

Implemented:

- provider-separated `/twitch/watchlist/` and `/kick/watchlist/` routes;
- provider-specific title, canonical URL, Open Graph URL, and `noindex,follow` metadata;
- existing masthead, provider breadcrumb, and unchanged primary tabs in the order Heatmap, Day Flow, Battle Lines, History, Status;
- Watchlist hero and explicit browser-local storage explanation;
- provider, storage, key, period, latest-source, and retained-source fact regions;
- add form accepting a plain provider channel id or same-provider URL;
- duplicate, invalid id, wrong-provider URL, maximum-limit, unavailable, corrupted, repaired, and write-error feedback;
- provider-separated add, remove, move, clear, reset, local filter, show-all/show-recent, and cross-tab refresh behavior;
- 7d/30d URL state with pushState, popstate restore, and no saved ids in the URL;
- twelve-entry initial display and fifty-entry provider cap inherited from W1;
- empty, no-results, storage-error, and unavailable evidence-placeholder states;
- explicit W3A refresh messaging without feature-data requests;
- provider Home Local Watchlist utility after the core feature directory;
- Vite build inputs for both routes;
- keyboard focus restoration after add, remove, and move;
- responsive desktop and 360px local browser gates.

W3A request and privacy boundary:

```text
empty Watchlist:        0 Heatmap + 0 History
populated W3A shell:    0 Heatmap + 0 History
period change in W3A:   0 Heatmap + 0 History
Refresh data in W3A:    0 Heatmap + 0 History
```

W3A intentionally renders storage-first placeholders. The W2 combined controller is not connected until W3B. No saved ids are embedded in static HTML, canonical URLs, Open Graph URLs, or analytics payloads.

Verification:

- application typecheck passed;
- static route contract passed for both providers;
- exact canonical and `noindex,follow` metadata passed;
- unchanged primary feature tab order passed;
- static HTML contains no saved id or serialized local state;
- source scans confirmed no Heatmap/History endpoint, combined controller, global fetch, interval, service worker, or saved-id analytics behavior in the W3A controller;
- W1 storage operations, period URL state, and cross-tab refresh passed in the page shell;
- local desktop browser flow passed;
- local narrow 360px browser flow passed;
- screenshots and local preview diagnostics were retained by the `Watchlist Page` workflow;
- Web build, Web checks, Web verification, Development policy, naming, canonical, readiness, Status, History, Channel, and shared-output workflows passed on the W3A head.

Not changed:

- W2 latest, retained History, or combined evidence contracts;
- completed evidence cards or live feature-data connection;
- Channel `Save to Watchlist` action;
- primary feature navigation;
- existing Heatmap, Day Flow, Battle Lines, History, Status, or Channel behavior;
- API response schemas or endpoint meaning;
- D1, bindings, collectors, cron, raw retention, or daily rollups;
- per-channel requests, polling, accounts, cloud sync, or alerts;
- History UI, DOM, or CSS.

## 3. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           complete PR #416
W2A latest adapter               complete PR #417
W2B History/combined foundation  complete PR #418
W3A routes and shell             completion candidate PR #419
W3B evidence UI/entry points     next, not started
W3C candidate polish             queued
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 4. W3B handoff

Planned branch:

```text
work-watchlist-w3b-ui
```

W3B may add only:

- connection of the existing W2 combined controller to both provider Watchlist routes;
- independent latest and retained evidence in each saved-channel card;
- loading, present, stale, partial, absent, empty, error, and retry states using the permanent exact wording;
- explicit combined refresh and source-specific retry behavior;
- provider-safe `Open Channel` and external provider links;
- additive `Save to Watchlist` / `Saved in Watchlist` action on Twitch and Kick Channel pages;
- browser verification of exact initial, period, refresh, retry, and Channel-save request counts.

W3B must preserve:

- one through fifty saved entries use one Heatmap plus one History request on nonempty initial load;
- empty Watchlist uses zero feature-data requests;
- period change requests History only when that period is not already in page memory;
- task-local add, remove, move, filter, and display operations make no feature-data request;
- latest and History failures remain independent;
- Channel save makes no History, Heatmap, or other data request;
- absence is not presented as authoritative offline status;
- retained History is not presented as complete channel history;
- Watchlist remains outside the primary feature tabs;
- no API, D1, binding, collector, cron, or retention change.

## 5. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
