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

Completed:

- Overview / Archives / Report & Export URL state;
- Daily / Peaks / Battles archive state;
- period, metric, custom dates, selected day, sort, and limit preservation;
- pushState navigation and Back/Forward restoration;
- invalid-state normalization;
- no additional History request on task switching;
- separate Twitch/Kick routes and endpoints;
- accessible tabs and mobile-safe navigation;
- all 26 pull-request workflows passed.

## H2 — Overview rebuild

```text
PR:     #391
State:  completed
Merge:  6fdff2d45d7a0ce6ef90315e01b4b9b06ff9f939
```

Completed:

- 1440px analysis workspace;
- compact hero and controls;
- dominant KPI and chart presentation;
- approximately 73/27 chart/inspector desktop pair;
- compact previous-period comparison;
- calendar after the primary chart flow;
- Top streamers paired with Key changes;
- detailed coverage moved after primary analysis;
- unsupported comparison values shown as Withheld, never invented as zero;
- responsive one-column mobile order;
- no extra History request and no provider crossing;
- all 21 pull-request workflows passed;
- Twitch desktop and Kick mobile artifacts reviewed.

## H3 — Archives rebuild

```text
PR:     #392
State:  completed candidate
Branch: work-history-archives
Base:   6fdff2d45d7a0ce6ef90315e01b4b9b06ff9f939
```

Implemented:

- shared dark archive surface system;
- Daily bounded to nine matching days;
- first visible Daily result labelled Latest matching day and updated after existing filters;
- Peaks bounded to Top 10 with Highest peak featured;
- Battles bounded to Top 10 with Closest daily matchup featured;
- secondary Battle labels derived only from closeness: Very close day, Close day, Competitive day, or Daily matchup;
- explicit statement that day-level aggregates do not prove reversals or exact event times;
- provider-safe Day Flow and Battle Lines links;
- responsive featured cards and mobile single-column layout;
- archive switching without another History API request;
- dedicated contract and browser workflows.

Verification:

- all 23 latest-HEAD workflows passed;
- one Channel Profile Browser attempt timed out, then passed unchanged on failed-job rerun and was non-reproducible;
- Twitch desktop Battle artifact reviewed: featured hierarchy, dark grid, bounded results, readable non-inference copy;
- Kick mobile Daily artifact reviewed: featured latest day, reachable filters/actions, no horizontal overflow;
- Cloudflare Preview and production verification remain deferred to H7.

Merge rule:

- squash merge #392 only while latest HEAD is green;
- H4 becomes active after merge.

## H4 — Report & Export

Queued. Required direction:

- consolidate Full report / Short post into one mode surface;
- make Share card preview on demand;
- combine Copy / PNG / CSV / JSON into one action area;
- preserve existing output data, filenames, null handling, provider separation, and no-extra-fetch behavior;
- make actions usable on mobile.

Open choices to resolve in H4:

- tabs versus segmented mode switch;
- exact share-preview disclosure behavior;
- final action order.

## H5-H7 reminders

H5:

- reconcile typography, spacing, state colors, focus, contrast, reduced motion, tablet/mobile, and remaining placeholder-like surfaces.

H6:

- run latest-complete-candidate typecheck/build and all History regression/browser gates for Twitch/Kick desktop/mobile;
- review full-page screenshot artifacts.

H7:

- create preview branch from verified candidate;
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
| H3 Archives | completed candidate | #392 | 23/23 latest-HEAD workflows passed; artifacts reviewed; merge pending |
| H4 Report & Export | queued | — | — |
| H5 visual/responsive | queued | — | — |
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
- no horizontal overflow at 390px;
- normal zoom is sufficient;
- focus is visible and long text wraps.

## Deletion checklist

Delete this temporary note only after H1-H6 are complete, H7 Preview and production acceptance pass, stable decisions are transferred to permanent documentation, roadmap and schedule are updated, and the docs index no longer links this file.
