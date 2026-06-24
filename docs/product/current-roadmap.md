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
| Local Watchlist v1 | approved Phase 6 candidate | W0 specification is next; runtime not started |
| Session / Category / Language / Event / Alerts | not approved for immediate implementation | data or infrastructure expansion required |

Permanent acceptance and audit records:

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
```

## 2. Immediate priority

Phase 5 is complete. The next approved work window is:

```text
Phase 6 — Local Watchlist v1
W0 — permanent specification and implementation plan
State: next, not started
```

W0 is documentation only. Runtime implementation must not begin until W0 freezes:

- provider-specific routes;
- versioned localStorage schema and migration behavior;
- saved-entry limit;
- latest and retained evidence states;
- exact absence and limitation language;
- request-count contract;
- responsive, accessibility, and SEO rules;
- W1–W5 implementation and acceptance slicing.

Approved Watchlist v1 boundary:

- provider-specific, login-free, localStorage-only saved ids;
- latest evidence from one provider Heatmap request;
- retained evidence from one provider History request;
- all saved ids matched locally;
- no per-channel request pattern;
- no live/offline guarantee;
- no exact sessions, alerts, login, cloud sync, or cross-provider identity;
- no new D1, collector, cron, or retention requirement.

History UI appearance work remains pending because screenshots and detailed instructions are unavailable. Until those arrive:

- do not redesign History;
- do not alter History DOM or CSS speculatively;
- begin with a separate audit when the required visual evidence arrives.

## 3. Ordered roadmap

### Phase 1 — production baseline and accepted core

State: completed; permanent maintenance responsibility.

Includes:

- Cloudflare production cutover;
- separate Twitch/Kick D1 bindings;
- collector and Data Status visibility;
- exact deployment identity;
- explicit 404 behavior;
- permanent Production Smoke;
- accepted Heatmap, Day Flow, Battle Lines, History, Status, and Channel cores.

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

The pending visual revision requires its own audit, specification, PR sequence, Preview validation, and production acceptance.

### Phase 2 — production P0/P1 repair window

State: conditional maintenance phase.

Enter only for a reproducible production defect, failed permanent gate, or explicit acceptance gap.

### Phase 3 — Channel / Streamer v1

State: completed on 2026-06-23 through PR #408.

Accepted structure:

```text
Overview
Retained Days
Report & Export
```

Accepted boundary:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific copy, CSV, JSON, links, and filenames;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

State: completed through PR #413.

Permanent records:

```text
docs/product/report-export-consolidation-plan.md
docs/operations/report-export-consolidation-acceptance-2026-06-24.md
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
apps/web/docs/channel-output-r3-contract.md
```

Completed sequence:

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

Confirmed current data boundary:

- five-minute bounded snapshots;
- Twitch up to Top 300 and 30-day raw retention;
- Kick up to Top 100 official rows when available, candidate fallback, and 60-day raw retention;
- 180-day daily rollups with Top 30 per-stream facts;
- no retained category, language, session id, exact start/end, or authoritative offline state;
- no activity/chat heat.

Candidate decisions:

```text
Local Watchlist v1: approved
Observed Runs research: deferred
Category / Game trends: deferred pending new collection and rollups
Event Layer: deferred pending source/storage decision
Language trends: not approved
Alerts: not approved
```

### Phase 6 — Local Watchlist v1

State: approved; W0 next, runtime not started.

Permanent audit authority:

```text
docs/product/next-feature-data-capability-audit.md
```

Fixed high-level result:

```text
/twitch/watchlist/
/kick/watchlist/
provider-separated localStorage
one Heatmap + one History request per provider load
no N-per-channel requests
no live/offline guarantee
no alerts, login, sync, exact sessions, or cross-provider identity
```

Required PR sequence:

```text
W0  permanent specification and implementation plan
W1  local state and storage foundation
W2  provider data adapters and evidence states
W3  responsive Watchlist UI and approved entry points
W4  candidate QA
W5  Cloudflare Preview, production acceptance, and document cleanup
```

Because Watchlist adds visible public routes, W5 requires deliberate Preview and exact production acceptance.

## 4. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
- Watchlist runtime before W0 specification approval;
- exact Session page or complete session history;
- on-demand multi-day raw JSON scans for session reconstruction;
- Category/Game trends before both collectors retain verified category fields and new rollups exist;
- Language trends without a verified provider source and accuracy policy;
- Event Layer without an approved event source and storage model;
- Alerts without persistent subscriptions, background evaluation, and delivery infrastructure;
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
