# ViewLoom History & Trends specification

Status: accepted production product specification
Version: 1.1-accepted
Last updated: 2026-06-23
Accepted production SHA: `3cde59cceb09a0c60f48794d6391cf5c356a1b31`

## 1. Purpose

History & Trends is the retained-trends view for one provider at a time.

Fixed product roles:

```text
Heatmap      = Now
Day Flow     = Today / selected UTC day
Battle Lines = Rivalry
History      = Trends across retained days
```

History is not a raw log dump. It helps a visitor understand what changed across a selected period, identify important days and streamers, inspect retained peaks and rivalry evidence, and move into provider-specific daily, rivalry, or channel detail.

The accepted page is a task-oriented analysis product, not a vertical stack of every available function.

## 2. Provider separation

History is always provider-specific.

```text
/twitch/history/
/kick/history/
```

Mandatory rules:

- no combined Twitch/Kick totals;
- no cross-provider ranking;
- no shared D1 query across providers;
- no wording that implies complete provider-wide coverage;
- provider-specific routes, labels, accents, links, filenames, exports, and report text;
- shared layout and renderer code may be reused, but data and claims remain separated;
- task switching never changes provider;
- copy, share, and download actions never fetch the other provider.

## 3. Accepted functional scope

History supports:

- Last 7 days;
- Last 30 days;
- supported custom periods;
- Viewer-minutes and Peak viewers metrics;
- period summary and observed-day scope;
- daily trend chart;
- selected-day inspector;
- previous-period comparison when comparable;
- calendar heat;
- Top streamers and supported ranking sorts;
- change / rise information when supported;
- Daily archive;
- Peak archive;
- Battle archive based on retained daily aggregates;
- loading, real, partial, stale, empty, missing, demo, and error states;
- Full report;
- Short post;
- on-demand share-card preview and PNG download;
- CSV export;
- JSON export;
- provider-safe links to Day Flow, Battle Lines, and Channel pages.

These functions must remain reachable without being displayed as equal-priority, always-expanded sections.

## 4. Primary user questions

History answers these questions in order:

1. What happened across the selected period?
2. Which days, streamers, peaks, or rivalry records were most important?
3. How reliable and complete is the observed data?
4. Where can a specific day, battle, or channel be inspected?
5. How can the current provider view be reused as text, image, CSV, or JSON?

The initial Overview prioritizes questions 1–3. Archive exploration and publishing are separate tasks.

## 5. Accepted information architecture

History uses three top-level task views:

```text
Overview
Archives
Report & Export
```

Archives contains:

```text
Daily
Peaks
Battles
```

Preferred URL state:

```text
/twitch/history/
/twitch/history/?view=archives&archive=daily
/twitch/history/?view=archives&archive=peaks
/twitch/history/?view=archives&archive=battles
/twitch/history/?view=report
```

Equivalent Kick routes use `/kick/history/`.

Rules:

- Overview is the default and uses the clean History URL;
- `view=overview` may be normalized away;
- task and archive changes preserve provider, period, metric, supported custom dates, sort, limit, and selected day when relevant;
- invalid view or archive values fall back safely without discarding valid state;
- task and archive controls are keyboard accessible;
- browser Back and Forward restore previous History state;
- direct links restore the intended task and archive;
- changing task or archive does not trigger another History API request;
- only one top-level task is visible at a time;
- only one archive subview is visible at a time.

## 6. Shared header and controls

The page header contains:

- `History & Trends`;
- provider eyebrow and label;
- one-sentence purpose;
- current period;
- current metric;
- data state;
- observed days / requested days.

Controls:

- Last 7 days;
- Last 30 days;
- Custom;
- Viewer-minutes;
- Peak viewers;
- Copy current view.

Desktop may keep controls in a compact toolbar. Mobile wraps them into ordered full-width groups and must not create horizontal page overflow.

## 7. Overview

Overview is the default analysis surface.

Accepted order:

1. compact header and scope summary;
2. period and metric controls;
3. task tabs;
4. summary KPIs including coverage;
5. primary trend chart and selected-day interpretation;
6. compact previous-period comparison;
7. calendar heat;
8. Top streamers and supported key changes;
9. concise coverage explanation and links to detailed status/methodology.

