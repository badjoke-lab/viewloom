# TEMPORARY — History layout rebuild working note

Status: active temporary note
Created: 2026-06-21
Delete when: History layout rebuild is production-verified and stable decisions have been transferred to permanent specifications.

> This is execution memory for H1-H7, not a permanent specification. Delete it in the H7 completion PR.

## 1. Baseline

Production screenshots reviewed on 2026-06-21:

- Twitch History full-page desktop;
- Kick History full-page desktop.

Baseline conclusion:

- individual History functions work;
- Twitch and Kick share the same layout defects;
- the page is an implementation-order stack rather than a coherent analysis product;
- the current layout is too long and dense;
- it is not accepted as final public quality.

## 2. Problem inventory

### P1 — mixed page purposes

Analysis, archive browsing, report/social output, export, and methodology are presented as one uninterrupted task.

### P2 — equal visual weight

Comparison, chart, calendar, report, share card, export, peaks, battles, rankings, daily archive, and coverage appear as similarly important full-width sections.

### P3 — excessive length

Daily, Peaks, and Battles are simultaneously expanded, while report and share tools occupy permanent vertical space.

### P4 — Top streamers appears too late

Top streamers is a primary History answer and must move into Overview before archive-heavy content.

### P5 — report tools interrupt analysis

Full report, Short post, Share card, CSV, and JSON belong to one secondary task area.

### P6 — repeated information

Period, peak, top streamer, observed days, coverage, and deltas repeat across multiple modules.

### P7 — comparison dominates

Previous-period comparison visually outweighs the main chart and must become compact.

### P8 — valid data looks disabled

Pale archive/comparison cards resemble placeholders or disabled controls. Valid data must use the dark surface system.

### P9 — typography is too small and dense

Archive metadata, controls, inspector labels, and coverage copy require excessive concentration or zoom.

### P10 — archive importance is flat

Peak and Battle entries lack featured-event hierarchy and meaningful event-type distinction.

### P11 — calendar semantics are weak

Metric intensity, missing versus low value, partial state, selection, and legend require clearer treatment.

### P12 — coverage arrives too late

Concise coverage must appear near the period summary, while methodology can remain secondary.

### P13 — section hierarchy is weak

Repeated small headings and similar cards make long-scroll orientation difficult.

### P14 — desktop width is underused

The page behaves like a narrow document rather than a wide analysis workspace.

### P15 — mobile cannot be a final compression pass

Always-expanded modules create severe mobile scrolling and control-density risks.

## 3. Locked direction

### D1 — top-level task views

```text
Overview
Archives
Report & Export
```

### D2 — default

Overview is the default and contains no fully expanded archives or permanently expanded share preview.

### D3 — archive subviews

```text
Daily
Peaks
Battles
```

One archive subview is visible at a time.

### D4 — Top streamers

Top streamers moves into Overview after the primary chart/calendar flow.

### D5 — comparison

Previous-period comparison becomes a compact secondary strip/card row.

### D6 — publishing tools

Full report, Short post, Share card, CSV, and JSON form one `Report & Export` area.

### D7 — surfaces

Valid data uses dark ViewLoom surfaces. Light gray is not the default valid-data card treatment.

### D8 — bounded archives

Archives use bounded initial rendering with load-more or pagination.

### D9 — data boundary

The rebuild adds no D1 schema, collector fields, cron, new metrics, or provider mixing.

### D10 — temporary note lifecycle

Update this note during H1-H6. Delete it in H7 after permanent docs are finalized.

## 4. H1 decisions — task view shell

PR: #390
State: completed
Branch: `work-history-view-shell`
Merge: `ced6471f9d754919df80c5c47de9ed298658c79a`

Resolved decisions:

- canonical Overview URL omits `view=overview`;
- Archives serializes `view=archives&archive=daily|peaks|battles`;
- Report & Export serializes `view=report`;
- invalid view/archive values normalize without deleting valid analysis parameters;
- period, metric, custom dates, selected day, ranking sort, and limit persist across task views;
- selected day persists when moving between Overview, Archives, and Report;
- the most recent archive subview is remembered during the current page session;
- user task navigation uses `pushState`;
- Back/Forward restores the task view and archive subview;
- the existing data shell may continue using `replaceState` without dropping task state;
- task switching does not issue another History API request;
- existing modules are moved into provisional panels rather than rewritten;
- Twitch and Kick retain separate routes and endpoints;
- top-level and archive tabs use accessible tab semantics and keyboard activation;
- H1 styling is provisional; H2-H5 own final hierarchy and visual polish.

Provisional placement established in H1:

```text
Overview
  summary / coverage
  previous-period comparison
  chart / selected-day inspector
  calendar
  Top streamers
  detailed coverage

Archives
  Daily
  Peaks
  Battles

Report & Export
  Full report / Short post
  Share card
  CSV / JSON
```

H1 QA result:

- dedicated contract gate passed;
- Twitch desktop and Kick mobile browser gate passed;
- clean Overview URL verified;
- direct archive/report state verified;
- invalid-state normalization verified;
- Back/Forward restoration verified;
- no extra fetch on view switching verified;
- task state survives metric refresh;
- no provider crossing;
- no horizontal page overflow;
- existing Daily, Peak, Battle, Report, Share, and Export browser gates remained valid;
- all 26 pull-request workflows passed before squash merge.

