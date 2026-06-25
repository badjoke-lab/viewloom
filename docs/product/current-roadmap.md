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
| Portal and provider homes | production core | Phase 8 audit, then verified defects only |
| Heatmap | production core | Phase 8 audit, then verified defects only |
| Day Flow | production core | Phase 8 audit, then verified defects only |
| Battle Lines | production core | Phase 8 audit, then verified defects only |
| History & Trends | production baseline accepted; public-quality P1 repair approved | Phase 9 central repair track |
| Data Status | production core | Phase 8 audit, then verified defects only |
| Channel / Streamer | v1 and production acceptance complete | preserve retained-footprint contract |
| Report/export shared layer | R0–R4 complete through PR #413 | preserve exact shared contracts during History repair |
| Local Watchlist v1 | W0–W5B complete through PR #425 | production accepted; maintain contracts |
| Session / Category / Language / Event / Alerts | not approved for implementation | new data or infrastructure approval required |

## 2. Permanent and active authorities

Permanent accepted records:

```text
History baseline:
  docs/product/history-and-trends-spec.md
  docs/product/history-layout-rebuild-plan.md
  docs/operations/history-production-acceptance-2026-06-23.md
  accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel:
  docs/product/channel-and-streamer-spec.md
  docs/operations/channel-production-acceptance-2026-06-23.md
  closure PR: #408

Report & Export:
  docs/product/report-export-consolidation-plan.md
  docs/operations/report-export-consolidation-acceptance-2026-06-24.md
  closure PR: #413

Local Watchlist v1:
  docs/product/local-watchlist-spec.md
  docs/product/watchlist-v1-implementation-plan.md
  docs/operations/watchlist-production-acceptance-2026-06-25.md
  closure PR: #425
```

Active History repair authorities:

```text
docs/product/history-ui-repair-spec.md
docs/product/history-ui-repair-plan.md
docs/work-in-progress/history-ui-repair-working-note.md
```

The 2026-06-23 History acceptance remains the production baseline. It does not invalidate subsequently verified P1 public-quality defects.

## 3. Current priority

```text
Phase 7 — source-of-truth reset and repair-program lock
Current window: P7A
Branch: work-history-ui-repair-governance
```

P7A corrects stale post-Watchlist documents and formally approves History UI repair as P1 work.

The following defects are approved and do not require another design decision:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy change across the page;
- the main chart lacks the readable scale, ticks, units, and interaction cues required for interpretation;
- chart-side information is too thin or placeholder-like;
- lower-page regions are sparse, weakly prioritized, duplicated, or unclear in purpose;
- desktop, tablet, and mobile do not yet form one coherent analysis workflow.

Additional reference screenshots may refine styling later. They are not a blocker for functional, information-architecture, chart, responsive, or accessibility repair.

## 4. Ordered roadmap

```text
Phase 7   source-of-truth reset and repair-program lock
Phase 8   all-public-surface inventory and browser defect audit
Phase 9   P0/P1 core repair, with History UI repair as the central approved track
Phase 10  cross-site visual and interaction-system consolidation
Phase 11  operations, monitoring, and maintenance lock
Phase 12  Support, legal, Stripe, and release-readiness audit
Phase 13  external launch and feedback classification
Phase 14  next-feature data-capability audit
Phase 15  one separately approved major feature, if any
```

No Phase 15 feature is approved by this roadmap.

## 5. Phase 7 — source reset

Deliverables:

- correct stale root README, roadmap, schedule, and documentation index;
- approve the History repair specification and implementation plan;
- create one active working note;
- update repository policy verification so later branches must reference the active documents;
- preserve completed Watchlist records and all production boundaries.

Completion criteria:

- all canonical documents identify P7A as active;
- Phase 8 P8A is the exact next branch;
- History repair is no longer described as blocked on screenshots;
- no runtime UI, API, database, collector, cron, retention, or binding change is included.

## 6. Phase 8 — public surface audit

Phase 8 records the actual state of all public routes before repair.

### P8A — public surface inventory

