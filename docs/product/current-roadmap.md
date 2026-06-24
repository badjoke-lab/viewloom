# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-24

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
| Local Watchlist v1 | W0 specification complete through PR #415 | W1 storage foundation is next; runtime not started |
| Session / Category / Language / Event / Alerts | not approved for immediate implementation | data or infrastructure expansion required |

Permanent acceptance, audit, and specification records:

```text
History:
docs/operations/history-production-acceptance-2026-06-23.md
accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel:
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
W0 PR: #415
```

## 2. Immediate priority

W0 is complete. The next approved work window is:

```text
Phase 6 — Local Watchlist v1
W1 — local state and storage foundation
Branch: work-watchlist-w1-storage
State: next, not started
```

W1 adds only the neutral local model, provider-separated storage layer, id/URL normalization, list operations, period URL-state helper, and executable gates.

W1 must not add:

- public Watchlist routes or HTML;
- Watchlist CSS or final visual design;
- Heatmap or History requests;
- Channel or provider Home entry points;
- API, D1, binding, collector, cron, or retention changes.

History UI appearance work remains pending because screenshots and detailed instructions are unavailable. Until those arrive:

- do not redesign History;
- do not alter History DOM or CSS speculatively;
- begin with a separate audit when the required visual evidence arrives.

## 3. Ordered roadmap

### Phase 1 — production baseline and accepted core

State: completed; permanent maintenance responsibility.

Includes Cloudflare production cutover, separate provider D1 bindings, exact deployment identity, explicit 404 behavior, permanent Production Smoke, and accepted Heatmap, Day Flow, Battle Lines, History, Status, and Channel cores.

Maintenance rule:

- P0 production failures interrupt all planned work;
- P1 defects interrupt the active phase when they block acceptance;
- P2 polish must not silently replace the active phase.

### Phase 1B / 1C — History rebuild and acceptance

State: completed on 2026-06-23.

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

State: conditional maintenance phase.

Enter only for a reproducible production defect, failed permanent gate, or explicit acceptance gap.

### Phase 3 — Channel / Streamer v1

State: completed on 2026-06-23 through PR #408.

Accepted boundary remains:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific links, copy, and exports;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

State: completed through PR #413.

```text
R0  PR #409  boundary audit
R1  PR #410  neutral shared primitives
R2  PR #411  exact-compatible History adoption
R3  PR #412  exact-compatible Channel adoption
R4  PR #413  regression and documentation closure
```

### Phase 5 — next-feature data-capability audit

State: completed through PR #414.

Permanent record:

```text
docs/product/next-feature-data-capability-audit.md
```

Confirmed boundary:

- five-minute bounded snapshots;
- Twitch up to Top 300 with 30-day raw retention;
- Kick up to Top 100 official rows when available with candidate fallback and 60-day raw retention;
- 180-day daily rollups with Top 30 per-stream facts;
- no retained category, language, session id, exact start/end, authoritative offline state, or activity/chat heat.

Candidate decisions:

```text
Local Watchlist v1: approved
Observed Runs research: deferred
Category / Game trends: deferred
Event Layer: deferred
Language trends: not approved
Alerts: not approved
```

### Phase 6 — Local Watchlist v1

State:

```text
W0 complete through PR #415
W1 next, runtime not started
```

Permanent authorities:

```text
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
```

Fixed product contract:

```text
/twitch/watchlist/
/kick/watchlist/
provider-separated browser localStorage
maximum 50 entries per provider
12 entries initially visible
empty list = 0 feature-data requests
nonempty load = 1 Heatmap + 1 History request
period change = 1 History request
explicit refresh = 1 Heatmap + 1 History request
no per-channel request loop
no authoritative live/offline claim
no alerts, login, sync, exact sessions, or cross-provider identity
```

Approved entry points:

```text
Watchlist add form
additive Channel save action
secondary provider Home utility link
```

Watchlist is not a primary feature tab.

Implementation sequence:

```text
W0   specification and plan                         complete through PR #415
W1   local model, storage, and URL state            next
W2A  latest Heatmap adapter and request foundation queued
W2B  History adapter and combined evidence         queued
W3A  provider routes and storage-first shell        queued
W3B  evidence cards and approved entry points       queued
W3C  responsive/accessibility candidate pass        queued
W4A  executable contract closure                    queued
W4B  complete local browser candidate QA            queued
W5A  hosted preview-watchlist-v1 acceptance         queued
W5B  production acceptance and document cleanup     queued
```

W5 requires deliberate Preview and exact production acceptance because Watchlist adds visible public routes.

## 4. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
- public Watchlist routes before W3A;
- Watchlist data fetching before W2A/W2B;
- Watchlist visual implementation before storage and adapters are complete;
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

## 5. Roadmap update rule

Update this file when a phase begins or completes, a blocker changes priority, a feature is approved or deferred, or the pending History UI revision receives enough evidence to begin.

Every implementation PR must state:

```text
Roadmap phase:
Permanent specification or contract:
Implementation plan:
Providers affected:
Data/API/DB/collector changes:
Preview requirement:
Production acceptance requirement:
```
