# ViewLoom Local Watchlist v1 implementation plan

Status: active implementation plan
Version: 1.0
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

## 2. Fixed implementation architecture

### 2.1 Expected new files

The exact file split may be adjusted only when a branch audit proves a better location, but the ownership boundaries are fixed.

```text
apps/web/src/live/watchlist/model.ts
apps/web/src/live/watchlist/storage.ts
apps/web/src/live/watchlist/url-state.ts
apps/web/src/live/watchlist/latest-adapter.ts
apps/web/src/live/watchlist/history-adapter.ts
apps/web/src/live/watchlist/request-controller.ts
apps/web/src/live/watchlist-page.ts
apps/web/src/live/channel-watchlist.ts
apps/web/src/watchlist-page.css
apps/web/twitch/watchlist/index.html
apps/web/kick/watchlist/index.html
```

Expected verification files:

```text
apps/web/scripts/verify-watchlist-storage.mjs
apps/web/scripts/verify-watchlist-data.mjs
apps/web/scripts/verify-watchlist-page.mjs
apps/web/scripts/watchlist-browser.mjs
.github/workflows/watchlist-storage.yml
.github/workflows/watchlist-data.yml
.github/workflows/watchlist-page.yml
.github/workflows/watchlist-browser.yml
```

### 2.2 Ownership boundaries

`model.ts` owns:

- provider and entry types;
- normalized ids;
- document and evidence-state types;
- deterministic list operations;
- no browser globals and no fetch.

`storage.ts` owns:

- provider key selection;
- parse, validate, repair, read, write, remove, and storage-event handling;
- no API access and no UI wording beyond neutral result codes.

`url-state.ts` owns:

- `period=7d|30d` parsing and serialization;
- history push/replace/pop behavior;
- no saved ids or filters in the URL.

`latest-adapter.ts` owns:

- Twitch and Kick Heatmap payload normalization;
- latest provider state and id-index creation;
- no storage mutation and no History interpretation.

`history-adapter.ts` owns:

- provider History payload normalization;
- period summary and retained daily id-index creation;
- no storage mutation and no latest-presence interpretation.

`request-controller.ts` owns:

- initial two-request coordination for a nonempty list;
- empty-list zero-request behavior;
- History-only period refresh;
- explicit combined refresh;
- in-flight deduplication and independent error state;
- no per-channel fetch.

`watchlist-page.ts` owns:

- DOM binding and rendering;
- focus and feedback behavior;
- add/remove/reorder/filter/show/reset interactions;
- provider-safe link construction;
- no direct D1 or provider API logic outside adapters.

`channel-watchlist.ts` owns:

