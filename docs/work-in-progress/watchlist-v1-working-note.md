# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w5-hosted`
Current PR: `#424 Verify Local Watchlist on hosted Preview`
Hosted branch: `preview-watchlist-v1`
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
W4B work-watchlist-w4-browser    PR #423  deterministic local browser acceptance
```

W1 fixed provider-separated versioned storage, normalization, immutable list operations, duplicate and fifty-entry behavior, recoverable storage states, provider-isolated clear/reset, storage-event parsing, and clean period URL state.

W2A fixed the neutral latest schema, Twitch/Kick Heatmap adapters, latest evidence states, normalized id index, zero/one request behavior, cache reuse, refresh, in-flight deduplication, provider separation, and neutral request failures.

W2B fixed the retained-History schema, provider History adapters, period and daily indexes, independent latest/retained evidence, period caches, exact request counts, and endpoint failure isolation.

W3A fixed provider routes, canonical and noindex metadata, unchanged primary tabs, browser-local storage UI, list operations, 7d/30d URL state, cross-tab updates, provider Home utility links, focus, and desktop/360px gates.

W3B fixed existing Heatmap/History connection, independent evidence cards, limitation wording, combined refresh, source retries, provider-safe links, Channel save, one-through-fifty request invariance, and desktop/360px functional gates.

W3C fixed the final visual hierarchy, provider accents, 1440/820/390/360 compositions, focus, touch targets, wrapping, reduced motion, contrast, forced colors, and deterministic screenshots.

W4A fixed one consolidated executable contract command and permanent workflow covering storage, URL, latest, History, routes, SEO, privacy, providers, requests, Channel, candidate presentation, forbidden infrastructure, and documentation governance.

W4B completed the integrated local browser candidate QA and froze the accepted candidate.

W4B merge record:

```text
PR: #423 Complete Local Watchlist browser candidate QA
head: fa66656a3fecd7af932c31bb66d5bdace85b5da9
merge: c75b4549bb50d7eb54c0135874dba63db0b7cc69
Preview: not requested
runtime feature changes: none
```

## 2. Active W5A completion candidate

```text
implementation branch: work-watchlist-w5-hosted
hosted branch: preview-watchlist-v1
PR: #424 Verify Local Watchlist on hosted Preview
hosted candidate: c75b4549bb50d7eb54c0135874dba63db0b7cc69
branch origin: https://preview-watchlist-v1.viewloom.pages.dev
deployment origin: https://c0228ac1.viewloom.pages.dev
runtime product changes: none
```

The hosted branch points exactly to the W4B merge commit and does not include the W5A acceptance script or documentation changes.

Acceptance files:

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
docs/work-in-progress/watchlist-w5a-hosted-preview-note.md
```

Machine-readable evidence:

```text
schema: viewloom-watchlist-hosted-preview-acceptance-v1
phase: W5A
result: pass
scenario count: 3
```

Deployment identity:

```text
schema: viewloom-deployment-v1
environment: preview
branch: preview-watchlist-v1
commit_sha: c75b4549bb50d7eb54c0135874dba63db0b7cc69
```

Provider evidence:

```text
Twitch
  binding: DB_TWITCH_HOT -> vl_twitch_hot
  source mode: real
  state: partial
  latest rows: 300
  retained 30d ids: 63
  retained 7d ids: 56
  latest/retained id: kato_junichi0817
  latest-only id: shinjifromjapanxd
  retained-only id: jynxzi

Kick
  binding: DB_KICK_HOT -> vl_kick_hot
  source mode: authenticated
  state: fresh
  latest rows: 100
  retained 30d ids: 59
  retained 7d ids: 51
  latest/retained id: absi
  latest-only id: thedoctor
  retained-only id: maherco
```

Both retained History payloads were partial. The hosted UI correctly rendered `Retained History is partial` rather than claiming complete retained presence or absence.

Hosted scenarios:

```text
twitch-desktop-hosted
  exact deployment identity
  real Twitch latest and retained evidence
  exact initial, 7d, cached restore, and refresh counts
  provider isolation
  no horizontal overflow

kick-mobile-hosted
  real Kick latest and retained evidence
  exact initial, 7d, cached restore, and refresh counts
  provider isolation
  no horizontal overflow
  44px general targets
  48px management targets

kick-channel-save-hosted
  real Kick id: absi
  storage key: viewloom.watchlist.kick.v1
  additional requests on save: 0
```

Accepted workflow:

```text
Watchlist Hosted Preview
run: 28162895177
result: success
accepted work-branch head: eac0d0f941818b64a357802fe3bfed02479c482a
```

W5A artifacts:

```text
watchlist-w5a-evidence.json
watchlist-w5a.log
watchlist-w5a-twitch-desktop.png
watchlist-w5a-kick-mobile.png
watchlist-w5a-channel-save.png
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
- no API schema, endpoint meaning, D1 write, migration, binding, collector, cron, retention, or rollup change;
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
W4B browser candidate QA         complete PR #423
W5A hosted Preview               completion candidate PR #424
W5B production closure           next after PR #424 merge report
```

## 5. W5B handoff

Planned branch after W5A merge reporting:

```text
work-watchlist-w5-production
```

The branch does not exist yet.

W5B must verify the exact production deployment identity, routes, metadata, APIs, storage, Channel/Home entry points, request counts, provider separation, and responsive behavior. It must record permanent acceptance evidence and delete both temporary Watchlist notes after stable content is transferred.

## 6. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
