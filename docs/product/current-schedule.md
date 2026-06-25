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
Local Watchlist W3C                      complete through PR #421
Local Watchlist W4A                      completion candidate in PR #422
Local Watchlist W4B                      next after PR #422 merge report
History UI appearance revision           pending screenshots and instructions
```

Active work:

```text
Phase 6 — Local Watchlist v1
W4A — executable contract closure
Branch: work-watchlist-w4-contracts
PR: #422
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

## 3. Completed W3C record

```text
branch: work-watchlist-w3c-candidate
PR: #421
head: 5662a1fd74de0839e76a16d5e8d63ab8439be107
merge commit: 6535397ab1be32866df22a636cff15f7da4e570c
Preview: not requested
local deterministic browser validation: passed
API/DB/collector: not changed
```

W3C delivered:

- final Watchlist dark-theme visual hierarchy;
- separate Twitch and Kick accent treatment;
- desktop 1440, tablet 820, mobile 390, and mobile 360 compositions;
- mixed, partial, empty, storage-unavailable, and long-content fixtures;
- visible focus, 44px tablet targets, 48px mobile targets, reduced-motion, increased-contrast, and forced-color support;
- seven full-page deterministic artifacts;
- no serialized state, storage, request lifecycle, API, or product-contract change.

## 4. Active W4A completion candidate

```text
branch: work-watchlist-w4-contracts
PR: #422
Preview: not requested
runtime feature changes: none
API/DB/collector: not changed
```

Contract files:

```text
apps/web/scripts/verify-watchlist-contracts.mjs
.github/workflows/watchlist-contracts.yml
apps/web/package.json
```

W4A executes and consolidates:

- W1 model, storage, normalization, repair, mutation, and URL-state verification;
- W2A latest adapter, evidence, endpoint, request-count, cache, and in-flight verification;
- W2B History adapter, evidence, period cache, combined request lifecycle, and failure isolation;
- W3A canonical routes, `noindex,follow`, clean metadata, unchanged primary tabs, local-only privacy, and provider separation;
- W3B exact evidence wording, one generic fetch seam, empty-list zero request, retries, Channel save, provider-safe links, and no per-channel request loop;
- W3C style entry, responsive breakpoints, touch targets, focus, long-content, reduced-motion, contrast, and deterministic artifact definitions;
- documentation and Development policy governance.

W4A rejects:

- Watchlist-specific server routes or APIs;
- D1, KV, R2, binding, collector, cron, or retention additions;
- polling, service workers, hidden-page monitoring, cookie, IndexedDB, or sessionStorage fallbacks;
- local ids in canonical URLs, metadata, static HTML, share URLs, or analytics payloads;
- cross-provider storage, facts, requests, links, or counts;
- Watchlist insertion into the primary feature tabs.

## 5. Preserved request and product contract

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

Preserved boundaries:

- Twitch and Kick remain separate;
- Watchlist remains outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete history;
- no exact sessions;
- no per-channel request loop;
- no login, cloud sync, or alerts;
- no API schema or endpoint-meaning change;
- no D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 6. Next approved work after W4A merge

```text
W4B — complete local browser candidate QA
Branch: work-watchlist-w4-browser
```

W4B next after PR #422 merge report.

W4B will run the integrated deterministic browser flow across storage reload, cross-tab changes, Back/Forward, periods, refresh, retries, Channel save, focus, and desktop/tablet/mobile artifacts. It must not begin before PR #422 merges and the full merge report is issued.

Hosted `preview-watchlist-v1` acceptance remains reserved for W5A.

## 7. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   completion candidate PR #422
W4B  local browser candidate QA                    next after merge report
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance/document cleanup        queued
```

## 8. Prior transition records retained for audit compatibility

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

Do not begin W4B before the PR #422 merge report is issued.
