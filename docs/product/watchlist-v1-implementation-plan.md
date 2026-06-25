# ViewLoom Local Watchlist v1 implementation plan

Status: active implementation plan
Version: 1.5
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1
Permanent specification: `local-watchlist-spec.md`
Capability authority: `next-feature-data-capability-audit.md`
Active working notes:

```text
../work-in-progress/watchlist-v1-working-note.md
../work-in-progress/watchlist-w5a-hosted-preview-note.md
```

## 1. Objective

Implement and accept provider-specific, login-free Local Watchlist routes using only:

```text
provider-separated browser localStorage
one existing provider Heatmap response
one existing provider History response
```

The implementation preserves separate Twitch and Kick storage, routes, requests, links, counts, and claims. Absence is not proof of offline status, and retained History is not complete channel history.

## 2. Fixed product contract

```text
/twitch/watchlist/
/kick/watchlist/
viewloom.watchlist.twitch.v1
viewloom.watchlist.kick.v1
maximum entries: 50 per provider
initial visible entries: 12
period=7d|30d
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

Permanent evidence labels:

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

## 3. Runtime and acceptance ownership

```text
apps/web/src/live/watchlist/model.ts                 provider and entry model
apps/web/src/live/watchlist/storage.ts               local storage contract
apps/web/src/live/watchlist/url-state.ts             period URL state
apps/web/src/live/watchlist/latest-model.ts          latest evidence and endpoint model
apps/web/src/live/watchlist/latest-adapter.ts        Heatmap normalization
apps/web/src/live/watchlist/latest-controller.ts     latest request/cache lifecycle
apps/web/src/live/watchlist/history-model.ts         retained evidence and endpoint model
apps/web/src/live/watchlist/history-adapter.ts       History normalization
apps/web/src/live/watchlist/history-controller.ts    period request/cache lifecycle
apps/web/src/live/watchlist/combined-model.ts        independent evidence axes
apps/web/src/live/watchlist/combined-controller.ts   combined action lifecycle
apps/web/src/live/watchlist-page.ts                   Watchlist DOM and interactions
apps/web/src/live/channel-watchlist.ts                Channel save/read action
apps/web/src/live/watchlist-move-focus.ts             focus and candidate style entry
apps/web/src/watchlist-page.css                       base layout
apps/web/src/watchlist-touch.css                      touch and focus support
apps/web/src/watchlist-evidence.css                   evidence states
apps/web/src/watchlist-candidate.css                  W3C hero and controls
apps/web/src/watchlist-candidate-panels.css           W3C cards and evidence panels
apps/web/src/watchlist-candidate-responsive.css       W3C responsive/accessibility layer
apps/web/src/channel-watchlist.css                    Channel action presentation
apps/web/twitch/watchlist/index.html                  Twitch route
apps/web/kick/watchlist/index.html                    Kick route
apps/web/scripts/verify-watchlist-contracts.mjs       permanent executable contracts
apps/web/scripts/watchlist-browser-acceptance.mjs     W4B local browser acceptance
apps/web/scripts/watchlist-cloudflare-preview.mjs     W5A hosted Preview acceptance
.github/workflows/watchlist-contracts.yml             permanent contract workflow
.github/workflows/watchlist-browser.yml               local browser workflow
.github/workflows/watchlist-hosted-preview.yml        hosted Preview workflow
```

Ownership rules:

- model and adapter files have no DOM or direct browser-storage mutation;
- storage owns parse, validate, repair, read, write, remove, and storage-event handling;
- URL state owns only `period=7d|30d`; saved ids and filters never enter the URL;
- latest and History controllers own one-response caches and injected request functions;
- combined controller coordinates initial load, period change, refresh, retries, and task-local reuse;
- Watchlist page owns rendering, focus, feedback, list operations, and provider-safe links;
- Channel action owns local save/read state only and makes no data request;
- W3C styles change presentation only;
- W4A verifies permanent contracts without changing runtime behavior;
- W4B exercises the complete candidate locally without changing runtime behavior;
- W5A exercises the exact W4B commit on hosted Cloudflare Preview without changing the deployed candidate.

## 4. Branch and PR sequence

```text
W0   work-watchlist-w0                    complete PR #415
W1   work-watchlist-w1-storage            complete PR #416
W2A  work-watchlist-w2a-latest            complete PR #417
W2B  work-watchlist-w2b-history           complete PR #418
W3A  work-watchlist-w3a-routes            complete PR #419
W3B  work-watchlist-w3b-ui                complete PR #420
W3C  work-watchlist-w3c-candidate         complete PR #421
W4A  work-watchlist-w4-contracts          complete PR #422
W4B  work-watchlist-w4-browser            complete PR #423
W5A  work-watchlist-w5-hosted             completion candidate PR #424
     preview-watchlist-v1