Create a machine-readable inventory containing:

- route and provider;
- title, canonical, robots, and entry points;
- API and data-state dependencies;
- visible controls and tasks;
- current contract, browser, Preview, and production gates;
- missing acceptance coverage.

History inventory must include Overview, Archives, Report & Export, period, metric, chart, selected day, comparison, calendar, rankings, coverage, and outputs.

### P8B — browser defect audit

Capture and classify desktop, tablet, mobile, real, partial, stale, empty, missing, demo, and error evidence.

Defect classes:

```text
P0  production outage, materially wrong data, severe privacy/provider failure
P1  primary feature unusable, misleading, or materially incomplete
P2  quality, clarity, consistency, or secondary interaction defect
P3  deferred improvement or feature request
```

The approved History defects remain P1. P8B adds exact reproduction and affected-file evidence; it does not defer or re-approve them.

## 7. Phase 9 — P0/P1 repair

History is the central scheduled repair track.

```text
P9H0 exact History baseline and failing acceptance matrix
P9H1 metric execution repair
P9H2 chart axes, scale, units, and day-interaction repair
P9H3 Overview hierarchy, summary, selected-day, comparison, calendar, and ranking repair
P9H4 Archives and Report & Export task/lower-page repair
P9H5 responsive and accessibility repair
P9H6 complete local candidate QA and permanent regression lock
P9H7 deliberate Preview, exact production acceptance, permanent record, and note cleanup
```

Other Phase 8 P0/P1 defects receive narrow repair branches. P2 polish and new features do not displace History.

History repair must preserve:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- Viewer-minutes and Peak viewers as the only primary metrics in this milestone;
- existing period, selected-day, comparison, calendar, ranking, archive, report, share, CSV, and JSON contracts;
- existing data-state honesty and bounded coverage;
- no new D1 schema, collector, cron, retention, binding, API route, exact session, login, alerts, AI, or cross-provider total.

## 8. Phase 10 — cross-site UI and interaction consolidation

Begin only after Phase 9 P0/P1 repairs are accepted.

Scope:

- shared typography, spacing, surfaces, controls, status, focus, loading, empty, partial, and error patterns;
- shared chart grammar where compatible;
- responsive breakpoint and touch-target consistency;
- removal of duplicated compatibility layers only after affected feature regression coverage exists.

Phase 10 must not be used to postpone P1 History work.

## 9. Phase 11 — operations and maintenance

Scope:

- unified production acceptance matrix;
- collector freshness and D1 usage checks;
- failure runbooks;
- dependency and maintenance cadence;
- artifact and workflow ownership.

Do not add unnecessary cron jobs when existing Status APIs and GitHub Actions can provide the evidence.

## 10. Phase 12 — Support, legal, Stripe, and release readiness

Audit and complete:

- Support;
- Contact;
- Terms;
- Privacy;
- refund policy;
- commercial disclosure;
- footer links;
- Stripe registration and Payment Link consistency;
- desktop and mobile support flow.

External Stripe/dashboard state must be recorded separately from repository-only evidence.

## 11. Phase 13 — external launch and feedback

Publish incrementally rather than simultaneously. Classify responses as bug, copy problem, UX problem, data-capability request, or new feature request.

P0/P1 defects may interrupt. Feature requests do not automatically alter the roadmap.

## 12. Phase 14 — next-feature data-capability audit

Re-evaluate one candidate at a time after the repair and launch evidence exists.

Candidates may include:

- Category / Game Trends;
- Observed Runs;
- Event Layer;
- Language Trends;
- Alerts.

The audit must evaluate provider source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, user value, and maintenance cost.

## 13. Phase 15 — separately approved feature

Phase 15 begins only when Phase 14 approves one candidate and the user explicitly authorizes implementation.

Do not begin Session, Category/Game, Language, Event, or Alerts from the old Phase 5 audit alone.

## 14. Work not approved inside the current milestone

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

After every merge, issue the full merge report, state the exact next branch, and stop until explicit continuation instruction.
