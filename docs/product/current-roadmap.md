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

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production core | Phase 8 inventory/audit, then verified defects only |
| Heatmap | production core | Phase 8 inventory/audit, then verified defects only |
| Day Flow | production core | Phase 8 inventory/audit, then verified defects only |
| Battle Lines | production core | Phase 8 inventory/audit, then verified defects only |
| History & Trends | production baseline accepted; public-quality P1 repair approved | Phase 9 central repair track |
| Data Status | production core | Phase 8 inventory/audit, then verified defects only |
| Channel / Streamer | v1 and production acceptance complete | preserve retained-footprint contract |
| Report/export shared layer | R0–R4 complete through PR #413 | preserve exact contracts during repair |
| Local Watchlist v1 | W0–W5B complete through PR #425 | production accepted; maintain contracts |
| Session / Category / Language / Event / Alerts | not approved for implementation | new data or infrastructure approval required |

## 2. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact active branch and next branch:
  docs/product/current-schedule.md

Complete Phase 7–15 execution program:
  docs/product/post-watchlist-program-plan.md

History repair target and subplan:
  docs/product/history-ui-repair-spec.md
  docs/product/history-ui-repair-plan.md
  docs/work-in-progress/history-ui-repair-working-note.md

Current Phase 8 audit package:
  docs/audits/P8A_SCOPE.md
  docs/audits/README.md
  docs/audits/public-surface-inventory.json
  docs/audits/public-surface-inventory.md
  docs/audits/public-surface-gaps.json
```

Accepted production records remain permanent and are not replaced by audit findings. Verified public-quality defects may still require repair even when a prior production acceptance passed.

## 3. Current priority

```text
Phase 7 — source-of-truth reset and repair-program lock
State: complete through PR #426

