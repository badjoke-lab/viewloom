# TEMPORARY — History layout rebuild working note

Status: active temporary note
Created: 2026-06-21
Delete when: History layout rebuild is production-verified and stable decisions have been transferred to permanent specifications.

> This file is not a permanent specification. It exists to prevent layout defects, decisions, open questions, and PR sequencing from being lost during the rebuild. It must be deleted in H7 completion work.

## 1. Baseline reviewed

Production screenshots reviewed on 2026-06-21:

- Twitch History full-page desktop capture;
- Kick History full-page desktop capture.

Observed production state:

- individual History functions work;
- Twitch and Kick share the same structural problems;
- the page is visually an implementation-order stack rather than a finished analysis product;
- the page is too long and too dense for normal public use;
- current layout is not accepted as final public quality.

## 2. Problem inventory

### P1 — page purpose is split

The same uninterrupted page mixes:

- analysis dashboard;
- retained archive browsing;
- report/social output generation;
- data export;
- detailed methodology.

A visitor cannot tell which task is primary.

### P2 — all modules have equal visual weight

The following appear as similarly weighted full-width sections:

- period comparison;
- main chart;
- calendar heat;
- report text;
- share card;
- export;
- peak archive;
- battle archive;
- top streamers;
- daily archive;
- coverage/data quality.

Primary analysis and secondary tools are not visually separated.

### P3 — excessive page length

Peak, Battle, and Daily archives are all expanded in one page. Report and share tools also consume permanent vertical space. The amount of scrolling is not justified by the amount of unique information.

### P4 — Top streamers appears too late

Top streamers is a primary History answer but appears after large archive sections. It must move into Overview after the primary chart/calendar flow.

### P5 — report tools interrupt analysis

Report text, share card, and export are separate large sections. They belong to one secondary `Report & Export` task area.

### P6 — repeated information

Period, top streamer, peak, observed days, coverage, and deltas repeat across summary, comparison, inspector, report, share card, and archive cards. Repetition increases page length without increasing understanding.

### P7 — previous-period comparison dominates

Large pale comparison cards appear before the chart and visually outweigh it. Comparison must become a compact delta strip or compact secondary card row.

### P8 — valid data looks disabled or unfinished

Pale gray cards in comparison and battle archive resemble placeholders, disabled controls, or loading skeletons. Valid data must use the shared dark surface system.

### P9 — typography is too small and dense

Archive metadata, buttons, chart inspector labels, coverage notes, and card details require excessive zoom or concentration. Readability must be improved by reducing simultaneous content before increasing font size.

### P10 — archive importance is flat

Peak and Battle entries look equally important. Featured events and meaningful event types are not distinguished.

### P11 — calendar semantics are too subtle

Intensity metric, missing versus real low value, partial/attention state, selected day, and legend meaning are too easy to miss.

### P12 — coverage arrives too late

Detailed methodology may remain low on the page, but a concise coverage state must appear near the summary because it changes how every value should be interpreted.

### P13 — section hierarchy is weak

Repeated small heading + rule + card patterns make it difficult to know where the visitor is during a long scroll.

### P14 — wide desktop space is underused

The page behaves like a long narrow document rather than a desktop analysis workspace. The chart and inspector should use a deliberate wide layout.

### P15 — current mobile risk

The same always-expanded structure will create even more severe mobile scrolling, dense controls, and unreadable archive cards. Mobile cannot be treated as a final CSS compression step.

## 3. Locked direction

The following decisions are approved unless implementation proves a documented blocker.

### D1 — top-level views

```text
Overview
Archives
Report & Export
```

### D2 — default view

Overview is the default entry and contains no fully expanded Peak, Battle, or Daily archive grid and no permanently expanded share card.

### D3 — archive subviews

```text
Daily
Peaks
Battles
```

One subview is active at a time.

### D4 — Top streamers placement

Top streamers moves into Overview before archive-heavy content.

### D5 — comparison treatment

Previous-period comparison becomes a compact delta strip/card row subordinate to the main chart.

### D6 — report grouping

Full report, Short post, Share card, CSV, and JSON become one secondary tool area.

### D7 — dark card system

Valid data uses dark ViewLoom surfaces. Light gray may not be the default valid-data card treatment.

### D8 — bounded initial rendering

Archives use an initial item limit plus load-more or pagination. No archive type may render its entire retained result set by default.

### D9 — data contracts stay stable

The rebuild must not require new D1 schema, collector fields, cron, provider mixing, or new metrics.

### D10 — temporary note lifecycle

This note is updated during H1–H6 and deleted during H7 after final behavior is transferred to permanent docs.

## 4. Target desktop layout notes

### Overview

