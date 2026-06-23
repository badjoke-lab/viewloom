# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-23

## 1. Rules

- P0 production failures interrupt all planned work.
- P1 defects interrupt the active phase when they block acceptance.
- P2 polish is grouped unless it belongs to the active milestone.
- Runtime completion requires repository checks, browser checks, required Preview validation, exact production deployment identity, and public verification.
- `work-*` branches are ordinary implementation branches; hosted validation uses an approved `preview-*` branch.
- After every merge, report the merge, changed behavior, verification result, full schedule, current position, and next executable step before continuing.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7                            complete
History production acceptance            complete
Channel C0-C5A                           complete
Channel C5B Preview acceptance            complete
Channel C5B production acceptance         complete
Channel temporary files and notes         complete through PR #408
History UI appearance revision            pending screenshots and instructions
Report/export shared-layer audit          next
```

Accepted production revisions:

```text
History: 3cde59cceb09a0c60f48794d6391cf5c356a1b31
Channel: efc14295f0a372b96afac740d6a01571f7582210
```

Current active phase:

```text
Phase 4 — Report & Export shared-layer consolidation
R0 — current implementation and boundary audit
branch: work-report-export-r0-audit
```

## 3. Completed History record

Permanent records:

```text
docs/product/history-and-trends-spec.md
docs/product/history-layout-rebuild-plan.md
docs/operations/history-production-acceptance-2026-06-23.md
```

Accepted result:

- Overview / Archives / Report & Export;
- provider-specific Twitch and Kick History;
- Preview verification with separate D1 bindings;
- exact production SHA acceptance;
- temporary-note retirement.

History UI appearance work is pending because screenshots and detailed instructions are unavailable. Until they arrive:

- do not redesign History;
- do not change History CSS or DOM speculatively;
- do not use shared-layer work to alter History appearance;
- preserve current production behavior and browser gates.

## 4. Completed Channel record

Permanent records:

```text
docs/product/channel-and-streamer-spec.md
docs/product/channel-v1-implementation-plan.md
docs/operations/channel-production-acceptance-2026-06-23.md
```

Completed sequence:

```text
C0   PR #398   audit
C1   PR #399   permanent specification and plan
C2A  PR #400   state, URL, payload, one-request foundation
C2B  PR #401   task shell and evidence header
C3   PR #402   Overview and selected-day interpretation
C4A  PR #403-404  bounded Retained Days and rivalry order
C4B  PR #405   Report & Export
C5A  PR #406   visual, responsive, accessibility, candidate QA
C5B  PR #407-408  Preview, production, and document closure
```

Preview evidence:

```text
branch: preview-channel-v1
candidate SHA: 7feff50bb7233f029e775f764af03bf0c683e941
run: 28027105615
artifact: 7821161692
```

Production evidence:

```text
accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
run: 28028685856
artifact: 7821826483
```

Accepted result:

- Overview / Retained Days / Report & Export;
- one provider History request per period load;
- real Twitch and Kick data;
- Twitch desktop and Kick 390px acceptance;
- provider-specific copy, CSV, JSON, links, and filenames;
- six-card initial archive bound;
- no page-level horizontal overflow;
- no D1, collector, cron, retention, or cross-provider change.

## 5. Active Phase 4 window

### R0 — shared Report & Export audit

State: next.

Branch:

```text
work-report-export-r0-audit
```

Scope:

- inventory History and Channel report/export code and tests;
- compare provider, period, source/state, coverage, filename, CSV, JSON, clipboard, and download behavior;
- identify pure helpers that can be shared without visible changes;
- identify DOM/CSS or History-specific logic that must remain separate;
- create a PR-sliced migration plan before runtime changes.

Completion criteria:

- shared and feature-specific boundaries are explicit;
- no runtime or visual change;
- no History UI change;
- next implementation branch is unambiguous.

### R1 — pure shared contracts and helpers

State: queued after R0.

Candidate scope:

- provider, period, source/state, and coverage labels;
- filename construction and sanitization;
- CSV escaping;
- JSON missing-value policy;
- clipboard and download result types;
- deterministic export metadata;
- unit and static tests.

No DOM, CSS, API, D1, collector, cron, retention, or new output-mode change.

### R2 — safe History adoption

State: conditional.

Proceed only when adoption creates no visible History UI or DOM/CSS change. Otherwise defer until the History UI revision is specified.

### R3 — safe Channel adoption

State: queued after the shared foundation.

Preserve provider/source/state/missing semantics and accepted visible output.

### R4 — cross-page acceptance and closure

State: queued.

Required result:

- provider separation preserved;
- filenames and missing values preserved;
- no additional network request;
- affected workflow matrix green;
- roadmap advances to Phase 5.

## 6. Later phases

```text
Phase 5  next-feature data-capability audit
Phase 6  one approved major expansion
```

Candidates for Phase 5 include Session feasibility, Category/Game, Language, Event layer, local Watchlist, and Alerts. No candidate proceeds directly to implementation.

## 7. Merge report format

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

Do not begin the next PR before this report is issued.
