# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w3c-candidate`
Current PR: `#421 Polish Local Watchlist responsive candidate`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. Completed records

```text
W0  work-watchlist-w0            PR #415  permanent specification and plan
W1  work-watchlist-w1-storage    PR #416  local model, storage, and URL state
W2A work-watchlist-w2a-latest    PR #417  latest Heatmap adapter/request foundation
W2B work-watchlist-w2b-history   PR #418  retained History and combined evidence
W3A work-watchlist-w3a-routes    PR #419  provider routes and storage-first shell
W3B work-watchlist-w3b-ui        PR #420  evidence UI, retries, links, and Channel save
```

W1 fixed provider-separated versioned storage, id and URL normalization, immutable list operations, duplicate and fifty-entry behavior, recoverable storage states, provider-isolated clear/reset, storage-event parsing, and clean period URL state.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, four latest evidence states, normalized id index, zero/one request behavior, cache reuse, explicit refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the neutral retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence axes, period-specific page-memory caches, exact request counts, and endpoint failure isolation.

W3A fixed provider-separated routes, canonical and noindex metadata, unchanged primary tabs, browser-local storage UI, add/remove/move/clear/reset/filter/show behavior, 7d/30d URL state, cross-tab updates, provider Home utility links, keyboard focus, and desktop/360px storage-shell browser gates.

W3B fixed connection of existing provider Heatmap and History payloads, independent latest/retained evidence cards, exact limitation wording, combined refresh, source-specific retries, provider-safe links, Channel save, one-through-fifty request invariance, and desktop/360px functional gates.

W3B merge record:

```text
PR: #420 Connect Local Watchlist evidence and Channel save
head: 0191372b40380fb8ccd6ab7c8b35b3d406fd554e
merge: 66ed54cdd0e165c0e47c144a7d3ab27e10d5eefb
Preview: not requested
```

## 2. Active W3C candidate

```text
branch: work-watchlist-w3c-candidate
PR: #421 Polish Local Watchlist responsive candidate
Preview: not requested
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

W3C candidate scope:

- final dark-theme visual hierarchy for the already-complete Watchlist behavior;
- clearer hero, facts, controls, storage/data feedback, saved-channel cards, evidence facts, actions, empty state, and storage-error state;
- provider accent retained without combining Twitch and Kick;
- desktop, tablet, 390px, and 360px compositions;
- stronger keyboard focus, minimum touch targets, long-content wrapping, reduced-motion, increased-contrast, and forced-color support;
- destructive list actions visually separated from navigation actions;
- no serialized state, request lifecycle, storage, API, or product-contract change.

Required deterministic artifact matrix:

```text
Twitch desktop 1440 — populated mixed evidence
Twitch tablet 820 — storage controls and reordered list
Twitch mobile 390 — latest absent and retained present
Kick desktop 1440 — partial retained coverage
Kick mobile 390 — empty state
Kick mobile 360 — storage unavailable
Kick mobile 360 — long id/name wrapping
```

Expected artifacts:

```text
watchlist-candidate-twitch-desktop-1440.png
watchlist-candidate-twitch-tablet-820.png
watchlist-candidate-twitch-mobile-390-mixed.png
watchlist-candidate-kick-desktop-1440-partial.png
watchlist-candidate-kick-mobile-390-empty.png
watchlist-candidate-kick-mobile-360-storage-error.png
watchlist-candidate-kick-mobile-360-long-content.png
watchlist-candidate.log
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
- Watchlist remains outside the primary feature tabs;
- absence is not presented as authoritative offline status;
- retained evidence is not presented as complete channel history;
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
W3C candidate polish             active PR #421
W4A contract closure             next after W3C merge report
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 5. Prior W3B transition record retained for audit compatibility

```text
Current branch: `work-watchlist-w3b-ui`
Current PR: `#420 Connect Local Watchlist evidence and Channel save`
W3A routes and shell             complete PR #419
W3B evidence UI/entry points     completion candidate PR #420
W3C candidate polish             next after merge report
work-watchlist-w3c-candidate
```

## 6. W4A handoff

Planned branch after W3C merge reporting:

```text
work-watchlist-w4-contracts
```

W4A consolidates executable route, storage, request, wording, privacy, provider-separation, Channel-integration, visual-candidate, and forbidden-infrastructure contracts. It must not begin before PR #421 is merged and the full merge report is issued.

## 7. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
