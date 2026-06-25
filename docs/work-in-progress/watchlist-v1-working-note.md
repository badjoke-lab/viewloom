# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w4-browser`
Current PR: `#423 Complete Local Watchlist browser candidate QA`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. Completed records

```text
W0  work-watchlist-w0            PR #415  permanent specification and plan
W1  work-watchlist-w1-storage    PR #416  local model, storage, and URL state
W2A work-watchlist-w2a-latest    PR #417  latest Heatmap adapter/request foundation
W2B work-watchlist-w2b-history   PR #418  retained History and combined evidence
W3A work-watchlist-w3a-routes    PR #419  provider routes and storage-first shell
W3B work-watchlist-w3b-ui        PR #420  evidence UI, retries, links, and Channel save
W3C work-watchlist-w3c-candidate PR #421  responsive, visual, and accessibility candidate
W4A work-watchlist-w4-contracts  PR #422  executable contract closure
```

W1 fixed provider-separated versioned storage, normalization, immutable list operations, duplicate and fifty-entry behavior, recoverable storage states, provider-isolated clear/reset, storage-event parsing, and clean period URL state.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, latest evidence states, normalized id index, zero/one request behavior, cache reuse, refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence, period caches, exact request counts, and endpoint failure isolation.

W3A fixed provider routes, canonical and noindex metadata, unchanged primary tabs, browser-local storage UI, list operations, 7d/30d URL state, cross-tab updates, provider Home utility links, focus, and desktop/360px gates.

W3B fixed existing Heatmap/History connection, independent evidence cards, limitation wording, combined refresh, source retries, provider-safe links, Channel save, one-through-fifty request invariance, and desktop/360px functional gates.

W3C fixed the final visual hierarchy, provider accents, 1440/820/390/360 compositions, focus, touch targets, wrapping, reduced motion, contrast, forced colors, and seven deterministic screenshots.

W4A fixed one consolidated executable contract command and permanent workflow covering storage, URL, latest, History, routes, SEO, privacy, providers, requests, Channel, candidate presentation, forbidden infrastructure, and documentation governance.

W4A merge record:

```text
PR: #422 Close Local Watchlist executable contracts
head: 2d900a57dfdb14942ebe06e9a905d5df88f06438
merge: a7324cea387db7477c01d97bf35b762a0bc8ea76
Preview: not requested
```

## 2. Active W4B completion candidate

```text
branch: work-watchlist-w4-browser
PR: #423 Complete Local Watchlist browser candidate QA
Preview: not requested
runtime product changes: none
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
phase: W4B
result: pass | fail
scenario count: 4
```

Integrated scenario matrix:

```text
twitch-desktop-integrated
  empty zero-request state
  storage reload
  latest / retained / absence evidence
  filter and reorder
  focus preservation
  7d request
  cached Back and Forward
  refresh
  latest failure and Retry latest
  History failure and Retry History
  second tab and cross-tab add

kick-tablet-channel
  provider request isolation
  provider-safe links
  no Twitch storage mutation
  44px targets
  Channel save with zero additional requests

kick-mobile-integrated
  empty zero-request state
  task-local add
  explicit refresh
  44px / 48px targets
  long-content wrapping
  no overflow
  reduced motion

storage-unavailable-mobile
  visible recovery panel
  zero requests
  no overflow
```

W4B workflow matrix:

```text
Development policy
web typecheck
W4A consolidated contracts
web build
W3B desktop functional regression
W3B narrow functional regression
W3C desktop/tablet regression
W3C mobile regression
W4B integrated browser acceptance
machine-readable evidence validation
```

W4B artifacts:

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

## 3. Preserved functional contract

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

Exact evidence wording remains:

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
- Watchlist remains outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete channel history;
- no per-channel request loop or polling;
- no login, sync, alerts, or server-side user storage;
- no API schema, endpoint meaning, D1, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 4. Current position

```text
W0  specification and plan       complete PR #415
W1  storage foundation           complete PR #416
W2A latest adapter               complete PR #417
W2B History/combined foundation  complete PR #418
W3A routes and shell             complete PR #419
W3B evidence UI/entry points     complete PR #420
W3C candidate polish             complete PR #421
W4A contract closure             complete PR #422
W4B browser candidate QA         completion candidate PR #423
W5A hosted Preview               next after PR #423 merge report
W5B production closure           queued
```

## 5. W5A handoff

Planned implementation branch after W4B merge reporting:

```text
work-watchlist-w5-hosted
```

Approved hosted branch:

```text
preview-watchlist-v1
```

W5A must deploy only the complete accepted W4 candidate, verify exact Preview SHA and separate Twitch/Kick Functions bindings, and exercise real-data routes, request counts, evidence states, and responsive behavior. It must not introduce D1 writes, migrations, collectors, retention changes, or new feature scope.

W5A next after PR #423 merge report.

## 6. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