W5B  work-watchlist-w5-production         next after PR #424 merge report
```

Each merged PR requires a full merge report and a new explicit proceed instruction before the next branch begins.

## 5. W1 — local state and storage foundation

Branch: `work-watchlist-w1-storage`

Completed through PR #416.

Implemented:

- exact versioned provider keys;
- provider URL and id normalization;
- immutable add, remove, move, and clear operations;
- duplicate preservation and 50-entry cap;
- unavailable, corrupted, repair, and write-error states;
- same-origin cross-tab storage-event handling;
- clean period URL state;
- no fetch or DOM dependency in the model/storage layer.

## 6. W2A — latest-observation foundation

Branch: `work-watchlist-w2a-latest`

Completed through PR #417.

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

Implemented:

- Twitch and Kick Heatmap normalization;
- one normalized id index per response;
- empty-list zero requests;
- one through fifty entries exactly one provider request;
- cache reuse, explicit refresh, and in-flight deduplication;
- no History interpretation, per-channel request, polling, route, or UI.

## 7. W2B — retained-History and combined foundation

Branch: `work-watchlist-w2b-history`

Completed through PR #418.

```text
present_retained
absent_usable
history_partial
history_unavailable
```

Implemented:

- Twitch and Kick viewer-minute History normalization;
- period Top Streamer, daily appearance, and retained union indexes;
- separate 7d and 30d page-memory caches;
- Back/Forward period restore from memory when available;
- independent latest and retained evidence axes;
- exact request lifecycle and failure isolation;
- no route, UI, API, D1, or History visual change.

## 8. W3A — provider routes and storage-first shell

Branch: `work-watchlist-w3a-routes`

Completed through PR #419.

Implemented:

- `/twitch/watchlist/` and `/kick/watchlist/`;
- provider title, canonical, Open Graph URL, and `noindex,follow`;
- unchanged primary feature tabs;
- local-storage disclosure and recoverable storage states;
- add, remove, move, clear, reset, filter, show, repair, and cross-tab behavior;
- 7d/30d URL state;
- provider Home secondary utility link;
- keyboard and desktop/360px shell gates;
- zero feature-data requests in W3A.

### W3A completion criteria

- routes build and load locally;
- storage behavior is keyboard-operable;
- empty and storage-error states use permanent wording;
- saved ids do not enter metadata or URLs;
- no D1, API, collector, cron, retention, or History visual change;
- no hosted Preview.

## 9. W3B — evidence cards and approved entry points

Branch: `work-watchlist-w3b-ui`

Completed through PR #420 and merge `66ed54cdd0e165c0e47c144a7d3ab27e10d5eefb`.

Implemented:

- combined controller connected to both provider routes;
- independent latest and retained evidence per saved entry;
- loading, present, stale, partial, absent, empty, error, and retry states;
- combined refresh and source-specific retries;
- provider-safe external, Channel, History, and Heatmap links;
- additive `Save to Watchlist` / `Saved in Watchlist` Channel action;
- deterministic desktop and 360px functional gates.

### W3B completion criteria

- one and fifty entries use identical initial request counts;
- uncached and cached period behavior is exact;
- retries request only their source;
- endpoint failures remain isolated;
- permanent limitation labels render;
- Channel save makes no additional request;
- desktop and 360px browser gates pass;
- no API, D1, binding, collector, cron, retention, rollup, or History visual change.

## 10. W3C — responsive, visual, and accessibility candidate pass

Branch: `work-watchlist-w3c-candidate`

Completed through PR #421 and merge `6535397ab1be32866df22a636cff15f7da4e570c`.

Implemented:

- final dark-theme Watchlist hierarchy;
- desktop 1440, tablet 820, mobile 390, and mobile 360 compositions;
- mixed, partial, empty, storage-unavailable, and long-content fixtures;
- visible focus, 44px general/tablet targets, 48px mobile management targets, long-content wrapping, reduced-motion, increased-contrast, and forced-color support;
- full-page deterministic artifacts;
- no serialized, storage, request, API, or product-contract change.

## 11. W4A — executable contract closure

Branch: `work-watchlist-w4-contracts`

Completed through PR #422 and merge `a7324cea387db7477c01d97bf35b762a0bc8ea76`.

W4A consolidated W1 through W3C and permanently rejects Watchlist-specific server APIs, D1/KV/R2/binding/collector/cron additions, polling, service workers, browser-storage fallbacks, per-channel requests, analytics transmission of local ids, metadata/share leakage, primary-tab insertion, and cross-provider mixing.

### W4A completion criteria

- all W1 through W3C foundation verifiers run through one command;
- route, provider, privacy, request, Channel, candidate, and infrastructure boundaries are executable;
- Development policy and documentation governance pass;
- web typecheck and build pass;
- no runtime feature behavior changes;
- no hosted Preview.

## 12. W4B — complete local browser candidate QA

Branch: `work-watchlist-w4-browser`

Completed through PR #423 and merge `c75b4549bb50d7eb54c0135874dba63db0b7cc69`.

Acceptance files:

```text
apps/web/scripts/watchlist-browser-acceptance.mjs
.github/workflows/watchlist-browser.yml
```

Evidence schema:

```text
viewloom-watchlist-local-browser-acceptance-v1
```

Integrated scenarios:

```text
twitch-desktop-integrated
kick-tablet-channel
kick-mobile-integrated
storage-unavailable-mobile
```

### W4B completion criteria

- all four integrated scenarios pass;
- machine-readable evidence reports `result: pass`;
- exact request deltas pass for initial load, period change, Back/Forward, refresh, retries, task-local operations, cross-tab updates, and Channel save;
- Twitch and Kick remain isolated in storage, requests, links, and facts;
- focus, target sizing, long-content, reduced-motion, storage-error, and overflow checks pass;
- W3B and W3C browser regressions pass in the same workflow;
- the complete local candidate is frozen for W5A;
- no runtime feature behavior changes;
- no hosted Preview in W4B.

## 13. W5A — hosted Preview acceptance

Implementation branch: `work-watchlist-w5-hosted`

Hosted branch: `preview-watchlist-v1`

State: completion candidate PR #424.

Hosted candidate:

```text
commit: c75b4549bb50d7eb54c0135874dba63db0b7cc69
branch origin: https://preview-watchlist-v1.viewloom.pages.dev
deployment origin: https://c0228ac1.viewloom.pages.dev
```

The hosted branch points exactly to the W4B merge commit and does not contain W5A verification code.

Acceptance files:

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
docs/work-in-progress/watchlist-w5a-hosted-preview-note.md
```

