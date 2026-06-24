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
| Next-feature expansion | not approved | Phase 5 audit required first |

Permanent acceptance records:

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
```

## 2. Immediate priority

Phase 4 is complete. The next approved work window is:

```text
Phase 5 — next-feature data-capability audit
State: next, not started
```

Phase 5 must begin with a dedicated audit note and must not start implementation directly.

The audit must answer:

- what retained fields actually exist;
- available time resolution and retention;
- Twitch/Kick parity and provider-specific gaps;
- required D1 migrations or new storage;
- collector, cron, and Cloudflare Free cost;
- whether an honest MVP can be built without unsupported claims;
- which single expansion, if any, should proceed to Phase 6.

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

Accepted result:

- neutral provider, filename, CSV, finite-value, clipboard, download, and result primitives;
- exact History and Channel golden output contracts;
- intentional History/Channel differences preserved;
- provider separation and request counts preserved;
- no visible layout, API, D1, collector, cron, or retention change;
- temporary R0 audit retired.

### Phase 5 — next-feature data-capability audit

State: next, not started.

Candidates to audit:

1. minimal Session page;
2. Category / Game trends;
3. Language trends;
4. Event layer;
5. login-free local Watchlist;
6. Alerts.

No candidate proceeds directly from an idea to implementation.

Phase 5 output must include:

- current data-path inventory;
- provider-by-provider capability matrix;
- unsupported claims and hard blockers;
- storage and collection cost;
- migration and retention implications;
- ranked recommendation;
- one approved Phase 6 candidate or an explicit no-go result.

### Phase 6 — one approved major expansion

State: future.

Tentative priority only when Phase 5 proves technical honesty and affordability:

1. minimal Session page;
2. Category / Game trends;
3. login-free local Watchlist.

## 4. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
- direct implementation of a Phase 5 candidate before audit approval;
- cross-platform combined totals or rankings;
- login or cloud user accounts;
- alerts or notifications;
- AI-generated interpretation;
- full-provider coverage claims;
- exact session history without a validated model;
- unrelated redesigns of accepted core pages;
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
