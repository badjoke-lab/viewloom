# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w3b-ui`
Current PR: `#420 Connect Local Watchlist evidence and Channel save`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. Completed records

```text
W0  work-watchlist-w0            PR #415  permanent specification and plan
W1  work-watchlist-w1-storage    PR #416  local model, storage, and URL state
W2A work-watchlist-w2a-latest    PR #417  latest Heatmap adapter/request foundation
W2B work-watchlist-w2b-history   PR #418  retained History and combined evidence
W3A work-watchlist-w3a-routes    PR #419  provider routes and storage-first shell
```

W1 fixed provider-separated versioned storage, id and URL normalization, immutable list operations, duplicate and fifty-entry behavior, recoverable storage states, provider-isolated clear/reset, storage-event parsing, and clean period URL state.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, four latest evidence states, normalized id index, zero/one request behavior, cache reuse, explicit refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the neutral retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence axes, period-specific page-memory caches, exact request counts, and endpoint failure isolation.

W3A fixed provider-separated routes, canonical and noindex metadata, unchanged primary tabs, browser-local storage UI, add/remove/move/clear/reset/filter/show behavior, 7d/30d URL state, cross-tab updates, provider Home utility links, keyboard focus, and desktop/360px storage-shell browser gates.

## 2. W3B completion candidate

Branch and PR:

```text
work-watchlist-w3b-ui
#420 Connect Local Watchlist evidence and Channel save
```

Runtime files:

```text
apps/web/src/live/watchlist-page.ts
apps/web/src/live/watchlist/combined-controller.ts
apps/web/src/live/channel-watchlist.ts
apps/web/twitch/watchlist/index.html
apps/web/kick/watchlist/index.html
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
apps/web/src/watchlist-evidence.css
apps/web/src/channel-watchlist.css
apps/web/src/live/watchlist-move-focus.ts
```

Verification files:

```text
apps/web/scripts/verify-watchlist-page.mjs
apps/web/scripts/watchlist-shell-browser-fixture.mjs
apps/web/scripts/watchlist-shell-browser-core.mjs
apps/web/scripts/watchlist-shell-browser-narrow.mjs
apps/web/scripts/watchlist-combined-controller-core-cases.mjs
.github/workflows/watchlist-page.yml
```

Implemented:

- connection of the accepted W2 combined controller to both provider Watchlist routes;
- one provider Heatmap request and one provider History request for a nonempty initial load;
- zero feature-data requests for an empty Watchlist;
- History-only uncached period changes and cached Back/Forward period restoration;
- explicit combined refresh;
- source-specific `Retry latest` and `Retry History` behavior;
- independent latest and retained evidence axes in every saved-channel card;
- exact permanent labels for present, stale, absent, partial, and unavailable evidence;
- latest viewers, observation time, title, momentum, viewer-minutes, peak, average, observed time, retained-day count, most recent retained appearance, and bounded rank when supplied;
- API display-name fallback for the current render without overwriting stored names;
- provider-safe external, Channel, History, and Heatmap links;
- additive `Save to Watchlist` / `Saved in Watchlist` action on Twitch and Kick Channel pages;
- Channel save derived from the same provider localStorage key without becoming a removal toggle;
- deterministic browser fixtures for Twitch/Kick Heatmap and History responses;
- exact request-count, cache, refresh, retry, failure-isolation, provider-separation, Channel-save, desktop, and 360px browser checks.

Exact request boundary:

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined Refresh data:          1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

Exact evidence wording:

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

Preserved boundaries:

- Twitch and Kick storage, facts, endpoints, links, and counts remain separate;
- Watchlist remains outside the primary feature tabs;
- absence is not presented as authoritative offline status;
- retained evidence is not presented as complete channel history;
- no per-channel request loop or polling;
- no login, sync, alerts, or server-side user storage;
- no API schema, endpoint meaning, D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 3. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           complete PR #416
W2A latest adapter               complete PR #417
W2B History/combined foundation  complete PR #418
W3A routes and shell             complete PR #419
W3B evidence UI/entry points     completion candidate PR #420
W3C candidate polish             next after merge report
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 4. W3C handoff

Planned branch:

```text
work-watchlist-w3c-candidate
```

W3C may add only:

- final visual hierarchy and responsive composition for completed Watchlist behavior;
- desktop, tablet, 390px, and 360px candidate artifacts;
- accessibility, focus, touch-target, long-content, reduced-motion, and destructive-action polish;
- deterministic fixtures for the required visual-state matrix;
- no serialized, request, API, storage, or product-contract change.

## 5. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
