# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-25

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Local browser validation is required for W3A–W4B; hosted Preview remains reserved for W5A.
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
Local Watchlist W3A                      complete through PR #419
Local Watchlist W3B                      completion candidate in PR #420
Local Watchlist W3C                      next after merge report
History UI appearance revision           pending screenshots and instructions
```

Active work:

```text
Phase 6 — Local Watchlist v1
W3B — evidence cards and approved entry points
Branch: work-watchlist-w3b-ui
PR: #420
Preview: not requested
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

## 3. Completed W3A record

```text
branch: work-watchlist-w3a-routes
PR: #419
merge commit: 1ae3a99a5d5cfbb6400a79cf620757b513a4c202
Preview: not requested
local responsive browser validation: passed
API/DB/collector: not changed
```

W3A delivered:

- `/twitch/watchlist/` and `/kick/watchlist/`;
- provider-specific canonical and `noindex,follow` metadata;
- unchanged primary feature tabs;
- provider-separated browser localStorage;
- add, remove, move, clear, reset, filter, show, repair, and cross-tab behavior;
- 7d/30d URL state;
- provider Home secondary utility link;
- keyboard focus, desktop, and 360px storage-shell gates;
- zero feature-data requests in the W3A shell.

## 4. W3B completion-candidate record

```text
branch: work-watchlist-w3b-ui
PR: #420
Preview: not requested
local browser validation: required
API/DB/collector: not changed
```

Runtime files:

```text
apps/web/src/live/watchlist-page.ts
apps/web/src/live/watchlist/combined-controller.ts
apps/web/src/live/channel-watchlist.ts
apps/web/src/watchlist-evidence.css
apps/web/src/channel-watchlist.css
apps/web/twitch/watchlist/index.html
apps/web/kick/watchlist/index.html
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
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

Implemented behavior:

- W2 combined latest/History controller connected to both provider Watchlist routes;
- latest and retained evidence remain independent in each saved-channel card;
- loading, present, stale, partial, absent, empty, error, and retry states;
- exact limitation wording for offline and complete-history boundaries;
- latest viewers, update time, title, momentum, retained viewer-minutes, peak, average, observed time, retained days, most recent appearance, and bounded rank when available;
- combined refresh and source-specific retries;
- provider-safe external, Channel, History, and Heatmap links;
- additive Channel `Save to Watchlist` / `Saved in Watchlist` control;
- Channel save is local-only, makes no request, and is not a remove toggle;
- deterministic Twitch/Kick fixtures and browser request accounting;
- desktop and 360px evidence validation.

Exact request behavior:

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined refresh:               1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

Exact evidence labels:

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

- provider storage and endpoints remain separate;
- Watchlist remains outside primary feature tabs;
- no authoritative live/offline claim;
- no complete-history or exact-session claim;
- no per-channel request loop or polling;
- no API schema or endpoint-meaning change;
- no D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 5. Next approved work after W3B merge

```text
W3C — responsive, visual, and accessibility candidate pass
Branch: work-watchlist-w3c-candidate
```

W3C may add only:

- completed-feature visual hierarchy and responsive composition;
- desktop, tablet, 390px, and 360px candidate artifacts;
- focus, keyboard, touch-target, long-content, reduced-motion, and destructive-action polish;
- deterministic visual-state fixtures;
- no serialized, storage, request, API, or product-contract change.

Hosted `preview-watchlist-v1` acceptance remains reserved for W5A.

## 6. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      completion candidate PR #420
W3C  responsive/accessibility candidate pass       next after merge report
W4A  executable contract closure                   queued
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 7. Stop rule

Do not begin W3C before the PR #420 merge report is issued.
