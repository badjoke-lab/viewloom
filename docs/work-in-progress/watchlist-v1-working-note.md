# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w4-contracts`
Current PR: `#422 Close Local Watchlist executable contracts`
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
```

W1 fixed provider-separated versioned storage, id and URL normalization, immutable list operations, duplicate and fifty-entry behavior, recoverable storage states, provider-isolated clear/reset, storage-event parsing, and clean period URL state.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, four latest evidence states, normalized id index, zero/one request behavior, cache reuse, explicit refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the neutral retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence axes, period-specific page-memory caches, exact request counts, and endpoint failure isolation.

W3A fixed provider-separated routes, canonical and noindex metadata, unchanged primary tabs, browser-local storage UI, add/remove/move/clear/reset/filter/show behavior, 7d/30d URL state, cross-tab updates, provider Home utility links, keyboard focus, and desktop/360px storage-shell browser gates.

W3B fixed connection of existing provider Heatmap and History payloads, independent latest/retained evidence cards, exact limitation wording, combined refresh, source-specific retries, provider-safe links, Channel save, one-through-fifty request invariance, and desktop/360px functional gates.

W3C fixed the final dark-theme hierarchy, provider-separated accents, 1440/820/390/360 compositions, focus, touch targets, long-content wrapping, reduced-motion, contrast, forced-color behavior, and seven deterministic full-page artifacts.

W3C merge record:

```text
PR: #421 Polish Local Watchlist responsive candidate
head: 5662a1fd74de0839e76a16d5e8d63ab8439be107
merge: 6535397ab1be32866df22a636cff15f7da4e570c
Preview: not requested
```

## 2. Active W4A completion candidate

```text
branch: work-watchlist-w4-contracts
PR: #422 Close Local Watchlist executable contracts
Preview: not requested
runtime feature changes: none
```

Contract files:

```text
apps/web/scripts/verify-watchlist-contracts.mjs
.github/workflows/watchlist-contracts.yml
apps/web/package.json
```

W4A consolidates executable verification for:

- W1 storage keys, schema, normalization, repair, mutation, ordering, limits, and URL state;
- W2A latest endpoint mapping, adapter, evidence, empty-list zero request, one-response matching, cache, refresh, and in-flight behavior;
- W2B History endpoint mapping, period cache, retained evidence, combined action counts, and endpoint failure isolation;
- W3A canonical routes, `noindex,follow`, clean metadata, unchanged primary tabs, browser-local privacy, and provider separation;
- W3B exact evidence wording, one generic request seam, source-specific retries, provider-safe links, and Channel save;
- W3C style imports, responsive breakpoints, touch targets, focus, long-content, reduced-motion, contrast, and artifact definitions;
- current roadmap, schedule, implementation plan, documentation index, and Development policy governance.

W4A permanent tripwires reject:

```text
Watchlist-specific API or server files
D1 / KV / R2 / binding additions
collector / cron / retention additions
interval polling or service workers
cookie / IndexedDB / sessionStorage fallback
per-channel request loops
local ids in canonical URLs or metadata
public share/copy-list URLs
analytics transmission of local ids
cross-provider storage, facts, requests, links, or counts
Watchlist in primary feature tabs
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
W3C candidate polish             complete PR #421
W4A contract closure             completion candidate PR #422
W4B browser QA                   next after PR #422 merge report
W5A hosted Preview               queued
W5B production closure           queued
```

## 5. W4B handoff

Planned branch after W4A merge reporting:

```text
work-watchlist-w4-browser
```

W4B runs the complete integrated deterministic browser flow across storage reload, cross-tab changes, Back/Forward, periods, refresh, retries, Channel save, focus, and desktop/tablet/mobile artifacts. It must not begin before PR #422 is merged and the full merge report is issued.

## 6. Prior transition record retained for audit compatibility

```text
Current branch: `work-watchlist-w3b-ui`
Current PR: `#420 Connect Local Watchlist evidence and Channel save`
W3A routes and shell             complete PR #419
W3B evidence UI/entry points     completion candidate PR #420
W3C candidate polish             next after merge report
work-watchlist-w3c-candidate
```

## 7. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
