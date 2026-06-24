# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- W2B is a nonvisual adapter/model/request foundation and does not require Preview.
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
Local Watchlist W2B                      completion candidate in PR #418
Local Watchlist W3A                      next, not started
History UI appearance revision           pending screenshots and instructions
```

After PR #418 merge, no implementation branch remains active until a new instruction.

Next approved work:

```text
Phase 6 — Local Watchlist v1
W3A — provider routes and storage-first shell
Branch: work-watchlist-w3a-routes
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

## 4. W3A scope

W3A may add only the provider-separated storage-first route shell:

- `/twitch/watchlist/` and `/kick/watchlist/` static routes;
- provider metadata, canonical URL, and `noindex,follow`;
- existing masthead, provider breadcrumb, and unchanged primary feature tabs;
- Watchlist hero and local-only storage explanation;
- provider/storage/source fact regions;
- add form, 7d/30d period controls, and separate feedback regions;
- empty state, scope, evidence, privacy, and limitation copy;
- W1 storage and URL-state connection;
- provider Home secondary utility link as allowed by the implementation plan;
- static and local browser shell gates.

W3A boundaries:

- Watchlist is not added to the primary feature tabs;
- the existing primary order remains Heatmap, Day Flow, Battle Lines, History, Status;
- no saved ids are embedded in HTML;
- empty Watchlist performs zero feature-data requests;
- live feature-data requests may remain disabled or fixture-injected until W3B;
- Channel save actions and evidence-card rendering remain queued for W3B;
- no API, D1, binding, collector, cron, or retention change.

Because W3A introduces visible routes, it requires responsive local browser validation. Hosted `preview-watchlist-v1` acceptance remains reserved for W5A unless a verified blocker requires an earlier deliberate Preview.

## 5. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         completion candidate PR #418
W3A  provider routes and storage-first shell       next
W3B  evidence cards and approved entry points      queued
W3C  responsive/accessibility candidate pass       queued
W4A  executable contract closure                   queued
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 6. Stop rule

Do not begin W3A before the PR #418 merge report is issued.
