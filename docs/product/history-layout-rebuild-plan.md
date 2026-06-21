# History layout rebuild implementation plan

Status: active implementation plan
Roadmap phase: Phase 1B / Phase 1C
Permanent specification: `history-and-trends-spec.md`
Temporary execution note: `../work-in-progress/history-layout-rebuild-working-note.md`

## 1. Goal

Reorganize the existing working History functions into a public-quality analysis experience without changing provider data boundaries or inventing new data capabilities.

The work is a layout and information-architecture rebuild, not a new History data project.

## 2. Invariants

Every PR in this plan must preserve:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- current period and metric support;
- supported custom-date behavior;
- selected-day synchronization;
- previous-period data semantics;
- calendar coverage semantics;
- report, short-post, share-card, CSV, and JSON output contracts;
- Peak, Battle, Top streamer, and Daily archive data contracts;
- loading, real, demo, partial, stale, empty, missing, and error distinctions;
- provider-safe Day Flow, Battle Lines, and Channel links;
- no extra API request for copy/download actions;
- no Cloudflare Preview during ordinary `work-*` implementation.

## 3. Planned PR sequence

### H0 — documentation and baseline

Purpose:

- merge the canonical roadmap, schedule, specification, plan, and temporary note;
- capture the current production layout defects;
- freeze the layout completion criteria before implementation.

No UI implementation belongs in H0.

Completion:

- canonical documents are linked from `docs/README.md`;
- repository entry points require documentation-first execution;
- active temporary note is present and clearly deletable.

### H1 — History view-state and shell contract

Purpose:

- introduce Overview / Archives / Report & Export state;
- preserve provider, period, metric, custom dates, and selected day;
- create a responsive shell without removing current functions.

Expected work:

- define History top-level view type and defaults;
- parse and serialize `view` and `archive` URL state;
- add accessible top-level tabs;
- place existing modules into provisional view containers;
- add contract tests for deep-link and invalid-state fallback;
- add desktop/mobile browser checks for view switching and back/forward.

Completion:

- all existing History functions remain reachable;
- no provider crossing;
- direct URLs restore the intended view;
- no duplicate API fetch is introduced solely by switching views.

### H2 — Overview rebuild

Purpose:

- make Overview answer the period-level question without exposing archives and publishing tools in the initial flow.

Expected work:

- compact header and control toolbar;
- KPI/coverage summary row;
- main chart as dominant visual;
- selected-day inspector beside/below the chart;
- compact previous-period delta strip;
- calendar heat placement and legend improvement;
- move Top streamers before archives;
- supported key-change summary where existing data already provides it.

Completion:

- first desktop viewport shows header/controls, summary, and the start or majority of the main chart;
- Top streamers follows the primary chart/calendar flow;
- comparison no longer dominates the chart;
- Overview contains no full archive grids and no permanently expanded share card.

### H3 — Archives rebuild

Purpose:

- stop Daily, Peaks, and Battles from expanding simultaneously.

Expected work:

- Archives subview state: `daily`, `peaks`, `battles`;
- bounded initial rows/cards;
- load-more or pagination;
- featured peak treatment;
- featured/typed battle treatment;
- dark shared card/list styling;
- provider-safe deep links;
- keyboard and mobile archive navigation.

Completion:

- one archive subview is active at a time;
- valid archive data never looks disabled or loading;
- item importance is visible;
- no unbounded initial archive render.

### H4 — Report & Export consolidation

Purpose:

- consolidate report text, short post, share card, CSV, and JSON into one secondary tool area.

Expected work:

- report mode switch within one panel;
- on-demand share preview;
- one action bar for copy/PNG/CSV/JSON;
- existing status and limitation language retained;
- existing filenames and output contracts retained or deliberately standardized;
- mobile action layout.

Completion:

- publishing tools no longer interrupt Overview;
- outputs are generated from the loaded payload;
- existing browser file-content checks continue to pass;
- missing values remain blank/null rather than zero.

### H5 — visual system and responsive pass

Purpose:

- make the restructured page visually coherent and readable.

Expected work:

- section typography scale;
- primary/secondary card hierarchy;
- provider accent discipline;
- partial/missing/stale/error treatment;
- spacing system;
- desktop max width and chart/inspector proportions;
- tablet and mobile layouts;
- focus, contrast, and reduced-motion review.

Completion:

- no horizontal page overflow at supported widths;
- normal browser zoom is sufficient for labels and values;
- section hierarchy is visible during full-page scroll;
- light placeholder-like cards are removed from valid-data views.

### H6 — complete candidate QA

Purpose:

- verify the latest complete candidate, not intermediate commits.

Required checks:

- web typecheck and build;
- History state and URL contract;
- current calendar, comparison, report, share, export, peak, battle, ranking, and daily archive regressions;
- provider naming and separation;
- Twitch desktop browser gate;
- Kick desktop browser gate;
- Twitch mobile browser gate;
- Kick mobile browser gate;
- keyboard tab/subview navigation;
- screenshot artifacts for full-page visual review.

Completion:

- all required latest-HEAD checks pass;
- artifact review finds no clipping, unreadable text, placeholder-looking data cards, or accidental always-expanded section.

### H7 — Cloudflare Preview, production acceptance, and document cleanup

Purpose:

- verify the complete candidate with real Cloudflare runtime and retained data;
- close the temporary documentation lifecycle.

Expected sequence:

1. create a `preview-*` branch from the complete verified candidate;
2. verify Pages Functions, D1 bindings, real Twitch/Kick rendering, and responsive layout;
3. return to the work branch for any material repair;
4. merge the final candidate to `main`;
5. confirm exact production deployment SHA through `deployment.json`;
6. run Production Smoke and manual visual acceptance;
7. transfer stable decisions and final component behavior into `history-and-trends-spec.md`;
8. update roadmap and schedule;
9. delete `docs/work-in-progress/history-layout-rebuild-working-note.md`;
10. remove the temporary-note link from `docs/README.md`.

Completion:

- production Twitch and Kick History are visually accepted;
- expected main SHA is deployed;
- production smoke is green;
- temporary note is deleted;
- permanent docs describe the final implementation;
- Channel / Streamer v1 becomes the active roadmap phase.

## 4. Implementation boundaries

Do not combine this work with:

- D1 schema changes;
- collector or cron changes;
- new History metrics;
- new archive event types;
- Session reconstruction;
- Category/Language trends;
- login, Watchlist, Alerts, or AI text generation;
- unrelated Heatmap, Day Flow, or Battle Lines redesign.

A required exception must update the roadmap/specification before implementation.

## 5. PR requirements

Each History rebuild PR must include:

```text
Roadmap phase:
Specification sections:
Plan step:
Temporary-note decisions addressed:
Providers affected:
Data/API/DB/collector changes:
Targeted checks:
Final checks:
Preview required:
Production verification pending:
```

The PR must update the temporary working note when it resolves, changes, or discovers a layout decision.

## 6. Rollback principle

The rebuild must remain reversible by logical PR. Do not delete working modules merely because they are moved into a new view. Remove old wrappers/styles only after the replacement is covered by current contracts and browser gates.
