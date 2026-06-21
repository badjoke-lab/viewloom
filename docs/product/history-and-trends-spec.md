# ViewLoom History & Trends specification

Status: permanent product specification
Version: 1.0-layout-reset
Last updated: 2026-06-21

## 1. Purpose

History & Trends is the retained-trends view for one provider at a time.

Fixed product roles:

```text
Heatmap      = Now
Day Flow     = Today / selected UTC day
Battle Lines = Rivalry
History      = Trends across retained days
```

History is not a raw log dump. It must help a visitor understand what changed across a selected period, identify important days and streamers, and move into provider-specific daily or rivalry detail.

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
- provider-specific routes, labels, colors, filenames, exports, and deep links;
- shared layout may be reused, but data and claims remain separate.

## 3. Current functional scope

History currently supports or may expose through its existing payload:

- 7-day, 30-day, and supported custom periods;
- Viewer-minutes and Peak viewers metrics;
- period summary;
- daily trend chart;
- selected-day inspector;
- previous-period comparison;
- calendar heat;
- top-streamer rankings and ranking sorts;
- rising / change information where supported;
- peak archive;
- battle archive;
- daily archive;
- coverage and data-quality states;
- full report text;
- short post text;
- share-card generation;
- CSV export;
- JSON export;
- provider-safe links to Day Flow, Battle Lines, and Channel pages.

The layout must organize these functions without presenting all of them as equal-priority, always-expanded vertical sections.

## 4. Primary user questions

History must answer these questions in order:

1. What happened across the selected period?
2. Which days, streamers, peaks, or rivalry events were most important?
3. How reliable and complete is the observed data?
4. Where can I inspect a specific day, battle, or channel?
5. How can I reuse the current view as text, image, CSV, or JSON?

The initial screen must prioritize questions 1–3. Archive exploration and publishing tools are secondary tasks.

## 5. Top-level information architecture

History uses three top-level views:

```text
Overview
Archives
Report & Export
```

Preferred URL state:

```text
/twitch/history/?view=overview
/twitch/history/?view=archives&archive=daily
/twitch/history/?view=archives&archive=peaks
/twitch/history/?view=archives&archive=battles
/twitch/history/?view=report
```

Equivalent Kick routes use `/kick/history/`.

Rules:

- `view=overview` is the default and may be omitted from a canonical clean URL;
- view changes preserve provider, period, metric, supported custom dates, and selected day when relevant;
- invalid view values fall back to Overview without losing valid period/metric state;
- tabs are keyboard accessible and use clear selected state;
- browser back/forward restores the previous History view state;
- deep links never switch provider.

## 6. Overview specification

Overview is the default analysis surface.

Required order:

1. compact page header;
2. period and metric controls;
3. summary KPI row including coverage status;
4. primary trend chart with selected-day inspector;
5. compact previous-period delta strip;
6. calendar heat;
7. Top streamers and supported key changes;
8. concise coverage summary with access to full methodology/details.

### 6.1 Header and controls

The header contains:

- `History & Trends`;
- provider label;
- short one-sentence purpose;
- current period label;
- data state.

Controls must remain reachable during analysis. Desktop may use a sticky toolbar. Mobile must avoid a permanently oversized sticky block.

### 6.2 Summary KPIs

The KPI row presents only high-value period facts. The exact supported fields depend on payload availability, but the layout should prioritize:

- selected metric total or aggregate;
- peak value and peak day;
- top streamer;
- observed days / requested days;
- partial and missing day counts;
- concise coverage state.

The row must not repeat every value that appears in the chart inspector or report text.

### 6.3 Primary chart and inspector

The chart is the dominant Overview visual.

Desktop target:

```text
chart: 65–75% width
inspector: 25–35% width
```

The inspector reflects the selected day and may include:

- date;
- metric value;
- peak viewers;
- top streamer;
- observed stream count/minutes;
- coverage state;
- provider-safe Day Flow and Battle Lines links.

Mobile stacks the inspector after the chart and preserves a clear selected-day relationship.

### 6.4 Previous-period comparison

Previous-period comparison is secondary to the main chart.

It must use a compact delta strip or compact cards rather than a dominant light panel. It may include:

- metric delta;
- peak delta;
- top-streamer change;
- observed-day/coverage comparison.

Unavailable comparisons must be explicit and must not display invented zeroes.

### 6.5 Calendar heat

Calendar heat communicates daily intensity and coverage together.

Required behavior:

- metric label states what intensity represents;
- selected day is visibly distinct;
- missing is distinguishable from a real low value;
- partial / attention state is distinguishable from missing;
- legend is readable without relying on color alone;
- keyboard focus and selection are supported;
- selecting a day synchronizes with the main inspector where applicable.

### 6.6 Top streamers

Top streamers belongs in Overview before archive-heavy content.

Required behavior:

- bounded initial row count;
- existing supported sorts remain accessible;
- selected metric and ranking meaning are visible;
- provider-safe Channel links;
- no implication that retained ranking equals the complete provider ranking.

## 7. Archives specification

Archives contains three subviews:

```text
Daily
Peaks
Battles
```

Only one archive subview is expanded at a time.

General rules:

