# ViewLoom Local Watchlist v1 implementation record

Status: completed implementation record
Version: 2.0
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1 complete
Permanent specification: `local-watchlist-spec.md`
Capability authority: `next-feature-data-capability-audit.md`
Production acceptance: `../operations/watchlist-production-acceptance-2026-06-25.md`
Closure PR: #425

## 1. Objective and accepted result

Local Watchlist v1 implemented provider-specific, login-free browser-local Watchlist routes using only:

```text
provider-separated localStorage
one existing provider Heatmap response
one existing provider History response
```

Accepted routes and keys:

```text
/twitch/watchlist/
/kick/watchlist/
viewloom.watchlist.twitch.v1
viewloom.watchlist.kick.v1
maximum entries: 50 per provider
initial visible entries: 12
period=7d|30d
```

Accepted request contract:

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

## 2. Completed branch and PR sequence

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
W5A  work-watchlist-w5-hosted             complete PR #424
     preview-watchlist-v1
W5B  work-watchlist-w5-production         completion PR #425
```

Each merged PR produced a full merge report and the next branch was not created until an explicit proceed instruction.

## 3. Runtime ownership

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
apps/web/src/watchlist-candidate.css                  visual hierarchy and controls
apps/web/src/watchlist-candidate-panels.css           cards and evidence panels
apps/web/src/watchlist-candidate-responsive.css       responsive/accessibility layer
apps/web/src/channel-watchlist.css                    Channel action presentation
apps/web/twitch/watchlist/index.html                  Twitch route
apps/web/kick/watchlist/index.html                    Kick route
```

Ownership remains separated: model and adapters do not own DOM; storage owns local document behavior; URL state owns only period; controllers own one-response cache lifecycles; page code owns rendering and task-local interactions; Channel save owns only browser-local add/read behavior.

## 4. W1 — storage and URL foundation

W1 fixed:

- versioned provider-separated keys;
- provider id and URL normalization;
- immutable add, remove, move, and clear operations;
- duplicate preservation and fifty-entry cap;
- unavailable, corrupted, repaired, and write-error states;
- same-origin cross-tab storage-event handling;
- clean `period=7d|30d` URL state;
- no fetch or DOM dependency in the model/storage layer.

No public Watchlist route was added in W1.

## 5. W2A — latest-observation foundation

W2A fixed:

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

It delivered Twitch and Kick Heatmap normalization, one id index per response, zero requests for an empty list, one request for one through fifty entries, cache reuse, explicit refresh, and concurrent refresh deduplication.

No public Watchlist route was added in W2A.

## 6. W2B — retained History and combined evidence

W2B fixed:

```text
present_retained
absent_usable
history_partial
history_unavailable
```

It delivered provider History normalization, period and daily indexes, separate 7d and 30d caches, Back/Forward memory restore, independent latest and retained evidence axes, exact request counts, and endpoint failure isolation.

No public Watchlist route was added in W2B.

## 7. W3A — routes and storage-first shell

W3A added:

- provider Watchlist routes;
- static provider metadata and `noindex,follow`;
- unchanged primary feature tabs;
- browser-local storage disclosure;
- add, remove, move, filter, show, clear, reset, repair, and cross-tab behavior;
- period URL state;
- provider Home secondary utility links;
- keyboard and desktop/360px shell gates.

W3A made zero feature-data requests.

## 8. W3B — evidence UI and Channel entry point

W3B connected the combined controller to both routes and added:

- independent latest and retained evidence cards;
- exact limitation labels;
- combined refresh and source-specific retries;
- provider-safe external, Channel, History, and Heatmap links;
- additive `Save to Watchlist` / `Saved in Watchlist` Channel action;
- one-through-fifty request invariance;
- desktop and 360px functional gates.

## 9. W3C — visual, responsive, and accessibility candidate

W3C fixed:

- final dark-theme hierarchy;
- Twitch purple and Kick green accents;
- 1440, 820, 390, and 360px compositions;
- mixed, partial, empty, unavailable-storage, and long-content fixtures;
- visible focus;
- 44px general/tablet targets;
- 48px mobile management targets;
- long-content wrapping;
- reduced-motion, increased-contrast, and forced-color support;
- deterministic full-page artifacts.