```text
History header                         provider / state
Period controls                       metric controls
KPI / coverage summary row

Primary trend chart                   Selected-day inspector
Compact previous-period delta strip
Calendar heat
Top streamers                         Key changes / movement
Coverage summary                      Method/details link
```

Design intent:

- content max width approximately 1360–1440px;
- chart receives 65–75% of chart row width;
- inspector receives 25–35%;
- summary/coverage visible before archive/report tasks;
- section spacing is visibly larger than card spacing.

### Archives

```text
Archives tabs: Daily | Peaks | Battles
Featured item where meaningful
Bounded list/grid
Load more or pagination
```

### Report & Export

```text
Report mode: Full | Short
Copy action
Generate/reveal share preview
Download PNG | CSV | JSON
Coverage and limitation note
```

## 5. Target mobile layout notes

- view tabs remain reachable and horizontally safe;
- period and metric controls wrap in a deliberate order;
- KPI cards use 1–2 columns depending on width;
- chart appears before selected-day detail;
- calendar remains legible and selectable;
- Top streamers rows/cards are readable without horizontal page overflow;
- archive subview navigation is touch-friendly;
- archive item count remains bounded;
- report/share/export actions stack cleanly;
- no always-open share preview near the top;
- button text remains at least 14px and tap targets remain usable.

## 6. Typography and spacing reminders

Target starting values, subject to visual QA:

```text
section title: 20–24px
primary value: 20–28px
body: 14–16px
button: >=14px
card label: 12–13px
card gap: 12–16px
section internal gap: 20–24px
major section gap: 48–64px
```

Do not solve density by only reducing text size.

## 7. State-treatment reminders

```text
selected: provider accent border / controlled accent background
partial: amber semantic treatment
missing: neutral or hatched, never observed zero
stale: explicit stale label and timestamp/freshness context
error: red semantic treatment with recovery information
empty: explicit no-observed-data message
demo: unmistakably labeled demo
```

State meaning must not rely on color alone.

## 8. Open questions to resolve during H1/H2

Track answers here, then move stable decisions into the permanent spec.

- Should `view=overview` remain in the URL or be omitted from the canonical default URL?
- Does selected day persist when moving to Archives and Report, or only when returning to Overview?
- Should Archives remember the last active subview per URL only or also per session?
- What is the exact initial item count for Daily, Peaks, and Battles on desktop/mobile?
- Is pagination preferable to load-more for Daily archive?
- Which existing change/rising data is strong enough for a compact `Key changes` panel?
- Which comparison fields remain useful after duplicates are removed?
- Should full coverage methodology use a disclosure panel or a dedicated anchor section?
- How should calendar cells expose metric and coverage to keyboard/screen-reader users?

## 9. PR progress table

| Step | State | PR | Decisions / defects resolved |
|---|---|---|---|
| H0 docs and baseline | completed | #388 | canonical docs reset, baseline inventory, temporary-note lifecycle, documentation-first CI enforcement |
| H1 view shell/state | next | — | — |
| H2 Overview | queued | — | — |
| H3 Archives | queued | — | — |
| H4 Report & Export | queued | — | — |
| H5 visual/responsive | queued | — | — |
| H6 candidate QA | queued | — | — |
| H7 Preview/production/docs cleanup | queued | — | delete this file |

Update this table in each History rebuild PR.

## 10. Full-page visual review checklist

### Above the fold

- Can the visitor identify provider, period, metric, data state, and primary trend?
- Is the main chart more prominent than comparison and export tools?
- Is coverage visible without reading the bottom methodology section?

### Scroll hierarchy

- Are Overview, Archives, and Report tasks clearly separated?
- Does each view have one obvious purpose?
- Are section titles and spacing sufficient to maintain orientation?

### Cards

- Do valid cards look active and complete?
- Are key values larger than metadata?
- Are featured archive entries visibly important?

### Archives

- Is only one archive type expanded?
- Is the initial result count bounded?
- Are Day Flow/Battle Lines links clear and provider-safe?

### Report tools

- Are copy/download actions grouped?
- Is share preview on demand?
- Are missing values preserved honestly?

### Responsive

- No horizontal page overflow?
- Controls usable at 390px width?
- Text readable at normal zoom?
- Keyboard focus visible?
- Long provider/channel/title text wraps safely?

## 11. Deletion checklist

Delete this note only when all are true:

- H1–H6 implementation and QA are complete;
- H7 Preview and production acceptance pass;
- final URL/view behavior is in `history-and-trends-spec.md`;
- final component/layout behavior is in `history-and-trends-spec.md`;
- final PR sequence/status is reflected in roadmap and schedule;
- unresolved questions are either resolved into permanent docs or explicitly deferred in the roadmap;
- `docs/README.md` no longer links this file.

The deletion must occur in the same completion PR that finalizes the permanent documentation.
