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
Report/export R2 History adoption         active in PR #411
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
R2 — conditional History internal adoption
branch: work-report-export-r2-history-adoption
PR: #411
```

Governing documents:

```text
docs/product/report-export-consolidation-plan.md
docs/work-in-progress/report-export-r0-audit.md
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
```

## 3. Completed core phases

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

Permanent contracts and gate:

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/scripts/verify-shared-output-r1.mjs
.github/workflows/shared-output-r1.yml
```

R1 changed no History or Channel runtime output.

### R2 — conditional History internal adoption

State: active in PR #411.

Adopted only where exact compatibility is proven:

```text
finiteNumberOrNull
CSV cell syntax with:
  quote: always
  spreadsheetSafety: apostrophe
filename composition with existing History segment order
```

Files changed in the feature layer:

```text
apps/web/src/live/history-export-model.ts
apps/web/src/live/history-export-serialize.ts
apps/web/src/live/history-export.ts
```

Exact preservation contract:

```text
apps/web/docs/history-output-r2-contract.md
apps/web/scripts/verify-history-output-r2.mjs
```

Required exact preservation:

- schema `viewloom-history-export-v1`;
- CSV header order and CRLF line endings;
- blank null cells;
- always-quoted non-null cells;
- apostrophe spreadsheet protection;
- JSON indentation and trailing newline;
- Twitch/Kick filenames;
- report and short-post text;
- current temporary anchor behavior and 1000 ms revoke timing;
- current visible-preview clipboard fallback;
- no additional History request;
- no DOM, CSS, label, status, action-order, or PNG change.

Explicitly deferred in R2:

```text
provider display helper
clipboard transport
text download transport
```

Reason:

- provider labels live in feature-owned report prose;
- shared clipboard fallback differs from accepted History preview-selection UX;
- shared download anchor visibility and default revoke timing differ from accepted History behavior.

R2 completion criteria:

- Shared Output Contracts workflow succeeds;
- History Export and H4 terminal/browser gates succeed;
- existing History archive/browser gates succeed;
- Web build/check/policy gates succeed;
- final diff contains no CSS, HTML template, API, D1, collector, cron, retention, or PNG change;
- PR is mergeable with no unresolved review thread.

### R3 — Channel internal adoption

State: queued after R2 merge report.

```text
branch: work-report-export-r3-channel-adoption
```

Requirements:

- exact Channel report and short-post text;
- exact CSV header and row semantics;
- exact blank missing numeric cells;
- exact `viewloom-channel-v1` JSON;
- exact filenames;
- one History request per loaded period;
- no DOM/CSS/status change;
- explicit decision not to add spreadsheet formula protection unless treated as a deliberate output-contract change.

### R4 — cross-page acceptance and closure

State: queued.

```text
branch: work-report-export-r4-acceptance
```

Required result:

- provider separation preserved;
- exact filenames, schemas, headers, and missing values preserved;
- no additional network request;
- no visible layout change;
- affected History and Channel matrices green;
- permanent plan finalized;
- temporary R0 note deleted and unlinked;
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