No storage, request, API, or product-contract behavior changed.

## 10. W4A — executable contract closure

W4A consolidated W1–W3C validation and permanently rejected:

- Watchlist-specific server APIs;
- D1, KV, R2, binding, collector, or cron additions;
- polling and service workers;
- browser-storage fallbacks;
- per-channel requests;
- analytics transmission of local ids;
- metadata or share leakage;
- primary-tab insertion;
- cross-provider mixing.

Permanent command and workflow:

```text
apps/web/scripts/verify-watchlist-contracts.mjs
.github/workflows/watchlist-contracts.yml
```

## 11. W4B — complete local browser acceptance

Accepted files:

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

W4B verified request deltas, cache lifecycle, endpoint failure isolation, cross-tab behavior, Channel save, provider separation, focus, target sizing, wrapping, storage-error behavior, reduced motion, and overflow before freezing the candidate.

Accepted W4B merge:

```text
c75b4549bb50d7eb54c0135874dba63db0b7cc69
```

## 12. W5A — hosted Preview acceptance

Hosted candidate:

```text
branch: preview-watchlist-v1
commit: c75b4549bb50d7eb54c0135874dba63db0b7cc69
deployment URL: https://c0228ac1.viewloom.pages.dev
```

Acceptance files:

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
```

Evidence:

```text
schema: viewloom-watchlist-hosted-preview-acceptance-v1
workflow run: 28164503316
result: pass
artifact id: 7875780143
artifact digest: sha256:c6a120eff8b7ace4f415c0c50dd371286eae6660171542eccb864351145b8252
```

W5A confirmed exact Preview identity, separate provider bindings, real data, bounded and partial wording, request counts, provider isolation, responsive behavior, and zero-request Channel save.

## 13. W5B — production acceptance and documentation closure

Accepted production identity:

```text
environment: production
branch: main
commit: f3e0ee8741e96015c5440df167574b8002fccc0d
pages_url: https://2e557de7.viewloom.pages.dev
```

Acceptance files:

```text
apps/web/scripts/watchlist-production-acceptance.mjs
.github/workflows/watchlist-production-acceptance.yml
docs/operations/watchlist-production-acceptance-2026-06-25.md
```

Evidence:

```text
schema: viewloom-watchlist-production-acceptance-v1
workflow run: 28166806560
result: pass
scenarios: 6 / 6 pass
artifact id: 7876704775
artifact digest: sha256:baad267afc68dca50ca08bf0227e8e0a1e46be3797965e9f982115f734cb5c33
```

Production scenarios:

```text
twitch-home-entry-production
kick-home-entry-production
twitch-desktop-production
kick-mobile-production
twitch-channel-save-production
kick-channel-save-production
```

W5B confirmed exact production identity, bindings, collector and freshness state, real provider data, Home and Channel entry points, route metadata, storage separation, provider-safe links, bounded evidence, request contracts, responsive behavior, and zero-request saves for both providers.

## 14. Permanent acceptance boundary

Local Watchlist v1 remains:

- browser-local;
- provider-specific;
- outside primary feature tabs;
- based on one provider Heatmap and one provider History response;
- explicit about bounded and partial evidence;
- free of authoritative offline, complete-history, exact-session, and provider-wide claims;
- free of login, sync, alerts, polling, server-side user storage, per-channel requests, and cross-provider totals.

No Watchlist-specific API, D1 write or migration, binding change, collector change, cron change, retention change, rollup change, or History UI change was introduced.

## 15. Retained acceptance and regression workflows

```text
.github/workflows/watchlist-storage.yml
.github/workflows/watchlist-latest.yml
.github/workflows/watchlist-history.yml
.github/workflows/watchlist-page.yml
.github/workflows/watchlist-candidate.yml
.github/workflows/watchlist-contracts.yml
.github/workflows/watchlist-browser.yml
.github/workflows/watchlist-hosted-preview.yml
.github/workflows/watchlist-production-acceptance.yml
```

The hosted and production workflows remain available for deliberate operational revalidation. They are not automatic deployment mechanisms.

## 16. Completion rule

Phase 6 is complete after PR #425 merges and its full merge report is issued. No additional Local Watchlist branch is scheduled. Any contract expansion requires a new specification revision and roadmap approval.
