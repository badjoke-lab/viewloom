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
| History & Trends | production acceptance complete | preserve; visual revision pending separate instructions |
| Data Status | production core complete | maintain |
| Channel / Streamer | v1 and production acceptance complete | preserve retained-footprint contract |
| Report/export shared layer | R0–R4 complete through PR #413 | maintain exact contracts |
| Phase 5 capability audit | complete through PR #414 | permanent decision recorded |
| Local Watchlist v1 | W0–W4B complete; W5A completion candidate PR #424 | W5B next after PR #424 merge report |
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
  W4B PR: #423
  W5A PR: #424
```

## 2. Immediate priority

The active completion window is:

```text
Phase 6 — Local Watchlist v1
W5A — hosted Preview acceptance
Implementation branch: work-watchlist-w5-hosted
Hosted branch: preview-watchlist-v1
PR: #424
State: completion candidate
Hosted candidate SHA: c75b4549bb50d7eb54c0135874dba63db0b7cc69
```

W5A deployed only the accepted W4B merge candidate. The hosted branch did not contain the W5A verification code and no runtime feature change was added to the deployed Watchlist.

Accepted deployment identity:

```text
schema: viewloom-deployment-v1
environment: preview
branch: preview-watchlist-v1
commit_sha: c75b4549bb50d7eb54c0135874dba63db0b7cc69
pages_url: https://c0228ac1.viewloom.pages.dev
```

Hosted acceptance files:

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
docs/work-in-progress/watchlist-w5a-hosted-preview-note.md
```

Machine-readable evidence:

```text
schema: viewloom-watchlist-hosted-preview-acceptance-v1
result: pass
scenarios:
  twitch-desktop-hosted
  kick-mobile-hosted
  kick-channel-save-hosted
```

Hosted binding evidence:

```text
Twitch: DB_TWITCH_HOT -> vl_twitch_hot
Kick:   DB_KICK_HOT -> vl_kick_hot
```

Accepted real-data boundary:

```text
Twitch
  source mode: real
  provider state: partial
  latest rows: 300
  retained 30d ids: 63
  retained 7d ids: 56

Kick
  source mode: authenticated
  provider state: fresh
  latest rows: 100
  retained 30d ids: 59
  retained 7d ids: 51
```

Both retained History payloads were partial, and the hosted UI correctly displayed `Retained History is partial` rather than treating bounded evidence as complete presence or absence.

W5A verified:

- exact Preview branch and candidate SHA;
- separate Twitch and Kick Pages Functions bindings;
- real provider Heatmap and History responses;
- provider-isolated routes, requests, storage, links, and facts;
- empty initial load with zero feature-data requests;
- nonempty initial load with one Heatmap and one History request;
- uncached 7d change with one History request only;
- cached Back restore with zero requests;
- combined refresh with one Heatmap and one History request;
- hosted Kick Channel save with zero additional requests;
- desktop and 390px mobile layouts without horizontal overflow;
- 44px mobile general targets and 48px mobile management targets.

Accepted artifacts:

```text
watchlist-w5a-evidence.json
watchlist-w5a.log
watchlist-w5a-twitch-desktop.png
watchlist-w5a-kick-mobile.png
watchlist-w5a-channel-save.png
```

W5A preserves:

```text
empty initial load = 0 Heatmap + 0 History
nonempty initial load = 1 Heatmap + 1 History
uncached period change = 0 Heatmap + 1 History
cached period restore = 0 Heatmap + 0 History
combined refresh = 1 Heatmap + 1 History
Retry latest = 1 Heatmap + 0 History
Retry History = 0 Heatmap + 1 History
task-local list operations = 0 Heatmap + 0 History
Channel save = 0 additional requests
```

It also preserves separate Twitch and Kick routes, storage, requests, links, facts, and counts; no authoritative live/offline claim; no complete-history claim; no exact sessions; no per-channel request loop; no login, sync, or alerts; no API schema or endpoint-meaning change; no D1 write, migration, binding, collector, cron, retention, or rollup change; no History visual change; and no primary Watchlist tab.

After PR #424 merges and its full report is issued, the next approved work window is:

```text
W5B — production acceptance and documentation closure
State: next after PR #424 merge report
Branch: not created
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

```text
W0   specification and plan                         complete PR #415
W1   local model, storage, and URL state            complete PR #416
W2A  latest Heatmap adapter and request foundation complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   complete PR #422
W4B  complete local browser candidate QA           complete PR #423
W5A  hosted preview-watchlist-v1 acceptance        completion candidate PR #424
W5B  production acceptance and document cleanup    next after merge report
```

W1 fixed storage and URL state. W2A fixed latest-observation normalization and one-response request behavior. W2B fixed retained-History normalization, independent evidence axes, period caches, and failure isolation. W3A added provider routes and the storage-first shell. W3B connected evidence and Channel save. W3C fixed responsive and accessibility presentation. W4A closed executable contracts. W4B completed deterministic local browser acceptance. W5A verified the exact W4B candidate on hosted Cloudflare Preview with real provider data and separate bindings.

## 5. Work not scheduled for immediate implementation

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

## 6. Roadmap update rule

Update this file when a phase begins or completes, a blocker changes priority, a feature is approved or deferred, or the pending History UI revision receives enough evidence to begin.
