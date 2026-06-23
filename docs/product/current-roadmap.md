# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-23

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick data paths.

Verified production foundations:

- production branch: `main`;
- automatic production deployment: enabled;
- Preview branches restricted to `preview-*`;
- Twitch and Kick Pages Functions use separate D1 bindings;
- Twitch and Kick collectors expose bounded observations and freshness state;
- explicit 404 behavior is deployed;
- `/deployment.json` identifies the active production branch and commit;
- permanent Production Smoke automation is present.

Current feature state:

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production-ready core | maintain and audit |
| Heatmap | production core complete | polish only for verified defects |
| Day Flow | production core complete | polish only for verified defects |
| Battle Lines | production core complete | polish only for verified defects |
| History & Trends | functional/layout rebuild and production acceptance complete | maintain accepted behavior; visual revision pending separate instructions |
| Data Status | production core complete | maintain |
| Channel / Streamer | v1 implementation and production acceptance complete | maintain accepted retained-footprint contract |
| Report/export shared layer | not yet consolidated | next executable phase, non-visual first |
| Session / Category / Watchlist / Alerts | not approved | data-capability audit required first |

Permanent acceptance records:

```text
History:
docs/operations/history-production-acceptance-2026-06-23.md
accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel:
docs/operations/channel-production-acceptance-2026-06-23.md
accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
```

## 2. Immediate priority

Channel C0–C5B is closed. The next executable milestone is:

> Audit and consolidate stable Report & Export primitives without changing History or Channel semantics, layout, or CSS.

The first work in this phase is deliberately non-visual:

- provider labels;
- period and coverage labels;
- filename generation and sanitization;
- CSV escaping;
- JSON missing-value policy;
- clipboard and download result handling;
- shared type and test contracts.

History UI appearance work is pending because screenshots and detailed instructions are not currently available. Until those arrive:

- do not redesign History;
- do not alter History DOM structure or CSS for consolidation convenience;
- do not make speculative visual fixes;
- stop any shared-layer change that would alter accepted History rendering;
- continue with pure helpers, contracts, tests, and data-capability work that does not affect the visible UI.

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
- P2 polish is grouped and must not silently replace the active phase.

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

Completion evidence:

- H1–H7 sequence completed;
- complete repository/browser candidate matrix passed;
- deliberate `preview-history-h7` validation passed with separate Preview D1 bindings;
- Twitch desktop and Kick 390px artifacts were reviewed;
- exact production SHA was verified;
- production browser acceptance passed;
- permanent documentation replaced the temporary working note.

Pending separate item:

```text
History UI appearance revision
State: pending screenshots and explicit instructions
Priority: resume when inputs become available
```

The pending visual revision does not reopen H1–H7 functional acceptance and must receive its own audit, specification, PR sequence, Preview validation, and production acceptance.

### Phase 2 — remaining production P0/P1 repairs

State: conditional maintenance phase.

Entry rule:

- a reproducible production defect, failed permanent gate, or explicit acceptance gap exists.

Exit rule:

- the defect is covered by a permanent contract or browser gate and production smoke is green.

### Phase 3 — Channel / Streamer v1

State: completed on 2026-06-23.

Accepted task structure:

```text
Overview
Retained Days
Report & Export
```

Completion evidence:

- C0 audit through PR #398;
- C1 specification through PR #399;
- C2 state and task shell through PRs #400–#401;
- C3 Overview through PR #402;
- C4 retained days, rivalry, report, and export through PRs #403–#405;
- C5A candidate visual/responsive/accessibility acceptance through PR #406;
- deliberate `preview-channel-v1` real-data acceptance through PR #407;
- exact production SHA `efc14295f0a372b96afac740d6a01571f7582210` verified;
- public Twitch desktop and Kick 390px acceptance passed;
- permanent acceptance evidence recorded;
- temporary C0/C5B notes and workflows retired.

Accepted product boundary:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific copy, CSV, JSON, links, and filenames;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

State: active after Channel closure.

Purpose:

- reuse stable output primitives across History and Channel;
- remove duplication without changing data semantics;
- preserve provider separation, evidence limits, and missing-value behavior;
- establish one tested contract before any new output mode is added.

Execution order:

1. audit current History and Channel report/export implementations;
2. freeze shared contracts and migration boundaries;
3. add pure shared helpers and tests;
4. migrate History only when no DOM/CSS/visible change is required;
5. migrate Channel under the same condition;
6. run cross-page provider, output, and browser regressions;
7. stop and defer any visual or structural migration that conflicts with pending History UI work.

Initial shared candidates:

- provider and period labels;
- coverage/source/state wording helpers;
- filename construction and sanitization;
- CSV escaping and blank missing values;
- JSON `null` policy;
- clipboard and download status result types;
- deterministic export metadata.

Explicit non-goals in the first consolidation window:

- History visual redesign;
- Channel visual redesign;
- new report modes;
- PNG/share-card generation;
- data API or schema changes;
- collector, cron, or retention changes.

### Phase 5 — next-feature data-capability audit

State: queued after the safe Phase 4 foundation.

Candidates:

- Session page;
- Category / Game trends;
- Language trends;
- Event layer;
- local Watchlist;
- Alerts.

The audit must determine:

- retained fields and time resolution;
- session reconstructability;
- provider parity;
- retention limits;
- D1 schema and migration requirements;
- cron and collector requirements;
- Cloudflare Free-plan cost;
- whether an honest MVP can be produced without invented precision.

No candidate moves directly from idea to implementation.

### Phase 6 — one approved major expansion

State: future.

Only one major expansion may begin after Phase 5 updates this roadmap and the relevant permanent specification.

Tentative priority when technically honest and affordable:

1. minimal Session page;
2. Category / Game trends;
3. login-free local Watchlist.

## 4. Work not currently scheduled for immediate implementation

The following must not be inserted ahead of the active roadmap without updating this document:

- speculative History visual fixes without screenshots/instructions;
- cross-platform combined totals or rankings;
- login or cloud user accounts;
- alerts or notifications;
- AI-generated interpretation;
- full-provider coverage claims;
- exact session history without a validated model;
- unrelated redesigns of accepted core pages;
- multiple major data expansions in parallel.

## 5. Roadmap update rule

Update this file when:

- a phase begins or completes;
- production acceptance changes the next executable phase;
- a new blocker changes priority;
- a feature is removed, deferred, or approved after data audit;
- a production defect becomes roadmap-level work rather than maintenance;
- the pending History UI revision receives enough evidence to begin.

Every implementation PR must state:

```text
Roadmap phase:
Permanent specification:
Implementation plan:
Providers affected:
Data/API/DB/collector changes:
Preview requirement:
Production acceptance requirement:
```

Work not represented here must first update the roadmap or document an approved exception.
