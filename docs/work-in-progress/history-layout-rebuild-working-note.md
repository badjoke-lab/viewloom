# TEMPORARY — History layout rebuild working note

Status: active temporary note
Created: 2026-06-21
Delete when: H7 production verification and permanent-spec transfer are complete.

## Baseline

Production screenshots reviewed for Twitch and Kick History on 2026-06-21.

## Problem inventory

Confirmed defects before rebuild:

- working functions were stacked in implementation order rather than by user task;
- Overview, archives, publishing, export, and methodology competed at equal weight;
- the page was too long, narrow, pale, and dense;
- Top streamers and coverage appeared too late;
- comparison outweighed the main chart;
- Daily, Peaks, and Battles expanded together;
- valid Peak/Battle data resembled disabled placeholders;
- mobile could not be treated as a final compression pass.

## Locked direction

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

Rules:

- Overview is the clean default URL and initial task.
- Only one archive subview is visible at a time.
- Top streamers belongs in Overview after chart/calendar analysis.
- Previous-period comparison is secondary to the chart.
- Full report, Short post, Share card, CSV, and JSON belong together.
- Valid data uses dark ViewLoom surfaces.
- Archives are bounded on initial render.
- No D1 schema, collector, cron, retention, metric, or provider-mixing change belongs in this rebuild.

## H1 — task view shell

```text
PR:     #390
State:  completed
Merge:  ced6471f9d754919df80c5c47de9ed298658c79a
```

Completed URL/view state, accessible task and archive tabs, Back/Forward restoration, provider separation, and no-fetch view switching. All 26 workflows passed.

## H2 — Overview rebuild

```text
PR:     #391
State:  completed
Merge:  6fdff2d45d7a0ce6ef90315e01b4b9b06ff9f939
```

Completed chart-first Overview, 1440px workspace, KPI hierarchy, compact comparison, calendar/ranking order, Key changes, and responsive single-column behavior. All 21 workflows passed; Twitch desktop and Kick mobile artifacts were reviewed.

## H3 — Archives rebuild

```text
PR:     #392
State:  completed
Merge:  35b6896c2582a04ccae0b162dc6f15629c7b5084
```

Completed:

- dark shared Daily / Peaks / Battles system;
- Daily bounded to nine matching days with filter-following featured state;
- Peak and Battle Top 10 limits with featured hierarchy;
- closeness-only Battle labels and explicit non-inference language;
- provider-safe links and mobile single-column layouts;
- archive switching without another History request;
- deterministic restoration of Top streamers profile links after legacy redraws.

All 24 latest-HEAD workflows passed in one run. Twitch desktop Battle and Kick mobile Daily artifacts were reviewed.

## H4 — Report & Export consolidation

```text
PR:     #393
State:  completed
Merge:  afd8f135f5a741bd44108c3f9a8b6f91afc8e50a
```

Resolved decisions:

- Full report / Short post use one segmented mode switch;
- Share card is hidden and undrawn until explicit preview or PNG download;
- final action order is Copy / Preview share card / Download PNG / Download CSV / Download JSON;
- text, PNG, CSV, and JSON status messages remain inside one workspace;
- existing text, filenames, missing-value handling, spreadsheet safety, JSON schema, provider separation, and no-extra-fetch behavior are unchanged.

All 23 latest-HEAD workflows passed. The integrated H4 gate and strict CSV/JSON export gate passed in the unified workspace. Twitch desktop and Kick mobile artifacts were reviewed.

## H5 — visual and responsive pass

```text
State:  active
Branch: work-history-visual-responsive
Base:   afd8f135f5a741bd44108c3f9a8b6f91afc8e50a
```

Audit findings to resolve:

- History has no final cross-view visual layer after the H2-H4 feature styles;
- many auxiliary labels remain at 8-11px and require normal-zoom readability review;
- several focus states rely on border-color changes without a consistent visible outline;
- partial, missing, stale, and error surfaces need text/icon/pattern support rather than color alone;
- spacing and section-title rhythm differ between Overview, Archives, and Report & Export;
- mobile chart uses an intentional inner horizontal canvas width, but page-level overflow must remain impossible;
- reduced-motion behavior is not yet enforced across History transitions.

H5 implementation direction:

- add one final History visual/responsive stylesheet loaded after H2-H4 styles;
- normalize section typography and spacing without changing data or task order;
- add consistent keyboard focus rings and touch-target minimums;
- strengthen state distinctions without inventing data;
- reconcile desktop, tablet, and 390px mobile layouts;
- add reduced-motion handling and long-text wrapping;
- add a dedicated four-viewport browser gate and screenshot artifacts.

## H6-H7 reminders

H6:

- run latest-complete-candidate typecheck/build and all History regression/browser gates for Twitch/Kick desktop/mobile;
- review full-page screenshot artifacts.

H7:

- create a preview branch from the verified candidate;
- verify Pages Functions, bindings, real retained Twitch/Kick data, and responsive layout;
- merge final candidate and confirm deployed SHA;
- run production smoke and visual acceptance;
- transfer stable decisions to permanent docs;
- update roadmap/schedule;
- delete this temporary note and remove its docs-index link.

## Progress

| Step | State | PR | Result |
|---|---|---|---|
| H0 docs/baseline | completed | #388 | canonical reset and baseline |
| H1 shell/state | completed | #390 | 26/26 workflows passed |
| H2 Overview | completed | #391 | 21/21 workflows passed; artifacts reviewed |
| H3 Archives | completed | #392 | 24/24 workflows passed; artifacts reviewed; merged |
| H4 Report & Export | completed | #393 | 23/23 workflows passed; strict export gate and artifacts reviewed; merged |
| H5 visual/responsive | active | — | cross-view audit complete; implementation active |
| H6 candidate QA | queued | — | — |
| H7 Preview/production/docs cleanup | queued | — | delete this file |

## Full-page acceptance checklist

- provider, period, metric, state, and primary trend are clear;
- chart outweighs comparison and publishing tools;
- concise coverage appears early;
- each task view has one purpose;
- valid data looks active, not disabled;
- one archive type is expanded and results are bounded;
- provider-safe links and publishing actions are clear;
- missing values remain honest;
- no page-level horizontal overflow at 390px;
- normal zoom is sufficient;
- focus is visible and long text wraps;
- reduced-motion users do not receive unnecessary transitions.

## Deletion checklist

Delete this temporary note only after H1-H6 are complete, H7 Preview and production acceptance pass, stable decisions are transferred to permanent documentation, roadmap and schedule are updated, and the docs index no longer links this file.
