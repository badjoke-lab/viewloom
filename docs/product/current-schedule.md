# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt all planned work.
- P1 defects interrupt the active phase when they block acceptance.
- P2 polish is grouped unless it belongs to the active milestone.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Output-compatible, non-visual internal changes do not require Preview unless an accepted serialized or visible contract changes.
- After every merge, report the PR, merge SHA, changed and unchanged behavior, verification, full schedule, current position, next work, and proceed judgment before starting another PR.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7                            complete
History production acceptance            complete
Channel C0-C5B                           complete
Channel production acceptance            complete
Report/export R0 boundary audit           complete through PR #409
Report/export R1 shared primitives        complete through PR #410
Report/export R2 History adoption         complete through PR #411
Report/export R3 Channel adoption         active in PR #412
History UI appearance revision            pending screenshots and instructions
```

Accepted production revisions:

```text
History: 3cde59cceb09a0c60f48794d6391cf5c356a1b31
Channel: efc14295f0a372b96afac740d6a01571f7582210
```

Current active phase:

```text
Phase 4 — Report & Export shared-layer consolidation
R3 — conditional Channel internal adoption
branch: work-report-export-r3-channel-adoption
PR: #412
```

Governing documents:

```text
docs/product/report-export-consolidation-plan.md
docs/work-in-progress/report-export-r0-audit.md
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
apps/web/docs/channel-output-r3-contract.md
```

## 3. Completed product phases

### Production and accepted visualizations

Completed:

- Cloudflare production baseline and exact deployment identity;
- separate Twitch and Kick D1 bindings;
- permanent Production Smoke;
- Heatmap;
- Day Flow;
- Battle Lines;
- Data Status.

### History

Permanent records:

```text
docs/product/history-and-trends-spec.md
docs/product/history-layout-rebuild-plan.md
docs/operations/history-production-acceptance-2026-06-23.md
```

Accepted result:

- Overview / Archives / Report & Export;
- separate Twitch and Kick paths;
- Preview acceptance with separate D1 bindings;
- exact production SHA verification;
- production browser acceptance.

History UI appearance revision remains pending. Until screenshots and explicit instructions exist:

- do not redesign History;
- do not alter History DOM, CSS, button order, labels, or layout;
- do not use shared-layer work to make speculative UI changes;
- preserve the accepted browser gates.

### Channel

Permanent records:

```text
docs/product/channel-and-streamer-spec.md
docs/product/channel-v1-implementation-plan.md
docs/operations/channel-production-acceptance-2026-06-23.md
```

Completed sequence:

```text
C0   PR #398       audit
C1   PR #399       permanent specification and plan
C2   PR #400-401   state, URL, payload, one-request task shell
C3   PR #402       Overview
C4   PR #403-405   retained days, rivalry, report and export
C5   PR #406-408   candidate QA, Preview, production, closure
```

Accepted result:

- Overview / Retained Days / Report & Export;
- one provider History request per period load;
- real Twitch and Kick data;
- provider-specific copy, CSV, JSON, links, and filenames;
- no D1, collector, cron, retention, or cross-provider change.

## 4. Phase 4 execution window

### R0 — implementation and boundary audit

State: completed through PR #409.

```text
branch: work-report-export-r0-audit
merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487
```

Fixed boundary:

```text
shared:
provider type/display name
filename sanitization/composition
CSV syntax escaping
finite number -> blank/null
clipboard transport
text-file download transport
internal operation result type

feature-owned:
report prose
short-post prose
CSV schemas and row models
JSON schemas/builders
coverage and limitation wording
History PNG/share card
payload capture
DOM/CSS/status copy
```

### R1 — neutral shared output primitives

State: completed through PR #410.

```text
branch: work-report-export-r1-shared-output
merge: 6b90c277460a674e355a7676444ddf10ff296325
```

Implemented:

```text
apps/web/src/shared/output/provider.ts
apps/web/src/shared/output/filename.ts
apps/web/src/shared/output/csv.ts
apps/web/src/shared/output/values.ts
apps/web/src/shared/output/clipboard.ts
apps/web/src/shared/output/download.ts
apps/web/src/shared/output/result.ts
```

Permanent contract and gate:

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/scripts/verify-shared-output-r1.mjs
.github/workflows/shared-output-r1.yml
```

