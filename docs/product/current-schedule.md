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
Report/export R3 Channel adoption         complete through PR #412
Report/export R4 closure                  complete through PR #413
History UI appearance revision            pending screenshots and instructions
Phase 5 data-capability audit              next, not started
```

Accepted production revisions:

```text
History: 3cde59cceb09a0c60f48794d6391cf5c356a1b31
Channel: efc14295f0a372b96afac740d6a01571f7582210
```

Current active implementation phase:

```text
none
```

Next approved work window:

```text
Phase 5 — next-feature data-capability audit
State: next, not started
Required first step: create a dedicated audit note before implementation
```

Governing permanent records:

```text
docs/product/current-roadmap.md
docs/product/report-export-consolidation-plan.md
docs/operations/report-export-consolidation-acceptance-2026-06-24.md
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
- Preview and production acceptance;
- exact production SHA verification;
- permanent browser gates.

History UI appearance revision remains pending. Until screenshots and explicit instructions exist:

- do not redesign History;
- do not alter History DOM, CSS, button order, labels, or layout;
- begin a new audit only after the missing visual evidence arrives.

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

## 4. Phase 4 completion record

Phase 4 completed in this order:

```text
R0  PR #409
    merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487

R1  PR #410
    merge: 6b90c277460a674e355a7676444ddf10ff296325

R2  PR #411
    merge: 9bd7df7620c87c48e5c2d2834cfdce712ad71e3e

R3  PR #412
    merge: 83a46d286c90a9be503d7110b71b382f0394288e

R4  PR #413
    closure branch: work-report-export-r4-acceptance
```

Accepted shared boundary:

```text
shared:
provider primitive
filename sanitization and composition
CSV syntax escaping
finite number -> blank/null
neutral clipboard transport
neutral text-file download transport
operation result type

feature-owned:
report and short-post prose
CSV schemas and row models
JSON schemas and builders
coverage and limitation wording
History PNG/share card
payload capture and request lifecycle
DOM/CSS/visible feedback
```

History policy remains:

```text
CSV quote: always
spreadsheetSafety: apostrophe
```

Channel policy remains:

```text
CSV quote: minimal
spreadsheetSafety: none
blank missing numeric cells
```

R4 closure result:

- exact R1, History R2, and Channel R3 contracts retained;
- provider separation and request counts retained;
- complete History and Channel regression matrices required on the closure candidate;
- no runtime, UI, serialized-output, API, D1, collector, cron, or retention change;
- permanent plan and acceptance record finalized;
- temporary R0 audit note retired.

## 5. Phase 5 next work

State: next, not started.

Phase 5 is an audit, not an implementation phase.

First branch requirements:

```text
create a dedicated work branch
create a temporary data-capability audit note
inspect current real data paths before proposing features
make no schema, collector, cron, or UI changes during the initial audit
```

Audit candidates:

1. minimal Session page;
2. Category / Game trends;
3. Language trends;
4. Event layer;
5. login-free local Watchlist;
6. Alerts.

Required audit outputs:

- retained field inventory;
- Twitch/Kick capability matrix;
- time resolution and retention limits;
- migration, storage, collector, and cron implications;
- Cloudflare Free cost and operational risk;
- unsupported claims and blockers;
- ranked recommendation;
- one Phase 6 candidate or an explicit no-go conclusion.

No candidate proceeds directly to implementation.

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
