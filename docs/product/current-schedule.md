# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt all planned work.
- P1 defects interrupt the active phase when they block acceptance.
- P2 polish is grouped unless it belongs to the active milestone.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Documentation-only W0 does not require Preview.
- After every merge, issue the full merge report before beginning another PR.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7                            complete
History production acceptance            complete
Channel C0-C5B                           complete
Channel production acceptance            complete
Report/export R0-R4                      complete through PR #413
Phase 5 data-capability audit             complete through PR #414
Local Watchlist W0                       complete through PR #415
Local Watchlist W1                       next, not started
History UI appearance revision            pending screenshots and instructions
```

Current active implementation phase after PR #415 merge:

```text
none
```

Next approved work:

```text
Phase 6 — Local Watchlist v1
W1 — local state and storage foundation
Branch: work-watchlist-w1-storage
```

Governing records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
docs/work-in-progress/watchlist-v1-working-note.md
```

## 3. W0 completion record

W0 branch and PR:

```text
work-watchlist-w0
PR #415
```

W0 fixed:

```text
routes:
  /twitch/watchlist/
  /kick/watchlist/

storage keys:
  viewloom.watchlist.twitch.v1
  viewloom.watchlist.kick.v1

maximum entries:
  50 per provider

initial visible entries:
  12

empty initial list:
  0 Heatmap requests
  0 History requests

nonempty initial list:
  exactly 1 provider Heatmap request
  exactly 1 provider History request

period change:
  exactly 1 provider History request

explicit refresh:
  exactly 1 provider Heatmap request
  exactly 1 provider History request
```

Exact absence language:

```text
Not in latest observed set
Not confirmed offline

Not in retained History result
No complete history is implied
```

Approved entry points:

```text
Watchlist add form
Channel Save to Watchlist action
provider Home secondary utility link
```

Deferred dense entry points:

```text
Heatmap item save buttons
History row save buttons
Battle Lines line save buttons
Day Flow band save buttons
```

## 4. W1 scope

Branch:

```text
work-watchlist-w1-storage
```

W1 implements only:

- pure Watchlist types and deterministic list operations;
- provider-separated v1 key selection;
- plain id and same-provider URL normalization;
- cross-provider URL rejection;
- parse, validation, repair, deduplication, and 50-entry cap;
- add, remove, move, clear, and reset operations;
- storage read/write failure result codes;
- same-origin cross-tab `storage` event handling;
- `period=7d|30d` URL-state helper;
- executable model/storage/URL tests and workflow.

Expected new layer:

```text
apps/web/src/live/watchlist/model.ts
apps/web/src/live/watchlist/storage.ts
apps/web/src/live/watchlist/url-state.ts
apps/web/scripts/verify-watchlist-storage.mjs
.github/workflows/watchlist-storage.yml
```

W1 explicitly does not include:

- public routes or HTML;
- Watchlist CSS or visible page UI;
- Heatmap or History adapters;
- any fetch call;
- Channel or Home integration;
- API, D1, binding, collector, cron, or retention changes.

## 5. W1 acceptance criteria

- exact provider key names are enforced;
- id and provider URL normalization is deterministic;
- invalid host/path/id and cross-provider URLs are rejected;
- duplicate add does not reorder or rewrite the entry;
- new unique entry is inserted at the top;
- fifty-first unique entry is rejected without mutation;
- remove, move, provider-specific clear, and reset are deterministic;
- corrupt JSON and wrong schema/provider/revision are recoverable;
- valid documents repair invalid, duplicate, and excess entries;
- read and write exceptions return neutral failure codes;
- storage event parsing cannot cross providers;
- period default, serialization, and Back/Forward behavior are tested;
- storage/model layer has no fetch or DOM dependency;
- existing repository gates remain green;
- no Preview is requested.

## 6. Complete Phase 6 sequence

```text
W0   specification and implementation plan          complete through PR #415
W1   local state and storage foundation             next
W2A  latest-observation adapter                     queued
W2B  History adapter and combined evidence          queued
W3A  provider routes and storage-first shell         queued
W3B  evidence cards and approved entry points        queued
W3C  visual/responsive/accessibility candidate      queued
W4A  executable contract closure                    queued
W4B  local browser candidate QA                     queued
W5A  hosted Preview acceptance                      queued
W5B  production acceptance and documentation close queued
```

Hosted branch reserved for W5A:

```text
preview-watchlist-v1
```

## 7. Fixed Watchlist non-goals

- authoritative live/offline status;
- exact sessions or complete channel history;
- alerts or notifications;
- login, account, cloud sync, or server preferences;
- import/export or shared list URLs;
- cross-provider identity or totals;
- category/language history;
- background polling;
- Watchlist-specific API or server storage;
- new D1, binding, collector, cron, or retention work;
- per-channel request loops;
- promotion into the primary feature-tab sequence.

## 8. Stop rule

Do not begin W1 before the PR #415 merge report is issued.
