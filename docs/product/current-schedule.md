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
Local Watchlist W4A                      complete through PR #422
Local Watchlist W4B                      completion candidate PR #423
Local Watchlist W5A                      next after PR #423 merge report
History UI appearance revision           pending screenshots and instructions
```

Active work:

```text
Phase 6 — Local Watchlist v1
W4B — complete local browser candidate QA
Branch: work-watchlist-w4-browser
PR: #423
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

## 3. Completed W4A record

```text
branch: work-watchlist-w4-contracts
PR: #422
head: 2d900a57dfdb14942ebe06e9a905d5df88f06438
merge commit: a7324cea387db7477c01d97bf35b762a0bc8ea76
Preview: not requested
runtime feature changes: none
```

W4A delivered:

- one consolidated Watchlist contract command;
- one permanent contract workflow;
- executable storage, URL, latest, History, route, SEO, privacy, provider, request, Channel, and candidate boundaries;
- permanent rejection gates for server expansion, polling, per-channel requests, local-id leakage, provider mixing, and primary-tab insertion;
- Development policy and documentation governance;
- successful typecheck, contract, build, and shared regression matrix.

## 4. Active W4B completion candidate

```text
branch: work-watchlist-w4-browser
PR: #423
Preview: not requested
runtime feature changes: none
API/DB/collector: not changed
```

Acceptance files:

```text
apps/web/scripts/watchlist-browser-acceptance.mjs
.github/workflows/watchlist-browser.yml
scripts/verify-development-policy.mjs
```

Machine-readable evidence:

```text
schema: viewloom-watchlist-local-browser-acceptance-v1
result: pass | fail
scenario count: 4
```

Integrated scenarios:

```text
Twitch desktop 1440
  empty state
  storage reload
  fresh / retained-only / absent evidence
  local filter
  persisted reorder and focus
  uncached 7d
  cached Back and Forward
  combined refresh
  latest and History failure isolation
  source-specific retries
  second tab and cross-tab update

Kick tablet 820
  provider request isolation
  provider-safe links
  no Twitch storage mutation
  44px targets
  Channel save with zero additional requests

Kick mobile 390
  empty zero-request load
  task-local add
  explicit refresh
  44px / 48px targets
  long-content wrapping
  no overflow
  reduced motion

Storage unavailable mobile 360
  visible recovery state
  zero requests
  no overflow
```

Complete W4B workflow matrix:

```text
Development policy
web typecheck
W4A consolidated contracts
web build
W3B desktop functional regression
W3B narrow functional regression
W3C desktop/tablet candidate regression
W3C mobile candidate regression
W4B integrated browser acceptance
machine-readable evidence validation
```

Artifact matrix:

```text
watchlist-browser-evidence.json
watchlist-w4b.log
watchlist-w4b-preview.log
watchlist-w4b-twitch-desktop.png
watchlist-w4b-twitch-cross-tab.png
watchlist-w4b-kick-tablet.png
watchlist-w4b-kick-mobile.png
watchlist-w4b-storage-error.png
W3B desktop/mobile screenshots
W3C seven-image candidate matrix
```

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

- Twitch and Kick remain separate in routes, storage, requests, facts, links, and counts;
- Watchlist remains outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete history;
- no exact sessions;
- no per-channel request loop;
- no login, cloud sync, or alerts;
- no API schema or endpoint-meaning change;
- no D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 6. Next approved work after W4B merge

```text
W5A — hosted Preview acceptance
Implementation branch: work-watchlist-w5-hosted
Approved hosted branch: preview-watchlist-v1
```

W5A next after PR #423 merge report.

W5A must deploy only the complete accepted W4 candidate, verify exact Preview identity and separate Twitch/Kick Functions bindings, and test real-data routes, request counts, evidence, and responsive behavior. It must not introduce D1 writes, migrations, collectors, retention changes, or new feature scope.

## 7. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   complete PR #422
W4B  complete local browser candidate QA           completion candidate PR #423
W5A  hosted preview-watchlist-v1 acceptance        next after merge report
W5B  production acceptance/document cleanup        queued
```

## 8. Stop rule

Do not begin W5A before PR #423 is merged and its full merge report is issued.
