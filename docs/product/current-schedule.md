# ViewLoom current execution schedule

Status: source of truth
Schedule reset: 2026-06-21

This schedule replaces earlier rebuild plans that assumed Cloudflare setup, Twitch/Kick mirroring, History creation, or basic page availability were still future work.

## 1. Scheduling rules

- Phase order matters more than calendar dates.
- P0 production failures interrupt the schedule immediately.
- P1 defects interrupt the active phase when they block its acceptance criteria.
- P2 polish is grouped unless it belongs to the active milestone.
- A phase is complete only when repository checks, required browser checks, and required production verification are complete.
- GitHub merge status alone does not complete a phase.
- Each implementation PR must cite the roadmap phase, permanent specification, implementation plan, and active working note when one exists.

## 2. Current position

```text
Cloudflare production cutover        complete
Twitch/Kick D1 binding verification  complete
Collector freshness verification     complete
Core v1 production deployment        complete
History functional expansion         complete
History public layout acceptance     not complete
```

Current active phase:

```text
Phase 1B — History information architecture and layout rebuild
```

## 3. Planned execution windows

The dates below are planning windows, not permission to skip completion criteria.

### 2026-06-22 to 2026-06-23 — documentation reset and History baseline

Deliverables:

- canonical documentation index;
- current roadmap and schedule;
- permanent History specification update;
- History layout implementation plan;
- temporary History working note;
- repository entry-point updates;
- current desktop/mobile screenshot baseline and defect inventory.

Completion criteria:

- all governing files are linked from `docs/README.md`;
- README, AGENTS, CONTRIBUTING, and operating policy require document-first execution;
- temporary-note deletion rule is explicit;
- no History implementation begins before this phase merges.

### 2026-06-24 to 2026-06-25 — H1: layout contract and navigation state

Deliverables:

- Overview / Archives / Report & Export view contract;
- URL and deep-link behavior;
- responsive layout skeleton;
- no loss of existing data state, selected day, metric, period, or provider separation.

Completion criteria:

- state contract and browser gate are present;
- all existing History modules still render through the new shell or remain reachable;
- Twitch and Kick use the same structure with provider-specific accents only.

### 2026-06-26 to 2026-06-28 — H2: Overview rebuild

Deliverables:

- compact header and sticky controls;
- summary KPI row with coverage visible above the fold;
- primary chart with selected-day inspector;
- compact previous-period delta strip;
- calendar heat;
- Top streamers moved into the primary analysis flow;
- key changes / notable movement summary where supported by existing data.

Completion criteria:

- the first screen explains the selected period without scrolling through report or archive tools;
- main chart is the dominant visual element;
- normal desktop text is readable without zoom;
- mobile preserves order and controls without horizontal overflow.

### 2026-06-29 to 2026-07-01 — H3: Archives rebuild

Deliverables:

- Archives view with Daily / Peaks / Battles subviews;
- bounded initial item counts;
- load-more or explicit pagination;
- featured peak and featured battle treatment;
- provider-safe Day Flow and Battle Lines links.

Completion criteria:

- Peak, Battle, and Daily archives are not fully expanded at once;
- archive cards use the shared dark system rather than unfinished-looking light blocks;
- important events are visually ranked;
- keyboard and mobile access are verified.

### 2026-07-02 to 2026-07-03 — H4: Report & Export consolidation

Deliverables:

- Full report and Short post in one tool group;
- Share card preview generated on demand;
- CSV and JSON downloads in one action area;
- consistent provider, period, filename, and coverage wording.

Completion criteria:

- report tools do not interrupt Overview analysis;
- outputs continue to use the already loaded History payload;
- no extra provider crossing or API request is introduced;
- download and copy behavior works on desktop and mobile.

### 2026-07-04 to 2026-07-05 — H5: visual-system and responsive pass

Deliverables:

- typography scale;
- card hierarchy;
- spacing hierarchy;
- selected / partial / missing / stale / error treatments;
- desktop, tablet, and mobile final layouts;
- contrast and keyboard focus review.

Completion criteria:

- no section appears disabled merely because of a light placeholder-like background;
- primary and secondary actions are visually distinct;
- no horizontal overflow at supported mobile widths;
- section hierarchy remains understandable during a full-page scroll.

### 2026-07-06 to 2026-07-07 — H6/H7: final QA, Preview, production acceptance

Deliverables:

- complete History contract and browser gates;
- deliberate `preview-*` validation against real D1 data;
- Twitch and Kick desktop/mobile visual acceptance;
- production deployment identity and smoke verification;
- permanent specification finalization;
- temporary working note deletion.

Completion criteria:

- latest candidate CI is fully green;
- Preview runtime and D1 bindings are verified where required;
- production deploys the expected main SHA;
- Twitch and Kick History pass manual visual acceptance;
- `docs/work-in-progress/history-layout-rebuild-working-note.md` is deleted;
- stable decisions are transferred into permanent specifications;
- roadmap and schedule move History to complete and Channel to active.

## 4. Work after History

### 2026-07-08 to 2026-07-14 — Channel / Streamer v1

Target duration: 5–7 workdays.

Scope:

- period views;
- retained channel trend and appearances;
- peaks and rivalry candidates;
- provider-safe deep links;
- copy summary;
- CSV / JSON export;
- desktop/mobile acceptance.

### 2026-07-15 to 2026-07-18 — report component consolidation

Target duration: 3–4 workdays.

Scope:

- reuse stable report/share/export components across History and Channel;
- standardize labels, coverage copy, filenames, and responsive behavior;
- remove duplication without changing data contracts.

### 2026-07-19 to 2026-07-22 — next-feature data-capability audit

Target duration: 2–4 workdays.

Scope:

- Session feasibility;
- Category/Game and Language retention;
- Event layer inputs;
- Watchlist/Alerts cost and data requirements;
- Free-plan compatibility;
- one recommended next feature.

### 2026-07-23 onward — one approved expansion

Begin only after the audit updates the roadmap and permanent specifications.

## 5. Status update format

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

Do not mark a phase complete because implementation exists on a branch. Completion requires all criteria listed above.