- initial result count is bounded;
- use load-more or explicit pagination;
- preserve current period and provider;
- cards/lists use the shared dark visual system;
- no unfinished-looking pale placeholder panels for valid data;
- important entries are visually ranked;
- empty, partial, and missing states remain explicit.

### 7.1 Daily archive

Each entry may show:

- UTC date;
- selected metric;
- peak viewers;
- top streamer;
- coverage state;
- observed stream count/minutes;
- Open Day Flow;
- Open Battle Lines.

### 7.2 Peak archive

The largest or most relevant peak receives featured treatment. Remaining peaks use a compact list/grid.

Peak entries may show:

- value;
- date/time when supported;
- streamer;
- period rank;
- coverage state;
- links to relevant day/channel detail.

### 7.3 Battle archive

The archive should distinguish supported event meaning, such as:

- largest reversal;
- closest battle;
- largest gap collapse;
- other retained battle events.

Do not present all events as equally important. Event meaning must remain consistent with the current Battle Lines contract.

## 8. Report & Export specification

Report & Export is one tool area, not three or four full-width sections in the analysis flow.

Required tools:

- Full report;
- Short post;
- Share card;
- CSV export;
- JSON export.

Rules:

- all outputs use the already loaded History response;
- no download/copy action causes a cross-provider request;
- no output invents values for missing days;
- CSV missing numeric values remain blank;
- JSON missing numeric values remain `null`;
- provider, period, metric, coverage, and limitation language are preserved;
- share-card preview is generated or revealed on demand rather than permanently dominating Overview;
- filenames are provider- and period-specific;
- copy and download actions work on desktop and mobile.

## 9. Coverage and data honesty

History must distinguish at least:

```text
loading
real / ok
demo
partial
stale
empty
missing
error
```

Coverage is both a summary and a detail concern:

- concise observed/partial/missing status appears near the top;
- full explanation and limitations may appear in a detail panel or bottom methodology section;
- missing must never be rendered as observed zero;
- bounded observation must never be described as a provider-wide total;
- stale and strong-stale states must remain visible;
- demo must never be visually indistinguishable from real data.

## 10. Visual hierarchy

### 10.1 Priority

Visual priority must be:

1. period and state;
2. summary and main trend;
3. selected-day interpretation;
4. calendar and top streamers;
5. archive exploration;
6. report/export actions;
7. detailed methodology.

### 10.2 Cards and colors

- use dark surfaces consistent with the current ViewLoom shell;
- Twitch uses purple accents and Kick uses green accents;
- provider accent should not fill every card;
- selected state may use accent border/background;
- partial uses amber semantics;
- error uses red semantics;
- missing uses neutral/hatched semantics where practical;
- valid data cards must not resemble disabled controls.

### 10.3 Typography

Target minimum hierarchy:

```text
section title: 20–24px
primary card value: 20–28px
body: 14–16px
button: at least 14px
card label: 12–13px
```

Dense metadata may be smaller only when still readable at normal browser zoom.

### 10.4 Width and spacing

Recommended desktop content width:

```text
1360–1440px maximum
```

Recommended spacing hierarchy:

```text
card gap: 12–16px
inside-section spacing: 20–24px
major-section spacing: 48–64px
```

## 11. Responsive behavior

Desktop:

- chart and inspector may use two columns;
- summary KPIs use a compact row/grid;
- Top streamers and key changes may share columns;
- archive subviews use bounded grids or tables.

Tablet:

- preserve chart prominence;
- reduce column count without shrinking readable text;
- controls may wrap in ordered groups.

Mobile:

- no horizontal page overflow;
- controls remain usable with touch;
- chart, inspector, calendar, ranking, and archive cards stack in reading order;
- archive item count remains bounded;
- action buttons have full-width or clearly tappable treatment;
- report/share/export tools do not force excessive initial scrolling.

## 12. Accessibility

- tabs and archive subviews are keyboard accessible;
- selected and coverage states do not rely on color alone;
- focus indicators are visible;
- chart and calendar expose meaningful text/labels;
- buttons have explicit action labels;
- status changes use appropriate live regions without excessive announcements;
- reduced-motion preferences are respected where animation exists.

## 13. Non-goals for the layout rebuild

The layout rebuild does not add:

- new D1 schema;
- new collector fields;
- new cron schedules;
- cross-platform comparison;
- AI summaries;
- login or cloud-saved preferences;
- exact session history;
- provider-wide ranking claims;
- additional archive types beyond current supported data.

New data features require a separate roadmap and data-capability update.

## 14. Completion criteria

History is layout-complete only when:

- Overview communicates the selected period without archive/report scrolling;
- the main chart is visually dominant;
- Top streamers appears in the primary analysis flow;
- Previous-period comparison is compact;
- Daily, Peaks, and Battles are separated and bounded;
- Report, Share, and Export are consolidated;
- desktop and mobile text is readable at normal zoom;
- pale placeholder-like valid-data cards are removed;
- missing/partial/stale/error states remain honest;
- all existing outputs and deep links still work;
- Twitch and Kick use the same information architecture without data mixing;
- candidate CI, browser gates, deliberate Preview validation, production deployment identity, and production smoke all pass.

At completion, stable implementation decisions are transferred here and the temporary working note is deleted.