### 7.1 Summary KPIs

The summary presents high-value period facts rather than repeating the full report.

Supported facts may include:

- selected metric total or aggregate;
- peak value and peak day;
- top streamer;
- biggest supported rise;
- observed days / requested days;
- partial and missing counts;
- concise coverage state.

### 7.2 Trend chart and selected day

The trend chart is the dominant Overview visual.

The selected-day interpretation may include:

- UTC date;
- selected metric value;
- peak viewers;
- top streamer;
- observed stream count and minutes;
- coverage state;
- provider-safe Day Flow and Battle Lines links.

Selecting a chart day or calendar day keeps the chart, inspector, archive links, and URL state synchronized.

Mobile stacks the selected-day interpretation after the chart.

### 7.3 Previous-period comparison

Previous-period comparison is secondary to the main chart.

Rules:

- current and previous scopes must be aligned before percentage changes are shown;
- incomplete or unequal scopes use `partial` or `unavailable` language;
- unavailable values are not rendered as invented zeroes;
- the comparison remains compact and does not dominate Overview.

### 7.4 Calendar heat

Calendar heat communicates daily intensity and coverage together.

Required behavior:

- metric meaning is visible;
- selected day is distinct;
- missing is distinguishable from a real low value;
- partial / attention is distinguishable from missing;
- the legend does not rely on color alone;
- keyboard focus and selection are supported.

### 7.5 Top streamers

Top streamers belongs in Overview before archive-heavy content.

Required behavior:

- bounded initial rows;
- supported sorts remain accessible;
- selected metric and ranking meaning are visible;
- provider-safe Channel links;
- no implication that retained ranking equals a complete provider ranking;
- desktop may use the accepted metric ledger table;
- mobile uses a readable stacked treatment rather than page-level horizontal scrolling.

## 8. Archives

Archives contains Daily, Peaks, and Battles. Only one is visible at a time.

General rules:

- preserve provider, period, metric, and selected day;
- use the shared dark surface system;
- visually rank featured and supporting entries;
- keep valid data distinct from disabled/loading states;
- empty, partial, missing, and unavailable evidence remain explicit;
- archive switching does not refetch History.

### 8.1 Daily

Default visible result count:

```text
9
```

Daily entries may show:

- UTC date;
- selected metric;
- peak viewers;
- top streamer;
- observed stream count/minutes;
- coverage state;
- Open Day Flow;
- Open Battle Lines.

Filtering and Show all / Show recent controls may retain additional entries in the DOM, but only the accepted bounded set is visible by default.

### 8.2 Peaks

Default visible result count:

```text
10
```

The largest or most relevant peak receives featured treatment. Peak entries may show:

- value;
- date/time when supported;
- streamer;
- period rank;
- coverage state;
- provider-safe day/channel links.

### 8.3 Battles

Default visible result count:

```text
10
```

Battle archive records are derived from retained daily aggregate evidence. They may show:

- pair names;
- daily closeness or retained gap evidence;
- daily aggregate basis;
- day-only precision;
- provider-safe Battle Lines link for the selected date and pair.

Mandatory evidence language:

- do not claim an exact reversal timestamp when only daily aggregates exist;
- do not infer an exact event sequence;
- do not convert closeness evidence into a stronger unsupported battle claim;
- keyboard Enter/Space activation must target the relevant History day.

## 9. Report & Export

Report & Export is one secondary workspace.

Modes:

```text
Full report
Short post
```

Actions:

```text
Copy report
Preview share card
Download PNG
Download CSV
Download JSON
```

Rules:

- all outputs reuse the already loaded provider response;
- no output action triggers provider crossing;
- share-card preview remains hidden until requested;
- copy, PNG, CSV, and JSON status messages remain in the workspace;
- report text includes provider, period, metric, observed scope, data state, source, and limitation language;
- missing numeric CSV cells remain blank;
- missing numeric JSON values remain `null`;
- filenames are provider- and period-specific;
- actions work on desktop and mobile;
- mobile action buttons use full-width or clearly tappable treatment.