Phase 8 — all-public-surface inventory and browser defect audit
Current window: P8A
Current branch: work-public-surface-inventory
Exact next branch: work-public-browser-audit
```

P8A inventories the existing public site and acceptance coverage. It does not repair UI, change APIs, alter D1, modify collectors, change retention, or request a Preview.

The approved History P1 defects remain:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy change across the page;
- the main chart lacks readable scale, ticks, units, and interaction cues;
- chart-side information is too thin or placeholder-like;
- lower-page regions are sparse, weakly prioritized, duplicated, or unclear in purpose;
- desktop, tablet, and mobile do not form one coherent analysis workflow.

Additional reference screenshots may refine styling later. They are not a blocker for functional, chart, information-architecture, responsive, or accessibility repair.

## 4. Ordered roadmap

```text
Phase 7   source-of-truth reset and repair-program lock              complete PR #426
Phase 8   all-public-surface inventory and browser defect audit      active
Phase 9   P0/P1 core repair; History UI is the central track         queued
Phase 10  cross-site visual and interaction-system consolidation      queued
Phase 11  operations, monitoring, and maintenance lock                queued
Phase 12  Support, legal, Stripe, and release-readiness audit         queued
Phase 13  external launch and feedback classification                 queued
Phase 14  next-feature data-capability audit                          queued
Phase 15  one separately approved major feature, if any               not approved
```

No Phase 15 feature is approved by this roadmap.

## 5. Phase 7 — completed source reset

P7A completed through PR #426.

Completed deliverables:

- corrected stale post-Watchlist root and canonical documents;
- approved History UI repair as P1 work;
- removed the incorrect screenshot blocker;
- added the repair specification, plan, and working note;
- updated policy verification;
- named P8A as the exact next branch.

No runtime UI, API, database, collector, cron, retention, binding, or export-schema change was included.

## 6. Phase 8 — public surface audit

### P8A — public surface inventory

Current branch:

```text
work-public-surface-inventory
```

Required outputs:

- route inventory for Portal, provider homes, Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, Status, About, Support/policy surfaces, and 404;
- provider, metadata, entry point, API, control, state, owner, workflow, Preview, production, and gap fields;
- route records and reusable surface profiles;
- human-readable report;
- machine-readable manifest;
- explicit gap ledger;
- validation script and CI workflow.

Completion criteria:

- every public route has an owner and acceptance status;
- missing browser/state coverage is explicit;
- no product repair is mixed into P8A;
- latest-head validation passes;
- P8B is the exact next branch.

### P8B — public browser defect audit

Next branch:

```text
work-public-browser-audit
```

P8B captures 1440, 820, 390, and 360px evidence and real/fresh, partial, stale, empty, missing, demo, error, and loading states where applicable.

Defect classes:

```text
P0  production outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, or secondary interaction defect
P3  deferred improvement or feature request
```

The approved History defects remain P1. P8B adds exact reproduction, ownership, affected-file, and workflow evidence; it does not re-approve or defer them.

## 7. Phase 9 — P0/P1 repair

History is the central scheduled repair track.

```text
P9H0 exact History baseline and failing acceptance matrix
P9H1 metric execution repair
P9H2 chart axes, scale, units, and day interaction
P9H3 Overview hierarchy, summary, selected day, comparison, calendar, and rankings
P9H4 Archives and Report & Export task/lower-page repair
P9H5 responsive and accessibility repair
P9H6 complete local candidate QA and permanent regression lock
P9H7 deliberate Preview, exact production acceptance, permanent record, and note cleanup
```

Other P8B P0/P1 defects receive narrow repair branches. P2 polish and new features do not displace History.

History repair preserves:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- Viewer-minutes and Peak viewers as the only primary metrics in this milestone;
- existing period, selected-day, comparison, calendar, ranking, archive, report, share, CSV, and JSON contracts;
- bounded coverage and honest data states;
- no new D1 schema, collector, cron, retention, binding, API route, exact session, login, alerts, AI, or cross-provider total.

## 8. Phase 10 — cross-site UI and interaction consolidation

Begin only after Phase 9 P0/P1 repairs are accepted.

Tracks:

```text
U10A design tokens and component audit
U10B data-visualization grammar
U10C responsive system
U10D accessibility consolidation
U10E cross-site candidate and production acceptance
```

Scope includes typography, spacing, surfaces, controls, status, focus, loading, empty, partial, error, chart grammar, breakpoints, touch targets, and safe retirement of duplicate compatibility layers after regression coverage exists.

## 9. Phase 11 — operations and maintenance lock

Tracks:

```text
O11A unified production acceptance matrix
O11B collector freshness and capacity monitoring
O11C failure runbooks
O11D dependency and maintenance cadence
```

Prefer existing Status APIs and GitHub Actions over unnecessary cron jobs.

## 10. Phase 12 — Support, legal, Stripe, and release readiness

Tracks:

```text
R12A Support, Contact, Terms, Privacy, refund, disclosure, About, and footer audit
R12B Stripe registration, Payment Link, wording, refund, and mobile-flow verification
R12C launch images, descriptions, limitations, status explanation, links, and FAQ
```

External Stripe/dashboard state must be recorded separately from repository evidence.

## 11. Phase 13 — external launch and feedback

Publish incrementally. Record channel, date, views, clicks, responses, misunderstood functions, defects, and requests.

Classify feedback as bug, copy problem, UX problem, data-capability request, or new-feature request. P0/P1 may interrupt. Feature requests do not automatically alter the roadmap.

## 12. Phase 14 — next-feature data-capability audit

Re-evaluate one candidate at a time after repair and launch evidence exists.

Candidates may include:

- Category / Game Trends;
- Observed Runs;
- Event Layer;
- Language Trends;
- Alerts.

Evaluate provider source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, user value, overlap, and maintenance cost.

Approve zero or one candidate.

## 13. Phase 15 — separately approved feature

Phase 15 begins only when Phase 14 approves one candidate, a permanent specification and branch sequence exist, and the user explicitly authorizes implementation.

Do not begin Session, Category/Game, Language, Event, or Alerts from the old Phase 5 audit alone.

## 14. Work not approved inside the current program window

- new History primary metrics;
- new History archive types;
- exact session reconstruction;
- category or language collection;
- cross-platform totals or rankings;
- login or cloud accounts;
- alerts or background monitoring;
- AI-generated interpretation;
- multiple major feature expansions in parallel.

## 15. Roadmap update rule

Update this file when a phase begins or completes, a P0/P1 blocker changes order, a repair changes scope, or a future feature is approved or deferred.

After every merge, issue the full merge report, update current state, name the exact next branch, and stop until explicit continuation.
