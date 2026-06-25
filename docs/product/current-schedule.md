# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-25

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- W3A introduces visible provider routes but requires local responsive browser validation only; hosted Preview remains reserved for W5A.
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
Local Watchlist W3A                      completion candidate in PR #419
Local Watchlist W3B                      next, not started
History UI appearance revision           pending screenshots and instructions
```

After PR #419 merge, no implementation branch remains active until a new instruction.

Next approved work:

```text
Phase 6 — Local Watchlist v1
W3B — evidence cards and approved entry points
Branch: work-watchlist-w3b-ui
```

Governing records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
apps/web/docs/watchlist-latest-w2a-contract.md
apps/web/docs/watchlist-history-w2b-contract.md
docs/work-in-progress/watchlist-v1-working-note.md
```

## 3. W2B completion record

```text
branch: work-watchlist-w2b-history
PR: #418
Preview: not requested
public routes/UI: not added
API/DB/collector: not changed
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

Implemented contracts:

- schema `viewloom-watchlist-history-v1`;
- provider states `ready`, `partial`, `empty`, and `error`;
- retained states `present_retained`, `absent_usable`, `history_partial`, and `history_unavailable`;
- exact Twitch and Kick viewer-minutes History endpoints for `7d` and `30d`;
- validation of provider, period-day count, metric, and required payload arrays;
- one normalized period `topStreamers[]` index;
- one normalized `daily[].topStreamers[]` appearance index;
- one retained union index allowing daily-only retained presence;
- duplicate period ids keep their first occurrence;
- duplicate ids within one day keep their first occurrence;
- daily appearances are sorted newest first;
- viewer-minutes, peak, average, observed minutes, ranks, daily appearance count, and most recent appearance are retained when supplied;
- missing numeric facts remain `null` rather than zero;
- only complete `ready` data permits `absent_usable`;
- partial and demo data preserve matched facts but return `history_partial`;
- empty, error, unreadable, mismatch, request, HTTP, and JSON failures return `history_unavailable`;
- `7d` and `30d` History payloads are cached separately in page memory;
- Back/Forward period restore uses the cached period and makes no request;
- concurrent History refreshes for one period share one in-flight request;
- combined entries preserve independent `stored`, `latest`, and `retained` axes;
- latest failure does not remove retained evidence;
- History failure does not remove latest evidence.

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

- application TypeScript check passed;
- actual W1/W2A/W2B TypeScript sources were transpiled and imported;
- Twitch/Kick complete, partial, demo, empty, mismatch, malformed, duplicate, daily-only, top-only, and missing-number cases passed;
- all four retained evidence states passed;
- zero, one, and fifty-entry History and combined request counts passed;
- 7d/30d cache, Back/Forward restore, explicit refresh, in-flight deduplication, provider endpoint separation, and task-local zero-request behavior passed;
- request, HTTP, JSON, provider, period, and metric failures passed;
- latest/History failure isolation passed;
- dedicated `Watchlist History` workflow passed.

Not changed:

- `/twitch/watchlist/` or `/kick/watchlist/` public routes;
- HTML, CSS, or visible Watchlist UI;
- Channel or provider Home integration;
- existing Heatmap or History API response contracts;
- per-channel requests or polling;
- API implementation, D1, bindings, collectors, cron, or retention;
- History UI, DOM, or CSS.

## 4. W3A completion record

```text
branch: work-watchlist-w3a-routes
PR: #419
Preview: not requested
local responsive browser validation: required and passed
API/DB/collector: not changed
```

Routes and implementation files:

```text
apps/web/twitch/watchlist/index.html
apps/web/kick/watchlist/index.html
apps/web/src/live/watchlist-page.ts
apps/web/src/live/watchlist-move-focus.ts
apps/web/src/watchlist-page.css
apps/web/src/watchlist-touch.css
apps/web/src/provider-watchlist-link.css
apps/web/src/provider-home-shell.ts
apps/web/src/provider-home.ts
apps/web/vite.config.ts
```

Verification files:

```text
apps/web/scripts/verify-watchlist-page.mjs
apps/web/scripts/watchlist-shell-browser-core.mjs
apps/web/scripts/watchlist-shell-browser-fixture.mjs
apps/web/scripts/watchlist-shell-browser-narrow.mjs
.github/workflows/watchlist-page.yml
```

Implemented shell behavior:

- `/twitch/watchlist/` and `/kick/watchlist/` static routes;
- provider-specific title, canonical, Open Graph URL, and `noindex,follow`;
- existing masthead, provider breadcrumb, and unchanged primary feature tabs;
- Watchlist hero and explicit browser-local storage wording;
- provider, storage, key, period, latest, and retained fact/feedback regions;
- add by plain id or same-provider URL;
- invalid, wrong-provider, duplicate, limit, unavailable, corrupted, repaired, and write-error feedback;
- add, remove, move, clear, reset, filter, show-all/show-recent, and cross-tab updates;
- 7d/30d URL state with Back/Forward restoration;
- twelve entries initially visible and fifty-entry provider cap;
- provider Home secondary utility link after the core feature directory;
- keyboard focus restoration after add, remove, and move;
- explicit evidence placeholders with no data request until W3B.

Exact W3A request behavior:

```text
empty Watchlist:        0 Heatmap + 0 History
populated W3A shell:    0 Heatmap + 0 History
period change in W3A:   0 Heatmap + 0 History
Refresh data in W3A:    0 Heatmap + 0 History
```

Verification:

- application TypeScript check passed;
- exact route metadata and unchanged tab order passed;
- no saved ids exist in static HTML, metadata, or route URL state;
- no Heatmap/History endpoint, combined controller, global fetch, polling, service worker, or saved-id analytics behavior exists in the W3A controller;
- static route and storage-first shell verification passed;
- local desktop browser flow passed;
- local 360px responsive browser flow passed;
- screenshot and diagnostic artifacts were uploaded;
- dedicated `Watchlist Page` workflow passed;
- all affected and shared repository checks passed on the W3A head.

Not changed:

- feature-data connection or completed evidence cards;
- Channel `Save to Watchlist` action;
- primary feature tab order;
- existing Heatmap, Day Flow, Battle Lines, History, Status, or Channel behavior;
- API response schemas or endpoint meaning;
- D1, bindings, collectors, cron, retention, or rollups;
- History UI, DOM, or CSS.

## 5. W3B scope

W3B may add only the approved evidence and entry-point layer:

- connect the W2 combined latest/History controller to both provider routes;
- render independent latest and retained evidence per saved entry;
- implement loading, partial, stale, empty, error, present, and absent states;
- add explicit combined refresh and source-specific retry behavior;
- add provider-safe Watchlist card links;
- add `Save to Watchlist` / `Saved in Watchlist` on Twitch and Kick Channel pages;
- verify actual request counts and endpoint failure isolation in browser tests.

W3B boundaries:

- Watchlist remains outside the primary feature tabs;
- empty list remains zero requests;
- one through fifty nonempty entries remain one Heatmap plus one History request on initial load;
- uncached period change requests History only;
- cached period restore makes no request;
- task-local list operations make no feature-data request;
- Channel save makes no data request and is not a remove toggle;
- no authoritative offline or complete-history claim;
- no new API, D1, binding, collector, cron, retention, or rollup behavior.

W3B requires local browser verification. Hosted `preview-watchlist-v1` acceptance remains reserved for W5A.

## 6. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       completion candidate PR #419
W3B  evidence cards and approved entry points      next
W3C  responsive/accessibility candidate pass       queued
W4A  executable contract closure                   queued
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 7. Stop rule

Do not begin W3B before the PR #419 merge report is issued.
