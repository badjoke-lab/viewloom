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
| Report/export shared layer | R0 and R1 complete; R2 active | adopt only exact-compatible neutral helpers |
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

Phase 4 R2 is active:

> Replace only History output helpers whose accepted behavior can be proven exact, and defer every helper that would alter History output, UI, or fallback behavior.

Governing documents:

```text
docs/product/report-export-consolidation-plan.md
docs/work-in-progress/report-export-r0-audit.md
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
```

R2 safe adoption:

- finite number to `null` inside the export model;
- CSV syntax using explicit History options;
- filename composition using the existing feature-owned segment order.

R2 deferred adoption:

- provider display helper;
- clipboard transport;
- text-file download transport;
- report/short-post builders;
- JSON builder;
- PNG/share card;
- payload capture;
- DOM, CSS, action order, labels, and visible status.

History UI appearance work remains pending because screenshots and detailed instructions are unavailable. Until those arrive:

- do not redesign History;
- do not alter History DOM or CSS for consolidation convenience;
- do not make speculative visual fixes;
- stop or defer any adoption that changes accepted rendering or serialized output.

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

Completion evidence:

- H1–H7 completed;
- repository and browser candidate matrix passed;
- `preview-history-h7` passed with separate Preview D1 bindings;
- Twitch desktop and Kick 390px artifacts reviewed;
- exact production SHA verified;
- production browser acceptance passed.

Pending separate item:

```text
History UI appearance revision
State: pending screenshots and explicit instructions
```

The pending visual revision does not reopen functional acceptance and requires its own audit, specification, PR sequence, Preview validation, and production acceptance.

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

Completion evidence:

- C0 through C5B completed in PRs #398–#408;
- deliberate `preview-channel-v1` real-data acceptance passed;
- exact production SHA verified;
- Twitch desktop and Kick 390px public acceptance passed;
- temporary implementation notes retired.

Accepted boundary:

- one provider at a time;
- one History request per period load;
- retained daily Top 10 footprint, not provider-wide analytics;
- absence does not prove offline status;
- no exact session reconstruction;
- provider-specific copy, CSV, JSON, links, and filenames;
- no D1, collector, cron, or retention change.

### Phase 4 — Report & Export shared-layer consolidation

State: R2 active.

Permanent plan:

```text
docs/product/report-export-consolidation-plan.md
```

Temporary audit retained until R4:

```text
docs/work-in-progress/report-export-r0-audit.md
```

Purpose:

- remove duplicated neutral infrastructure without changing product semantics;
- preserve provider separation, filenames, schemas, headers, missing values, request counts, and UI;
- keep report prose, data models, and visible behavior feature-owned.

#### R0 — implementation and boundary audit

State: completed through PR #409.

```text
merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487
```

#### R1 — neutral shared output primitives

State: completed through PR #410.

```text
merge: 6b90c277460a674e355a7676444ddf10ff296325
```

Added neutral provider, filename, CSV, finite-value, clipboard, download, and result primitives with direct executable contracts. R1 changed no feature output.

#### R2 — conditional History internal adoption

State: active in PR #411.

```text
branch: work-report-export-r2-history-adoption
```

Adopted:

```text
finiteNumberOrNull
CSV quote: always
CSV spreadsheetSafety: apostrophe
History filename composition
```

Exact golden verification covers:

- `viewloom-history-export-v1` model;
- complete CSV bytes and CRLF endings;
- complete JSON serialization;
- complete report text for Twitch and Kick;
- provider-specific filenames;
- deferred clipboard/download behavior;
- existing History browser contracts.

Deferred because exact feature behavior differs:

```text
provider display helper
clipboard transport
text download transport
```

Completion requirements:

- exact output contract succeeds;
- History Export and H4 gates succeed;
- no extra History request;
- no DOM, CSS, visible string, action-order, report, JSON, filename, or PNG difference;
- Twitch and Kick browser gates pass.

#### R3 — Channel internal adoption

State: queued after the R2 merge report.

```text
branch: work-report-export-r3-channel-adoption
```

Channel adoption must preserve:

- report and short-post wording;
- CSV headers, rows, and blank missing values;
- `viewloom-channel-v1`;
- provider-specific filenames;
- visible feedback and DOM/CSS;
- one History request per period.

Spreadsheet formula safety must not be added silently because that would change Channel CSV bytes.

#### R4 — cross-page regression and documentation closure

State: queued.

```text
branch: work-report-export-r4-acceptance
```

Completion:

- exact provider separation, filenames, schemas, headers, and missing values preserved;
- no additional network request;
- no visible layout change;
- affected History and Channel matrices green;
- permanent plan finalized;
- temporary R0 note deleted and unlinked;
- roadmap advances to Phase 5.

Preview rule:

- no Preview for output-compatible internal consolidation;
- Preview and production acceptance become mandatory if an accepted visible or serialized contract changes.

### Phase 5 — next-feature data-capability audit

State: queued after Phase 4 closure.

Candidates:

- Session page;
- Category / Game trends;
- Language trends;
- Event layer;
- local Watchlist;
- Alerts.

The audit must determine retained fields, time resolution, provider parity, retention, migrations, cron/collector cost, and whether an honest MVP is possible.

### Phase 6 — one approved major expansion

State: future.

Tentative priority when technically honest and affordable:

1. minimal Session page;
2. Category / Game trends;
3. login-free local Watchlist.

## 4. Work not scheduled for immediate implementation

- speculative History visual fixes without screenshots and instructions;
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