R1 changed no History or Channel runtime output.

### R2 — conditional History internal adoption

State: completed through PR #411.

```text
branch: work-report-export-r2-history-adoption
merge: 9bd7df7620c87c48e5c2d2834cfdce712ad71e3e
```

Adopted:

```text
finiteNumberOrNull
CSV quote: always
CSV spreadsheetSafety: apostrophe
History filename composition
```

Exact preservation contract:

```text
apps/web/docs/history-output-r2-contract.md
apps/web/scripts/verify-history-output-r2.mjs
```

Preserved:

- schema `viewloom-history-export-v1`;
- complete CSV and JSON output;
- Twitch/Kick report text and filenames;
- visible-preview clipboard fallback;
- temporary anchor and 1000 ms revoke timing;
- one existing provider History request;
- History DOM, CSS, labels, status, action order, and PNG.

Deferred:

```text
provider display helper
clipboard transport
text download transport
```

### R3 — conditional Channel internal adoption

State: active in PR #412.

Adopted only where exact compatibility is proven:

```text
finiteNumberOrBlank
finiteNumberOrNull
CSV cell syntax with:
  quote: minimal
  spreadsheetSafety: none
filename composition with existing Channel segment order
```

Feature implementation:

```text
apps/web/src/live/channel-report.ts
```

Exact preservation contract:

```text
apps/web/docs/channel-output-r3-contract.md
apps/web/scripts/verify-channel-output-r3.mjs
```

Required exact preservation:

- complete Full summary text;
- complete Short post text;
- CSV header, requested-day rows, CRLF, BOM-at-download, blank missing numeric cells, and minimal quoting;
- no implicit spreadsheet formula protection;
- complete `viewloom-channel-v1` JSON and `null` missing numerics;
- Twitch/Kick provider-specific filenames;
- one provider History request per period load;
- no request for missing id;
- current clipboard API and textarea fallback;
- current hidden download anchor and zero-millisecond revoke timing;
- no DOM, CSS, task order, labels, visible feedback, API, D1, collector, cron, or retention change.

Explicitly deferred in R3:

```text
provider display helper
clipboard transport
text download transport
```

Reason:

- provider labels remain embedded in feature-owned report prose;
- current Channel clipboard and download failure paths throw and preserve caller-visible error messages;
- shared transport helpers return neutral result objects and cannot replace those paths without changing failure semantics.

R3 completion criteria:

- Shared Output Contracts workflow succeeds;
- Channel Report Browser succeeds for Twitch desktop and Kick mobile;
- Channel Candidate Acceptance succeeds;
- one-request and provider-separation contracts remain intact;
- complete Web, policy, History, Channel, naming, and Status regression matrix succeeds;
- final diff contains no Channel CSS, HTML template, API, D1, collector, cron, or retention change;
- PR is mergeable with no unresolved review thread.

### R4 — cross-page acceptance and documentation closure

State: queued after the PR #412 merge report.

```text
branch: work-report-export-r4-acceptance
```

Required result:

- provider separation preserved;
- exact History and Channel filenames, schemas, headers, missing values, report text, and request counts preserved;
- no visible layout change;
- complete affected regression matrix green;
- permanent consolidation plan marked completed;
- temporary R0 audit note deleted and unlinked;
- roadmap advances to Phase 5.

## 5. Later phases

```text
Phase 5  next-feature data-capability audit
Phase 6  one approved major expansion
```

Phase 5 candidates:

- Session feasibility;
- Category / Game trends;
- Language trends;
- Event layer;
- local Watchlist;
- Alerts.

No candidate proceeds directly from an idea to implementation.

## 6. Merge report requirement

After every merge, report:

```text
PR and merge SHA
what changed and what did not
verification result
full schedule
current position
next PR and completion criteria
proceed / conditional / stop decision
```

Do not begin the next PR before that report is issued.
