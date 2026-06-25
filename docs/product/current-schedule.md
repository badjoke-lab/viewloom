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
Local Watchlist W3B                      complete through PR #420
Local Watchlist W3C                      completion candidate in PR #421
Local Watchlist W4A                      next after PR #421 merge report
History UI appearance revision           pending screenshots and instructions
```

Active work:

```text
Phase 6 — Local Watchlist v1
W3C — responsive, visual, and accessibility candidate pass
Branch: work-watchlist-w3c-candidate
PR: #421
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

## 3. Completed W3B record

```text
branch: work-watchlist-w3b-ui
PR: #420
head: 0191372b40380fb8ccd6ab7c8b35b3d406fd554e
merge commit: 66ed54cdd0e165c0e47c144a7d3ab27e10d5eefb
Preview: not requested
local browser validation: passed
API/DB/collector: not changed
```

W3B delivered:

- W2 combined latest/History controller connected to both provider Watchlist routes;
- latest and retained evidence remain independent in each saved-channel card;
- loading, present, stale, partial, absent, empty, error, and retry states;
- exact limitation wording for offline and complete-history boundaries;
- latest viewers, update time, title, momentum, retained viewer-minutes, peak, average, observed time, retained days, most recent appearance, and bounded rank when available;
- combined refresh and source-specific retries;
- provider-safe external, Channel, History, and Heatmap links;
- additive Channel `Save to Watchlist` / `Saved in Watchlist` control;
- deterministic Twitch/Kick fixtures and browser request accounting;
- desktop and 360px evidence validation.

Exact request behavior remains:

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

## 4. Active W3C completion candidate

```text
branch: work-watchlist-w3c-candidate
PR: #421
Preview: not requested
local deterministic browser validation: required
API/DB/collector: not changed
```

Candidate presentation files:

```text
apps/web/src/watchlist-candidate.css
apps/web/src/watchlist-candidate-panels.css
apps/web/src/watchlist-candidate-responsive.css
apps/web/src/live/watchlist-move-focus.ts
```

Candidate verification files:

```text
apps/web/scripts/watchlist-candidate-desktop.mjs
apps/web/scripts/watchlist-candidate-mobile.mjs
.github/workflows/watchlist-candidate.yml
```

Candidate behavior:

- stronger Watchlist hero, facts, data strip, controls, feedback, cards, evidence facts, actions, empty state, and storage-error hierarchy;
- provider accent retained separately for Twitch and Kick;
- desktop 1440, tablet 820, mobile 390, and mobile 360 composition gates;
- deterministic mixed-evidence, partial-coverage, empty, unavailable-storage, and long-content states;
- visible keyboard focus, minimum touch targets, long-content wrapping, reduced-motion, increased-contrast, and forced-color support;
- destructive list management separated from navigation actions;
- no serialized state, storage, request lifecycle, API, or product-contract change.

Required artifact matrix:

```text
Twitch desktop 1440 — populated mixed evidence
Twitch tablet 820 — storage controls and reordered list
Twitch mobile 390 — latest absent and retained present
Kick desktop 1440 — partial retained coverage
Kick mobile 390 — empty state
Kick mobile 360 — storage unavailable
Kick mobile 360 — long id/name wrapping
```

## 5. W3C acceptance boundary

W3C may change only completed-feature presentation and accessibility support.

It must preserve:

- separate Twitch and Kick routes, localStorage keys, data requests, and links;
- no Watchlist primary feature tab;
- no authoritative live/offline claim;
- no complete-history or exact-session claim;
- no per-channel request loop or polling;
- no login, cloud sync, or alerts;
- no API schema or endpoint meaning change;
- no D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 6. Next approved work after W3C merge

```text
W4A — executable contract closure
Branch: work-watchlist-w4-contracts
```

W4A must not begin before PR #421 is merged and its full merge report is issued.

Hosted `preview-watchlist-v1` acceptance remains reserved for W5A.

## 7. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       completion candidate PR #421
W4A  executable contract closure                   next after merge report
W4B  local browser candidate QA                    queued
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 8. Prior W3B transition record retained for audit compatibility

```text
Local Watchlist W3A                      complete through PR #419
Local Watchlist W3B                      completion candidate in PR #420
Local Watchlist W3C                      next after merge report
Branch: work-watchlist-w3b-ui
PR: #420
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
Channel save:                   0 additional requests
Do not begin W3C before the PR #420 merge report is issued.
```

## 9. Stop rule

Do not begin W4A before the PR #421 merge report is issued.
