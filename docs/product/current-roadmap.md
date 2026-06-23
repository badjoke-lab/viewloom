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
| Report/export shared layer | R0 boundary audit active | consolidate neutral internals only |
| Session / Category / Watchlist / Alerts | not approved | data-capability audit required first |

Permanent acceptance records:

```text
History:
docs/operations/history-production-acceptance-2026-06-23.md
accepted SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31

Channel:
docs/operations/channel-production-acceptance-2026-06-23.md
accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
closure PR: #408
```

## 2. Immediate priority

Phase 4 R0 is active:

> Audit the current History and Channel Report & Export implementations, freeze the safe shared boundary, and produce a PR-sliced internal consolidation plan without changing runtime output or UI.

Governing documents:

```text
docs/product/report-export-consolidation-plan.md
docs/work-in-progress/report-export-r0-audit.md
```

R0 has fixed the safe shared boundary.

Safe neutral candidates:

- provider type and provider display name;
- filename-segment sanitization;
- filename composition from feature-owned segments;
- CSV syntax escaping;
- finite number to blank string;
- finite number to `null`;
- clipboard transport with fallback;
- text-file Blob download transport;
- internal success/failure result type.

The following remain feature-owned:

- report and short-post prose;
- CSV headers and row models;
- JSON schemas and builders;
- coverage, source/state, and limitation wording;
- History PNG/share-card model and canvas rendering;
- payload capture and request lifecycle;
- DOM selectors, HTML templates, CSS, action order, and visible status copy.

History UI appearance work is pending because screenshots and detailed instructions are not currently available. Until those arrive:

- do not redesign History;
- do not alter History DOM structure or CSS for consolidation convenience;
- do not make speculative visual fixes;
- stop or defer any shared-layer adoption that would alter accepted History rendering or serialized output;
- continue only with neutral helpers, contracts, and tests that do not affect the visible UI.

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

State: completed on 2026-06-23 through PR #408.

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
- temporary C0/C5B notes and workflows retired in PR #408.

Accepted product boundary:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific copy, CSV, JSON, links, and filenames;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

State: R0 active.

Permanent plan:

```text
docs/product/report-export-consolidation-plan.md
```

Temporary audit:

```text
docs/work-in-progress/report-export-r0-audit.md
```

Purpose:

- remove duplicated neutral output infrastructure without changing product semantics;
- preserve provider separation, evidence limits, filenames, schemas, headers, missing-value behavior, request counts, and accepted UI;
- establish one tested primitive layer before either feature adopts it.

#### R0 — implementation and boundary audit

State: active.

Branch:

```text
work-report-export-r0-audit
```

Deliverables:

- current implementation and gate inventory;
- data-flow comparison;
- safe/shared versus feature-owned matrix;
- spreadsheet-safety and filename risk register;
- preservation-test matrix;
- R1–R4 implementation plan.

Exit rule:

- documentation-only diff;
- no runtime, output-byte, DOM, CSS, or visible change;
- R1 branch and contracts are explicit.

#### R1 — neutral shared output primitives

State: queued after R0.

Branch:

```text
work-report-export-r1-shared-output
```

Scope:

- add neutral provider, filename, CSV, finite-value, clipboard, download, and result primitives;
- add direct contract tests;
- do not import or migrate History or Channel code;
- do not change feature output.

#### R2 — conditional History internal adoption

State: conditional after R1.

Branch:

```text
work-report-export-r2-history-adoption
```

Proceed only when exact preservation tests exist and adoption requires no History DOM, CSS, visible string, action-order, report, CSV, JSON, filename, or PNG change. Unsafe adoption is deferred.

#### R3 — Channel internal adoption

State: queued after the safe shared foundation.

Branch:

```text
work-report-export-r3-channel-adoption
```

Adopt only tested neutral helpers while preserving Channel context, report text, CSV rows, JSON schema, feedback, DOM/CSS, provider separation, and one-request behavior. Spreadsheet-safety policy must be explicit before any Channel CSV byte change.

#### R4 — cross-page regression and documentation closure

State: queued.

Branch:

```text
work-report-export-r4-acceptance
```

Completion:

- exact provider separation, filenames, schemas, headers, missing values, and request counts are preserved;
- no visible layout change;
- affected History and Channel matrices are green;
- permanent plan is finalized;
- temporary R0 note is deleted and unlinked;
- roadmap advances to Phase 5.

Preview rule:

- no Preview is required for output-compatible internal consolidation;
- Preview and production acceptance become mandatory if an accepted visible or serialized contract changes.

Explicit Phase 4 non-goals:

- History or Channel visual redesign;
- new report modes or export formats;
- Channel PNG/share cards;
- shared report prose or JSON schemas;
- API, D1, binding, collector, cron, or retention changes.

### Phase 5 — next-feature data-capability audit

State: queued after Phase 4 closure.

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

No candidate moves directly from an idea to implementation.

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
