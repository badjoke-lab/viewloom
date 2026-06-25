# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-25

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick data paths.

Verified production foundations:

- production branch: `main`;
- automatic production deployment: enabled;
- Preview branches restricted to `preview-*`;
- Twitch and Kick Pages Functions use separate D1 bindings;
- collectors expose bounded observations and freshness state;
- explicit 404 behavior is deployed;
- `/deployment.json` identifies the active production branch and commit;
- permanent Production Smoke automation is present.

Current feature state:

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production-ready core | maintain and audit |
| Heatmap | production core complete | verified defects only |
| Day Flow | production core complete | verified defects only |
| Battle Lines | production core complete | verified defects only |
| History & Trends | functional and production acceptance complete | preserve; visual revision pending separate instructions |
| Data Status | production core complete | maintain |
| Channel / Streamer | v1 and production acceptance complete | preserve retained-footprint contract |
| Report/export shared layer | R0–R4 complete through PR #413 | maintain exact contracts |
| Phase 5 capability audit | complete through PR #414 | permanent decision recorded |
| Local Watchlist v1 | W0–W3C complete; W4A completion candidate PR #422 | W4B next after merge report |
| Session / Category / Language / Event / Alerts | not approved for immediate implementation | data or infrastructure expansion required |

Permanent records:

```text
History acceptance:
  docs/operations/history-production-acceptance-2026-06-23.md
  accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel acceptance:
  docs/operations/channel-production-acceptance-2026-06-23.md
  accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
  closure PR: #408

Report & Export consolidation:
  docs/operations/report-export-consolidation-acceptance-2026-06-24.md
  closure PR: #413

Next-feature capability audit:
  docs/product/next-feature-data-capability-audit.md
  closure PR: #414

Local Watchlist v1:
  docs/product/local-watchlist-spec.md
  docs/product/watchlist-v1-implementation-plan.md
  apps/web/docs/watchlist-latest-w2a-contract.md
  apps/web/docs/watchlist-history-w2b-contract.md
  W0 PR: #415
  W1 PR: #416
  W2A PR: #417
  W2B PR: #418
  W3A PR: #419
  W3B PR: #420
  W3C PR: #421
  W4A PR: #422
```

## 2. Immediate priority

The active completion window is:

```text
Phase 6 — Local Watchlist v1
W4A — executable contract closure
Branch: work-watchlist-w4-contracts
PR: #422
State: completion candidate
Preview: not requested
```

W4A adds no runtime feature behavior. It consolidates the accepted W1–W3C contracts into one executable command and one permanent workflow.

Contract files:

```text
apps/web/scripts/verify-watchlist-contracts.mjs
.github/workflows/watchlist-contracts.yml
apps/web/package.json
```

The consolidated verifier reruns and closes:

- storage schema, normalization, repair, mutation, ordering, and provider-key contracts;
- latest Heatmap endpoint, adapter, evidence, cache, request, and failure contracts;
- retained History endpoint, adapter, period cache, combined evidence, request, and failure contracts;
- route, canonical, `noindex,follow`, metadata, clean URL, local-only privacy, and primary-tab contracts;
- exact evidence wording, one generic request seam, empty-list zero-request, source-specific retry, and no per-channel loop contracts;
- Channel `Save to Watchlist` / `Saved in Watchlist` local-only behavior;
- W3C candidate styles, breakpoints, touch targets, focus, long-content, reduced-motion, contrast, and artifact definitions;
- documentation and Development policy governance.

W4A permanently rejects:

```text
Watchlist-specific API routes
Watchlist-specific D1 / KV / R2 / bindings
Watchlist collector or cron work
interval polling or service-worker monitoring
cookie, IndexedDB, or sessionStorage fallback
per-channel network requests
local ids in canonical URLs or metadata
public share/copy-list URLs
analytics transmission of local ids
cross-provider storage, facts, links, requests, or counts
Watchlist as a primary feature tab
```

After PR #422 merges and its full report is issued, the next approved work window is:

```text
W4B — complete local browser candidate QA
Branch: work-watchlist-w4-browser
State: next after merge report
```

History UI appearance work remains pending because screenshots and detailed instructions are unavailable. Do not redesign History or alter its DOM/CSS speculatively.

## 3. Completed product phases

### Phase 1 — production baseline and accepted core

Completed. Includes Cloudflare production cutover, separate provider D1 bindings, deployment identity, explicit 404 behavior, permanent Production Smoke, and accepted Heatmap, Day Flow, Battle Lines, History, Status, and Channel cores.

### Phase 1B / 1C — History rebuild and acceptance

Completed on 2026-06-23.

Accepted structure:

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

Pending separate item:

```text
History UI appearance revision
State: pending screenshots and explicit instructions
```

### Phase 2 — production P0/P1 repair window

Conditional maintenance phase. Enter only for a reproducible production defect, failed permanent gate, or explicit acceptance gap.

### Phase 3 — Channel / Streamer v1

Completed through PR #408.

Accepted boundary:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific links, copy, and exports;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

Completed through PR #413.

```text
R0  PR #409  boundary audit
R1  PR #410  neutral shared primitives
R2  PR #411  exact-compatible History adoption
R3  PR #412  exact-compatible Channel adoption
R4  PR #413  regression and documentation closure
```

### Phase 5 — next-feature data-capability audit

Completed through PR #414.

Confirmed boundary:

- five-minute bounded snapshots;
- Twitch up to Top 300 with 30-day raw retention;
- Kick up to Top 100 official rows when available with candidate fallback and 60-day raw retention;
- 180-day daily rollups with Top 30 per-stream facts;
- no retained category, language, session id, exact start/end, authoritative offline state, or activity/chat heat.

Decisions:

```text
Local Watchlist v1: approved
Observed Runs research: deferred
Category / Game trends: deferred
Event Layer: deferred
Language trends: not approved
Alerts: not approved
```

## 4. Phase 6 — Local Watchlist v1

Fixed product contract:

```text
/twitch/watchlist/
/kick/watchlist/
provider-separated browser localStorage
maximum 50 entries per provider
12 entries initially visible
empty initial load = 0 Heatmap + 0 History
nonempty initial load = 1 Heatmap + 1 History
uncached period change = 0 Heatmap + 1 History
cached period restore = 0 Heatmap + 0 History
combined refresh = 1 Heatmap + 1 History
Retry latest = 1 Heatmap + 0 History
Retry History = 0 Heatmap + 1 History
Channel save = 0 additional requests
no per-channel request loop
no authoritative live/offline claim
no alerts, login, sync, exact sessions, or cross-provider identity
```

### W1 — storage foundation

Completed through PR #416.

- exact versioned provider keys;
- deterministic id and provider-URL normalization;
- immutable list operations;
- duplicate preservation and fifty-entry cap;
- recoverable storage states and provider-isolated clear/reset;
- clean `period=7d|30d` URL state without saved ids.

### W2A — latest-observation foundation

Completed through PR #417.

- schema `viewloom-watchlist-latest-v1`;
- `present_fresh`, `present_stale`, `absent_usable`, and `latest_unavailable`;
- Twitch/Kick Heatmap normalization;
- one provider request for one through fifty entries;
- cache reuse and in-flight deduplication.

### W2B — retained-History and combined foundation

Completed through PR #418.

- schema `viewloom-watchlist-history-v1`;
- `present_retained`, `absent_usable`, `history_partial`, and `history_unavailable`;
- Twitch/Kick viewer-minute History normalization;
- separate 7d/30d page-memory caches;
- independent latest and retained evidence axes;
- exact request lifecycle and failure isolation.

### W3A — provider routes and storage-first shell

Completed through PR #419.

- canonical provider routes with `noindex,follow`;
- unchanged primary feature tabs;
- provider-separated local storage shell;
- add, remove, move, clear, reset, filter, show, repair, and cross-tab behavior;
- provider Home secondary utility link;
- keyboard and desktop/360px shell gates.

### W3B — evidence UI and Channel entry point

Completed through PR #420 and merge `66ed54cdd0e165c0e47c144a7d3ab27e10d5eefb`.

- existing Heatmap and History payloads connected without contract changes;
- exact evidence and limitation wording;
- combined refresh and source-specific retries;
- provider-safe card links;
- local-only Channel save;
- one and fifty entries retain identical request counts;
- no API, D1, binding, collector, cron, retention, rollup, or History visual change.

### W3C — responsive, visual, and accessibility candidate

Completed through PR #421 and merge `6535397ab1be32866df22a636cff15f7da4e570c`.

- final dark-theme hierarchy;
- 1440, 820, 390, and 360 layouts;
- mixed, partial, empty, unavailable-storage, and long-content states;
- focus, touch-target, reduced-motion, contrast, and forced-color support;
- seven deterministic full-page artifacts.

### W4A — executable contract closure

Completion candidate PR #422.

- one consolidated command runs all Watchlist foundation verifiers;
- route, SEO, URL, privacy, provider, request, Channel, candidate, and infrastructure boundaries are executable;
- server-expansion and local-id-leakage tripwires are permanent;
- Development policy and current-document state are checked;
- no runtime feature behavior changes.

Implementation sequence:

```text
W0   specification and plan                         complete PR #415
W1   local model, storage, and URL state            complete PR #416
W2A  latest Heatmap adapter and request foundation complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   completion candidate PR #422
W4B  complete local browser candidate QA           next after merge report
W5A  hosted preview-watchlist-v1 acceptance        queued
W5B  production acceptance and document cleanup    queued
```

Hosted `preview-watchlist-v1` acceptance remains scheduled for W5A.

## 5. Prior transition record retained for audit compatibility

```text
W3A PR #419; W3B completion candidate PR #420
W3C candidate polish is next after merge report
work-watchlist-w3b-ui
work-watchlist-w3c-candidate
apps/web/src/live/channel-watchlist.ts
Retry latest = 1 Heatmap + 0 History
Retry History = 0 Heatmap + 1 History
Channel save = 0 additional requests
no API, D1, binding, collector, cron, retention, rollup, or History visual change
```

## 6. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
- exact Session page or complete session history;
- on-demand multi-day raw JSON scans for session reconstruction;
- Category/Game trends before verified new collection and rollups;
- Language trends without a verified source and accuracy policy;
- Event Layer without an approved source and storage model;
- Alerts without persistent subscriptions and delivery infrastructure;
- cross-platform combined totals or rankings;
- login or cloud user accounts;
- AI-generated interpretation;
- multiple major expansions in parallel.

## 7. Roadmap update rule

Update this file when a phase begins or completes, a blocker changes priority, a feature is approved or deferred, or the pending History UI revision receives enough evidence to begin.