## 10. Data honesty and coverage

History distinguishes at least:

```text
loading
real / fresh
partial
stale
strong stale
empty
missing
demo
error
```

Rules:

- concise state and observed scope appear near the top;
- detailed limitations may appear in coverage or methodology text;
- missing is never rendered as an observed zero;
- bounded observation is never described as a provider-wide total;
- demo is visually and textually distinct from real data;
- stale and strong-stale states remain visible;
- source labels remain honest in UI and generated outputs;
- `0 activity` and unavailable activity are not treated as equivalent when activity is referenced elsewhere.

## 11. Visual system

Visual priority:

1. provider, period, metric, state, and observed scope;
2. summary and main trend;
3. selected-day interpretation;
4. calendar and Top streamers;
5. archive exploration;
6. report/export actions;
7. detailed methodology.

Rules:

- use dark surfaces consistent with the ViewLoom shell;
- Twitch uses disciplined purple accents;
- Kick uses disciplined green accents;
- provider accent does not fill every surface;
- partial uses amber semantics;
- error uses red semantics;
- missing uses neutral/non-color distinction where practical;
- valid data must not resemble a disabled placeholder;
- long URLs, report text, names, and status messages wrap inside their containers.

Recommended desktop maximum content width:

```text
1360–1440px
```

## 12. Responsive behavior

Desktop:

- chart and inspector may use multiple columns;
- summary KPIs use a compact row/grid;
- rankings may use the metric ledger table;
- Report & Export actions may use one row when space permits.

Tablet:

- chart remains prominent;
- columns reduce without shrinking normal text below readability;
- control groups wrap in semantic order;
- reduced-motion behavior is respected.

Mobile:

- no page-level horizontal overflow at 390px;
- controls and task tabs wrap without clipping;
- chart, inspector, calendar, rankings, archives, and publishing tools stack in reading order;
- archive visibility remains bounded;
- publishing actions become full-width touch targets;
- report text and status rows wrap inside the workspace;
- the PC page is not merely scaled down.

## 13. Accessibility

- task and archive tabs are keyboard accessible;
- selected and coverage states do not rely on color alone;
- visible focus treatment is provided for primary task controls;
- calendar and chart expose meaningful labels/text;
- archive cards support their documented keyboard activation;
- buttons use explicit action labels;
- status changes use live regions without excessive announcements;
- reduced-motion preferences are respected.

## 14. Data and architecture invariants

The accepted History layout does not require:

- a new D1 schema;
- collector changes;
- cron changes;
- retention changes;
- provider mixing;
- a new History API route;
- new metrics;
- a changed CSV or JSON schema;
- AI summaries;
- login or cloud-saved preferences;
- exact session reconstruction.

New data capabilities require a separate roadmap, specification, and data-capability audit.

## 15. Acceptance contract

History is accepted only when all of the following pass:

- current build, type, policy, naming, and readiness checks;
- History shell, Overview, Archives, Peak, Battle, comparison, report, share, and export regressions;
- shared Status and Channel regressions;
- desktop, tablet, mobile, keyboard, focus, reduced-motion, long-text, and overflow checks;
- deliberate `preview-*` validation with configured Preview bindings and real retained data;
- exact production deployment identity through `/deployment.json`;
- public Twitch and Kick History browser acceptance;
- full-page artifact review;
- temporary marker absence from production;
- stable-document transfer and temporary-note deletion.

## 16. Accepted implementation record

The H1–H7 rebuild completed on 2026-06-23.

Final accepted production SHA:

```text
3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

Permanent evidence:

```text
docs/operations/history-production-acceptance-2026-06-23.md
```

Preview acceptance used:

```text
preview-history-h7
workflow run 27998433929
```

Production acceptance used:

```text
workflow run 27999024838
artifact 7810348478
```

At this version, History layout work is complete. Future changes must be classified as defect repair, shared-component consolidation, or separately approved feature expansion. The completed temporary working note must not be restored as a competing source of truth.