Evidence schema:

```text
viewloom-watchlist-hosted-preview-acceptance-v1
```

Accepted deployment identity:

```text
environment: preview
branch: preview-watchlist-v1
commit_sha: c75b4549bb50d7eb54c0135874dba63db0b7cc69
```

Accepted binding evidence:

```text
Twitch: DB_TWITCH_HOT -> vl_twitch_hot
Kick:   DB_KICK_HOT -> vl_kick_hot
```

Accepted scenarios:

```text
twitch-desktop-hosted
kick-mobile-hosted
kick-channel-save-hosted
```

Real-data evidence included:

- Twitch real source, 300 latest rows, 63 retained 30d ids, and 56 retained 7d ids;
- Kick authenticated source, 100 latest rows, 59 retained 30d ids, and 51 retained 7d ids;
- real latest/retained, latest-only, retained-only, and deterministic absent ids;
- partial retained-History wording for both providers.

Hosted request evidence:

```text
empty initial load:       0 Heatmap + 0 History
nonempty initial load:    1 Heatmap + 1 History
uncached 7d change:       0 Heatmap + 1 History
cached Back restore:      0 Heatmap + 0 History
combined refresh:         1 Heatmap + 1 History
Channel save:             0 additional requests
```

Responsive evidence:

- no horizontal overflow on Twitch desktop and Kick 390px mobile;
- mobile general targets at least 44px;
- mobile management targets at least 48px.

### W5A completion criteria

- exact Preview branch and SHA match;
- separate Twitch and Kick Pages Functions bindings match expected databases;
- real Heatmap and History responses contain usable ids;
- all three hosted scenarios pass;
- request counts and provider isolation remain exact;
- bounded and partial evidence wording remains honest;
- hosted artifacts are uploaded;
- no runtime feature, API, D1, binding, collector, cron, retention, rollup, or History visual change.

Accepted workflow:

```text
Watchlist Hosted Preview
run: 28162895177
result: success
```

## 14. W5B — production acceptance and documentation closure

Planned branch: `work-watchlist-w5-production`

State: next after PR #424 merge report. The branch does not exist yet.

Scope:

- verify that the accepted candidate is present on `main` and deployed to production;
- verify exact production `/deployment.json` identity;
- verify routes, metadata, APIs, storage, Channel/Home entry points, request counts, provider separation, and responsive behavior;
- record permanent production acceptance SHA and workflow evidence;
- update roadmap, schedule, specification, and plan status;
- transfer stable W5A/W5B evidence into permanent documentation;
- delete and unlink the temporary Watchlist working notes;
- retain permanent regression workflows.

## 15. Preview policy

```text
W0-W4: no hosted Preview required
W5A: deliberate preview-watchlist-v1 hosted acceptance complete
W5B: exact production acceptance required
```

## 16. Scope-change rule

Stop and update the permanent specification before implementation when a branch would require:

- a Watchlist-specific server API;
- D1, KV, or R2 user storage;
- login or cloud sync;
- background polling or alerts;
- a collector or retention change;
- category, language, or session claims;
- cross-provider identity or totals;
- per-channel requests;
- changed provider API schemas;
- Watchlist as a primary visualization tab.

## 17. Stop rule

After each PR merge:

1. issue the full merge report;
2. state the exact current phase and next branch;
3. stop;
4. do not create the next branch until the user explicitly instructs continuation.
