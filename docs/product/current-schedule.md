# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-23

This schedule reflects the verified repository and production state. Earlier windows that treated the History rebuild as future work are historical and no longer control execution.

## 1. Scheduling rules

- Phase order matters more than calendar dates.
- P0 production failures interrupt the schedule immediately.
- P1 defects interrupt the active phase when they block its acceptance criteria.
- P2 polish is grouped unless it belongs to the active milestone.
- A phase is complete only when repository checks, required browser checks, Preview requirements, and production verification are complete.
- GitHub merge status alone does not complete a phase.
- Each implementation PR must cite the roadmap phase, permanent specification, implementation plan, and active working note when one exists.
- `work-*` branches are ordinary implementation branches and do not receive Cloudflare Preview deployments.
- deliberate hosted validation uses an approved `preview-*` branch.

## 2. Current position

```text
Cloudflare production cutover        complete
Twitch/Kick D1 binding verification  complete
Collector freshness verification     complete
Core v1 production deployment        complete
History functional expansion         complete
History layout rebuild H1–H6         complete
History Preview acceptance H7        complete
History production acceptance H7     complete
History temporary-note lifecycle     complete
```

Accepted History production SHA:

```text
3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

Current active phase:

```text
Phase 3 preparation — Channel / Streamer v1 audit and specification reset
```

## 3. Completed History execution record

### H0 — documentation and baseline

State: completed.

Delivered:

- canonical documentation index;
- current roadmap and schedule;
- permanent History specification;
- History layout implementation plan;
- temporary working note and deletion rule;
- production screenshot baseline and defect inventory.

### H1 — layout contract and navigation state

State: completed through PR #390.

Delivered:

- Overview / Archives / Report & Export view contract;
- URL and deep-link state;
- accessible task tabs;
- Back and Forward restoration;
- provider, period, metric, custom-date, and selected-day preservation;
- no additional History request when switching tasks.

### H2 — Overview rebuild

State: completed through PR #391.

Delivered:

- compact header and control hierarchy;
- KPI and coverage summary;
- chart-first primary analysis;
- selected-day inspector;
- compact previous-period comparison;
- calendar and Top streamers in the primary flow;
- responsive desktop/mobile order.

### H3 — Archives rebuild

State: completed through PR #392.

Delivered:

- Daily / Peaks / Battles subviews;
- one visible archive type at a time;
- bounded initial results;
- featured and typed archive entries;
- provider-safe links;
- desktop/mobile/keyboard archive access.

### H4 — Report & Export consolidation

State: completed through PR #393.

Delivered:

- Full report and Short post mode switch;
- on-demand share-card preview;
- one action group for copy, PNG, CSV, and JSON;
- loaded-payload reuse;
- preserved missing-value, provider, filename, and export contracts;
- responsive action layout.

### H5 — visual-system and responsive pass

State: completed through PR #394.

Delivered:

- shared dark surface hierarchy;
- readable typography and spacing;
- visible focus and non-color state symbols;
- reduced-motion behavior;
- desktop, tablet, and 390px mobile layouts;
- no page-level horizontal overflow.

### H6 — complete candidate QA

State: completed through PR #395.

Delivered:

- complete latest-HEAD History and shared-web workflow matrix;
- Twitch/Kick desktop, tablet, and mobile artifacts;
- shell, Overview, Archives, Peak, Battle, comparison, export, Status, and Channel regressions;
- full-page visual review.

### H7 — Preview, production, and document closure

State: completed through PR #396 and the production acceptance gate.

Delivered:

- deliberate `preview-history-h7` deployment;
- separate Preview Twitch/Kick D1 binding verification;
- real retained-data API verification;
- Twitch desktop and Kick 390px hosted browser acceptance;
- exact production deployment identity verification;
- public marker absence and explicit 404 verification;
- production desktop/mobile browser acceptance;
- permanent acceptance record;
- roadmap and schedule transition;
- temporary working-note retirement.

Permanent record:

```text
docs/operations/history-production-acceptance-2026-06-23.md
```

## 4. Next execution window — Channel / Streamer v1 preparation

Target: begin after this documentation cleanup merges.

### C0 — current implementation and data audit

Target duration: 1–2 workdays.

Deliverables:

- identify current Twitch/Kick Channel routes, APIs, entry files, state, styles, and browser gates;
- document retained fields actually available for 7-day and 30-day use;
- identify claims that cannot be made from retained Top 10 appearances;
- inventory current provider-safe links and export code;
- capture desktop/mobile production baseline;
- list P0/P1 defects separately from planned expansion.

Completion criteria:

- current behavior and data limits are written down;
- unsupported exact-session claims are explicitly excluded;
- provider separation and Free-plan constraints are confirmed;
- no implementation begins from an old plan alone.

### C1 — Channel permanent specification and implementation plan

Target duration: 1 workday.

Deliverables:

- permanent Channel / Streamer v1 specification;
- state, URL, period, coverage, and export contracts;
- PR-sliced implementation plan;
- browser and production acceptance matrix;
- temporary working note only when unresolved decisions require one.

Completion criteria:

- scope and non-goals are fixed;
- retained observation language is explicit;
- roadmap and plan agree on the first implementation PR.

### C2 — Channel shell and period state

Target duration: 1–2 workdays.

Provisional scope:

- provider-specific route and page state;
- 7-day / 30-day period controls;
- clean URL and Back/Forward behavior;
- shared loading, partial, stale, empty, error, and demo states;
- no invented session timeline.

Entry criteria:

- C0 and C1 merged;
- current build and production smoke green.

### C3 — retained trend and appearances

Target duration: 2–3 workdays.

Provisional scope:

- retained appearance summary;
- viewer-minute and peak facts supported by current payload;
- trend and comparison language constrained by coverage;
- links back to History and relevant daily/rivalry views.

### C4 — rivalry, copy, and export

Target duration: 1–2 workdays.

Provisional scope:

- retained rivalry candidates;
- copyable provider-specific summary;
- CSV / JSON export;
- consistent filenames and null/blank behavior;
- no cross-provider request or output.

### C5 — visual, browser, Preview, and production acceptance

Target duration: 1–2 workdays.

Completion criteria:

- full latest-HEAD matrix green;
- desktop/tablet/mobile and keyboard acceptance;
- deliberate `preview-*` verification where required;
- exact production SHA and public smoke verification;
- stable decisions transferred to permanent docs;
- temporary note removed when used.

## 5. Work after Channel

### Report/export component consolidation

Target duration: 3–4 workdays after Channel production acceptance.

Scope:

- reuse accepted History and Channel report/share/export primitives;
- standardize labels, filenames, coverage copy, status text, and responsive actions;
- remove duplication without changing data contracts.

### Next-feature data-capability audit

Target duration: 2–4 workdays after component consolidation.

Scope:

- Session feasibility;
- Category/Game and Language retention;
- Event-layer inputs;
- Watchlist/Alerts data and cost;
- Free-plan compatibility;
- one recommended next major feature.

### One approved expansion

Begin only after the audit updates the roadmap and permanent specifications.

## 6. Status update format

When updating this schedule, use:

```text
Phase:
State: queued | active | blocked | completed
Branch / PR:
Completed criteria:
Remaining criteria:
Blockers:
Next executable step:
```

Do not mark a phase complete because implementation exists on a branch. Completion requires all listed repository, hosted, and production criteria.