- Channel page save/read state only;
- no new Channel History request;
- no removal toggle and no change to Channel task state.

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
W3A  completion candidate PR #419
W3B  next after PR #419 merge report
```

Each merged PR requires the full merge report and a new explicit proceed instruction before the next branch begins.

## 4. W0 — specification and implementation plan

Branch:

```text
work-watchlist-w0
```

Scope:

- create the permanent Watchlist specification;
- create this PR-sliced implementation plan;
- create and register the active temporary working note;
- update roadmap, schedule, documentation index, and Development policy verification;
- set W1 as next without adding runtime code.

Must not change:

- public routes or HTML;
- localStorage runtime;
- APIs, D1, bindings, collectors, cron, or retention;
- existing feature UI or behavior.

Acceptance:

- permanent spec contains every W0 freeze item;
- implementation sequence and stop rules are explicit;
- Development policy gate requires the new documents and active note;
- final diff is documentation and policy verification only;
- required repository checks pass;
- Preview is not requested.

## 5. W1 — local state and storage foundation

Branch:

```text
work-watchlist-w1-storage
```

Primary scope:

- create pure Watchlist model types and deterministic operations;
- implement provider-separated v1 storage keys;
- implement id/URL normalization;
- implement parse, validation, repair, deduplication, cap, and result codes;
- implement add, remove, move, clear, and reset operations;
- implement same-origin cross-tab storage-event handling;
- implement period URL-state helper;
- add executable storage/state contract gates.

No public Watchlist route is added in W1.

### Required model contracts

```text
WatchlistProvider = twitch | kick
WatchlistPeriod = 7d | 30d
WatchlistStorageState = ready | repaired | empty | unavailable | corrupted | write_error
WatchlistEntry = channelId + displayName + addedAt
WatchlistDocument = schema + provider + revision + updatedAt + ordered entries
```

### Required operation results

Neutral codes include at minimum:

```text
ok
invalid-id
wrong-provider-url
already-saved
limit-reached
not-found
storage-unavailable
storage-corrupted
write-failed
confirmation-required
```

Visible wording remains page-owned.

### W1 tests

- exact provider key names;
- plain id, Twitch URL, Kick URL, query/fragment/trailing slash normalization;
- cross-provider URL rejection;
- invalid host/path/id rejection;
- Unicode display name retention and control stripping;
- duplicate behavior;
- 50-entry cap;
- new-entry top insertion;
- move first/last and ordinary reorder;
- provider-specific clear;
- corrupt JSON and wrong schema/provider/revision;
- repair invalid/duplicate/excess entries;
- read and write exceptions;
- no cross-provider mutation;
- storage-event parsing;
- URL default and Back/Forward period behavior;
- no fetch or DOM dependency in the model/storage layer.

### W1 completion criteria

- no public route, HTML, CSS, or data request exists;
- storage contract is executable and deterministic;
- no server storage or new dependency is introduced;
- all existing checks remain green.

## 6. W2A — latest-observation adapter and request foundation

Branch:

```text
work-watchlist-w2a-latest
```

Primary scope:

- normalize existing Twitch and Kick Heatmap responses into one neutral Watchlist latest-evidence model;
- preserve provider source, state, freshness, update time, coverage note, id, viewers, title when supplied, and momentum when supplied;
- create normalized id index once per response;
- add the empty-list zero-request and nonempty latest-request controller foundation;
- add request injection seams for browser tests;
- add executable adapter and request-count tests.

No public Watchlist route is added in W2A.

### Required latest states

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

Mapping rules:

- fresh/live payload plus id match -> `present_fresh`;
- stale payload plus id match -> `present_stale`;
- usable live/partial/stale payload plus no id match -> `absent_usable` with no zero viewers;
- empty/error/unreadable payload -> `latest_unavailable`;
- API `live` is provider payload freshness and must not become authoritative channel `Live` wording.

### W2A request tests

- zero entries -> zero Heatmap requests;
- nonempty entries -> exactly one provider Heatmap request;
- 1 and 50 entries have the same request count;
- repeated render/filter/reorder does not fetch;
- concurrent refresh click is deduplicated;
- Twitch never calls Kick endpoint and vice versa;
- failure returns neutral latest error while retaining storage state.

### W2A completion criteria

- no History adapter yet;
- no public route or visible UI;
- no per-channel requests;
- no existing Heatmap/API contract change.

## 7. W2B — History adapter and combined evidence model

Branch:

```text
work-watchlist-w2b-history
```

Primary scope:

- normalize existing Twitch and Kick History responses;
- create period Top-stream and daily-appearance indexes by normalized id;
- derive retained summary and most recent retained appearance;
- combine storage, latest, and retained evidence without collapsing axes;
- complete initial-load, period-change, refresh, and failure-isolation request controller;
- add executable exact request-count and evidence-state tests.

No public Watchlist route is added in W2B.

### Required retained states

```text
present_retained
absent_usable
history_partial
history_unavailable
```

Rules:

- Top-stream or retained daily match can establish `present_retained`;
- no match in an otherwise usable result establishes `absent_usable` only;
- partial payload preserves facts but exposes `history_partial`;
- empty/error/unreadable payload exposes `history_unavailable` when no conclusion is supportable;
- missing values remain null/unavailable;
- no fuzzy name matching and no exact session claims.

### Complete request contract tests

- empty list -> zero Heatmap and zero History requests;
- nonempty initial load -> one Heatmap plus one History request;
- period change -> one History request only;
- explicit combined refresh -> one Heatmap plus one History request;
- add/remove/reorder/filter/show operations -> zero requests;
- endpoint failures remain independent;
- Back/Forward period restore -> History request only when payload for that period is not already in page memory;
- no request count changes with entry count.

### W2B completion criteria

- neutral combined model is ready for rendering;
- no public route, HTML, or CSS;
- no API schema or server change;
- existing History/Channel gates remain green.

## 8. W3A — provider routes and storage-first shell

Branch:

```text
work-watchlist-w3a-routes
```

Primary scope:

- add `/twitch/watchlist/` and `/kick/watchlist/` HTML routes;
- add provider metadata, canonical, `noindex,follow`, masthead, breadcrumb, unchanged primary feature tabs, hero, storage disclosure, add form, period controls, feedback regions, empty state, and scope/limits;
- connect W1 storage and URL-state modules;
- keep feature-data requests disabled or fixture-injected until W3B if needed;
- add provider Home secondary utility links without changing the core feature order;
- add static and local browser shell gates.

### W3A route rules

- Watchlist is not added as an active primary feature tab;
- core feature tabs stay Heatmap, Day Flow, Battle Lines, History, Status;
- Home utility wording is provider-specific and does not show a combined count;
- empty Watchlist makes no data request;
- storage errors remain usable and recoverable;
- page HTML contains no saved ids.

### W3A local interactions

- add by plain id and same-provider URL;
- duplicate and limit feedback;
- remove, move, clear, reset, filter, show all/recent;
- cross-tab list refresh;
- no data evidence cards beyond loading/unavailable placeholders until adapters are connected.

### W3A completion criteria

- routes build and load locally;
- storage behavior is keyboard-operable;
- empty and storage-error states meet the permanent wording contract;
- no D1/API/collector changes;
- no hosted Preview yet.

## 9. W3B — evidence cards and approved entry points

Branch:

```text
work-watchlist-w3b-ui
```

Primary scope:

- connect W2 combined data model to both provider routes;
- render independent latest and retained evidence in each card;
- implement loading, partial, stale, empty, error, present, and absent states;
- add explicit Refresh data and source-specific retry behavior;
- add `Save to Watchlist` / `Saved in Watchlist` action to Twitch and Kick Channel pages;
- add valid provider-safe card links;
- preserve existing Channel request count and task behavior;
- add browser tests for actual interactions and request counts.

### Required exact labels

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

### Channel integration rules

- use existing `data-provider` and normalized Channel id;
- valid unsaved Channel -> `Save to Watchlist`;
- saved Channel -> `Saved in Watchlist`, linking to management;
- missing/invalid id -> disabled action;
- save performs no History or other API request;
- do not turn the saved action into a remove toggle;
- do not alter Channel URL, task, report, export, DOM meaning, or one-History-request contract except for the additive secondary control.

### Card-link rules

- `Open Channel` is always provider-safe for a valid id;
- external provider link is provider-specific;
- Heatmap and History links may be generic provider routes;
- Day Flow/Battle Lines links use only currently supported query parameters;
- no fake channel-filter query is created.

### W3B completion criteria

- 1 and 50 entries still use two initial data requests;
- endpoint failures isolate correctly;
- all exact absence language appears;
- Channel integration makes no additional data request;
- no existing feature behavior changes beyond approved additive links/actions.

## 10. W3C — responsive, visual, and accessibility candidate pass

Branch:

```text
work-watchlist-w3c-candidate
```

Primary scope:

- apply the accepted dark Watchlist visual layer after functionality is complete;
- establish desktop, tablet, 390px, and 360px compositions;
- resolve card hierarchy, controls, long content, storage/data messages, and destructive action placement;
- complete focus, keyboard, live-region, touch-target, symbol, and reduced-motion behavior;
- produce local full-page candidate artifacts for both providers and all key states.

### Required artifact matrix

At minimum:

```text
Twitch desktop 1440 — populated mixed evidence
Twitch tablet 820 — storage controls and reordered list
Twitch mobile 390 — populated, latest absent, retained present
Kick desktop 1440 — populated partial/candidate coverage
Kick mobile 390 — empty state
Kick mobile 360 — storage error and long id/name wrapping
```

Additional fixtures cover:

- 50 entries with default twelve shown;
- show all and local filter;
- stale latest data;
- latest endpoint error plus usable History;
- History error plus usable latest;
- maximum-limit and duplicate feedback;
- confirm/cancel clear;
- focus after removal and move.

### W3C completion criteria

- no page-level overflow at all reference widths;
- primary mobile controls meet touch targets where practical;
- visible state does not rely on color alone;
- artifact review finds no placeholder-like valid cards;
- no serialized, API, or storage contract changes.

## 11. W4A — executable contract closure

Branch:

```text
work-watchlist-w4-contracts
```

Primary scope:

- consolidate storage, adapter, request, wording, route, SEO, privacy, provider-separation, and Channel-integration checks;
- add source scans preventing Watchlist-specific API, D1, KV, R2, collector, cron, service worker, interval polling, and analytics-id leakage;
- require all permanent exact labels and key names;
- verify no saved ids are serialized into URLs or metadata;
- verify core feature tabs remain unchanged;
- verify Development policy governance for Watchlist documents and active note.

### W4A required gates

```text
storage schema and repair
id/URL normalization
request counts
provider endpoint separation
evidence-state mapping
exact limitation wording
route metadata and noindex
no analytics saved-id payload
no new server data path
Channel save no-request behavior
existing History and Channel contracts
```

### W4A completion criteria

- all contract gates pass on the latest head;
- no visible redesign or new feature scope;
- no Preview yet.

## 12. W4B — complete local browser candidate QA

Branch:

```text
work-watchlist-w4-browser
```

Primary scope:

- exercise the completed candidate as one integrated browser flow;
- use deterministic fixtures and request interception;
- verify desktop/tablet/mobile artifacts and machine-readable evidence;
- verify storage reload and cross-tab behavior;
- verify Back/Forward, period change, refresh, retries, and focus;
- rerun full affected and shared regression matrix.

### W4B acceptance checklist

- Twitch and Kick routes independent;
- empty zero-request behavior;
- populated two-request behavior;
- fifty-entry request invariance;
- period History-only request;
- combined refresh exactly two requests;
- all storage failure/repair states;
- all latest and retained evidence states;
- exact labels and no offline/session overclaim;
- Channel save and Home utility entry points;
- no overflow, accessible focus, 48px mobile targets where practical;
- no errors in console;
- all existing production core gates green.

### W4B completion criteria

- candidate is ready for hosted acceptance;
- artifact set is complete and reviewed;
- roadmap advances to W5A only after merge report.

## 13. W5A — hosted Preview acceptance

Implementation branch:

```text
work-watchlist-w5-hosted
```

Approved hosted branch:

```text
preview-watchlist-v1
```

Primary scope:

- add temporary hosted acceptance note and marker;
- add or update dedicated Preview workflow;
- deploy only the complete W4 candidate to the approved Preview branch;
- verify exact Preview SHA and Pages Functions availability;
- probe Twitch and Kick Heatmap and History through separate production-like bindings;
- seed localStorage in browser tests without server mutation;
- verify real-data mixed states, route behavior, request counts, and artifacts;
- retain screenshots and machine-readable evidence.

### Hosted acceptance matrix

```text
Twitch desktop populated
Twitch mobile 390 populated/absent mix
Kick desktop populated partial coverage
Kick mobile 390 empty or limited retained result
360px no overflow
Channel save entry point for both providers
```

### W5A non-goals

- no production acceptance yet;
- no D1 writes, migrations, collector changes, or retention changes;
- no new feature after candidate freeze.

### W5A completion criteria

- Preview exact SHA verified;
- real Twitch/Kick bindings remain separate;
- no per-channel request growth;
- screenshots and evidence reviewed;
- candidate approved for production merge.

## 14. W5B — production acceptance and documentation closure

Branch:

```text
work-watchlist-w5-production
```

Primary scope:

- merge the accepted candidate to `main`;
- wait for exact deployment identity;
- verify production routes, metadata, APIs, storage behavior, Channel/Home entry points, request counts, and no overflow;
- retain production artifacts;
- record permanent acceptance SHA, workflow runs, and artifact ids;
- change specification and implementation-plan status to completed;
- update roadmap and schedule;
- delete and unlink the temporary Watchlist working note and hosted markers/workflows when required;
- keep permanent regression workflows.

### W5B completion criteria

- exact production main SHA is served;
- both provider routes work independently;
- real latest and History evidence remain honest;
- zero/nonempty/period/refresh request contracts hold;
- local storage remains local and provider-separated;
- Channel/Home entry points work;
- existing production smoke and all shared gates pass;
- permanent acceptance record exists;
- temporary documents are retired.

## 15. Preview policy

```text
W0-W4: no hosted Preview required
W5A: deliberate preview-watchlist-v1 hosted acceptance required
W5B: exact production acceptance required
```

Local browser artifacts are required before hosted Preview because W3 introduces visible routes and W4 freezes the candidate.

## 16. Cross-cutting regression matrix

Every runtime PR after W0 must run its dedicated gate plus relevant shared checks.

At candidate closure, run at minimum:

- Development policy;
- Web build;
- Web checks;
- Web verification;
- provider naming and coverage contracts;
- Data Status page/browser;
- History Overview, Archives, Calendar, Peaks, Battles, comparisons, report, export, and browser gates;
- Channel profile, overview, report, candidate, and browser gates;
- shared output contracts;
- all Watchlist storage, data, page, request, and browser gates.

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

Such a change is not an incidental implementation detail and requires a new approved roadmap decision.

## 18. Final stop rule

After each PR merge:

1. issue the full merge report;
2. state the exact current phase and next branch;
3. stop;
4. do not create the next branch until the user explicitly instructs continuation.