## 5. H2 decisions — Overview rebuild

State: completed candidate
Branch: `work-history-overview`
Base: `ced6471f9d754919df80c5c47de9ed298658c79a`
PR: #391

Implemented decisions:

- Overview-specific stylesheet and enhancement module;
- desktop content width increased to 1440px;
- compact History hero and control area;
- KPI summary row with the lead metric visually dominant;
- chart and selected-day inspector arranged as an approximately 73/27 desktop pair;
- previous-period comparison reduced to a secondary compact block;
- calendar placed after chart and comparison;
- Top streamers paired with a new `Key changes` analysis surface;
- detailed coverage moved below the primary analysis flow;
- responsive one-column order for tablet/mobile;
- provider-specific API capture without an additional History request;
- unsupported comparison changes shown as `Withheld`, never invented as zero;
- Twitch desktop and Kick mobile browser-gate coverage;
- dedicated contract and browser workflows;
- duplicate Overview verifier removed and the canonical verifier aligned with the actual browser readiness state.

H2 QA result on PR #391 candidate:

- all 21 pull-request workflows passed;
- History Overview contract passed;
- History Overview Browser passed;
- existing History shell, chart, comparison, Peak, Battle, Channel, Status, build, verification, and readiness workflows passed;
- Twitch desktop screenshot reviewed: chart is dominant, selected-day inspector is secondary, comparison is reduced, Top streamers and Key changes are paired, detailed coverage is last;
- Kick mobile screenshot reviewed: deliberate single-column reading order, task controls remain reachable, no page-level horizontal overflow, unsupported comparisons remain explicitly withheld;
- Cloudflare Preview and production verification remain intentionally deferred to H7.

H2 merge condition:

- merge PR #391 by squash only while its latest HEAD remains fully green;
- after merge, H3 Archives becomes active;
- no Preview or production claim is made at H2.

## 6. Target desktop layout for H2-H5

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

Starting constraints:

- content max width: approximately 1360–1440px;
- chart row: approximately 65–75% chart and 25–35% inspector;
- coverage visible before archive/report tasks;
- major-section spacing visibly exceeds card spacing.

## 7. Target mobile layout

- task tabs remain horizontally reachable;
- period and metric controls wrap deliberately;
- chart appears before selected-day detail;
- calendar remains legible and selectable;
- Top streamers remains readable without page overflow;
- archive result count remains bounded;
- report/share/export actions stack cleanly;
- no always-open share preview near the top;
- normal controls remain at least 14px with usable touch targets.

## 8. Typography and state reminders

Starting typography:

```text
section title: 20–24px
primary value: 20–28px
body: 14–16px
button: >=14px
card label: 12–13px
```

State treatment:

```text
selected: provider accent
partial: amber semantics
missing: neutral/hatched; never observed zero
stale: explicit stale label
error: red semantics with recovery information
empty: explicit no-observed-data message
demo: unmistakably labeled
```

Meaning must not rely on color alone.

## 9. Remaining questions for H3

- exact initial item count for Daily, Peaks, and Battles on desktop/mobile;
- pagination versus load-more for Daily;
- featured Peak hierarchy;
- Battle event-type treatment using only current evidence;
- disclosure panel versus anchored section for full methodology;
- final keyboard/screen-reader wording for calendar cells.

## 10. PR progress

| Step | State | PR | Result |
|---|---|---|---|
| H0 docs and baseline | completed | #388 | canonical reset, baseline inventory, temporary-note lifecycle, documentation-first CI |
| H1 view shell/state | completed | #390 | URL/task state, provisional module placement, browser history, accessible tabs; 26/26 workflows passed |
| H2 Overview | completed candidate | #391 | Overview layout/module/gates implemented; 21/21 workflows passed; Twitch desktop and Kick mobile artifacts reviewed; merge pending |
| H3 Archives | queued | — | — |
| H4 Report & Export | queued | — | — |
| H5 visual/responsive | queued | — | — |
| H6 candidate QA | queued | — | — |
| H7 Preview/production/docs cleanup | queued | — | delete this file |

Update this table in every History rebuild PR.

## 11. Full-page visual review checklist

- Can the visitor identify provider, period, metric, state, and primary trend above the fold?
- Is the chart more prominent than comparison and publishing tools?
- Is concise coverage visible near the summary?
- Does each task view have one obvious purpose?
- Are valid cards visually active and complete?
- Are key values larger than metadata?
- Is only one archive type expanded?
- Are archive results bounded?
- Are provider-safe Day Flow/Battle Lines links clear?
- Are copy/download actions grouped?
- Is share preview on demand?
- Are missing values preserved honestly?
- Is there no horizontal overflow at 390px?
- Is text readable at normal zoom?
- Is keyboard focus visible?
- Does long text wrap safely?

## 12. Deletion checklist

Delete this note only when all are true:

- H1-H6 implementation and QA are complete;
- H7 Preview and production acceptance pass;
- final URL/view behavior is in `history-and-trends-spec.md`;
- final component/layout behavior is in the permanent specification;
- roadmap and schedule reflect final phase status;
- unresolved questions are resolved or formally deferred;
- `docs/README.md` no longer links this file.

Delete it in the same completion PR that finalizes permanent documentation.
