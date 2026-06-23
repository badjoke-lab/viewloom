# ViewLoom Channel / Streamer v1 specification

Status: permanent product specification
Version: 1.0-planned
Last updated: 2026-06-23
Roadmap phase: Phase 3 — Channel / Streamer v1
Current implementation audit: `../work-in-progress/channel-v1-audit.md`
Implementation plan: `channel-v1-implementation-plan.md`

## 1. Purpose

Channel / Streamer is the provider-specific drill-down page for one retained channel identity.

It answers:

1. What retained footprint did this channel have across the selected period?
2. On which UTC days did it appear in ViewLoom's retained daily Top 10?
3. What viewer-minute, peak, average, observed-time, and retained-rank facts are available?
4. Which retained daily rivalry candidates involved the channel?
5. Which provider-specific History, Day Flow, and Battle Lines views can be opened next?
6. How can this retained view be copied or exported without overstating coverage?

It is not a complete channel analytics product and does not reconstruct exact sessions.

## 2. Position in ViewLoom

The accepted product roles remain:

```text
Heatmap      = Now
Day Flow     = Today
Battle Lines = Rivalry
History      = Trends across retained days
Channel      = One channel's retained footprint
```

Channel is a secondary drill-down page, not a fifth primary navigation destination.

Entry points may include:

- History Top streamers;
- History selected-day or archive entries;
- future Heatmap, Day Flow, or Battle Lines channel links when a stable provider channel id exists.

The page must not compete with History as the period-wide ranking and archive surface.

## 3. Provider separation

Canonical routes:

```text
/twitch/channel/?id=<streamer-id>
/kick/channel/?id=<streamer-id>
```

Optional state:

```text
name=<display-name>
period=7d|30d
view=days|report
day=YYYY-MM-DD
```

Mandatory rules:

- Twitch calls only `/api/history`;
- Kick calls only `/api/kick-history`;
- no cross-provider API call, total, rank, identity merge, report, export, filename, or link;
- `id` is the provider-specific identity key;
- `name` is an escaped display fallback and never replaces `id` as identity;
- external links use the matching provider only;
- shared renderer and output code may be reused, but data and claims remain provider-specific.

## 4. Identity and URL contract

### 4.1 Required identity

`id` is required.

Normalization:

```text
lowercase
trim whitespace
allow a-z, 0-9, underscore, hyphen
reject an empty result
```

A missing or invalid id produces `Channel not selected` and sends no History request.

### 4.2 Display name

Display-name priority:

1. matching period `topStreamers` row;
2. latest matching retained daily row;
3. escaped `name` query value;
4. normalized id.

### 4.3 Period

Allowed values:

```text
7d
30d
```

Default:

```text
30d
```

Changing period performs one new provider-specific History request.

### 4.4 Task state

Accepted task views:

```text
Overview
Retained Days
Report & Export
```

Preferred URL state:

```text
/twitch/channel/?id=alpha
/twitch/channel/?id=alpha&period=7d
/twitch/channel/?id=alpha&view=days
/twitch/channel/?id=alpha&view=report
```

Rules:

- Overview is the default and omits `view` from the clean URL;
- invalid `view` values fall back to Overview;
- task switching reuses the loaded History response and does not fetch again;
- browser Back and Forward restore task, period, and supported selected day;
- provider and id never change during task switching.

### 4.5 Selected day

`day=YYYY-MM-DD` is allowed when the day is inside the loaded period.

Rules:

- selecting a trend day or retained-day card updates the selected-day state;
- invalid or out-of-period days are removed safely;
- selected day does not imply that the channel streamed for the entire day;
- selecting a day does not trigger another Channel or History request.

## 5. Data path and architecture invariant

Channel v1 reuses one loaded provider History payload.

```text
Twitch -> /api/history?period=<7d|30d>&metric=viewer_minutes
Kick   -> /api/kick-history?period=<7d|30d>&metric=viewer_minutes
```

Payload sources:

| Channel output | History source |
|---|---|
| Period summary | matching `topStreamers[]` row |
| Daily trend | `daily[]` plus matching `daily[].topStreamers[]` row |
| Retained Days | matching daily rows |
| Rivalry candidates | matching `battleArchive[]` entries |
| Provider state | `source`, `state`, `period`, `coverage` |

Channel v1 requires no:

- Channel-specific API;
- D1 migration;
- new binding;
- collector or cron change;
- retention change;
- raw minute payload in the browser;
- second History request for task switching, copy, CSV, or JSON.

A future Channel-specific API requires separate roadmap and data-capability approval.

## 6. Evidence boundary

### 6.1 Supported claims

Channel may state that:

- the channel appears in the retained period Top streamers result;
- it appears in a retained daily Top 10 row on a specific UTC day;
- retained rows report viewer-minutes, peak viewers, average viewers, observed minutes, and retained rank;
- a retained daily rivalry candidate involves the channel;
- a day or period has the source, state, and coverage supplied by the provider History response.

### 6.2 Unsupported claims

Channel must not state or imply:

- offline status from absence;
- zero viewers from absence;
- exact session start or end;
- exact uninterrupted duration;
- complete session history;
- complete provider-wide rank or totals;
- exact category or language history;
- exact battle reversal time;
- cross-platform combined identity or totals;
- comparison against every provider channel.

Required absence language:

```text
Not in retained daily Top 10
Not confirmed offline
```

Required session language:

```text
Exact session start/end history is not available from this retained footprint.
```

## 7. Page structure

The page uses one shared header and three task views.

```text
Shared header and controls
Task navigation
  Overview
  Retained Days
  Report & Export
Shared scope and methodology link
```

Only one task view is visible at a time.

## 8. Shared header and controls

The header presents:

- `CHANNEL FOOTPRINT` provider eyebrow;
- channel display name;
- provider-specific external channel link;
- provider label;
- selected period;
- data source and state;
- observed days / requested days;
- retained daily Top 10 appearances;
- explicit session-history limitation.

Controls:

- Last 7 days;
- Last 30 days;
- Copy current URL;
- task tabs.

The source, state, and observed scope must not be hidden behind the bottom methodology section.

## 9. Overview

Overview is the default task.

Accepted order:

1. compact header and period controls;
2. primary and supporting period facts;
3. retained daily trend and selected-day interpretation;
4. recent retained appearances preview;
5. rivalry candidate preview;
6. concise scope and limitation note.

### 9.1 Period facts

Primary facts:

```text
Viewer-minutes
Peak viewers
```

Supporting facts:

```text
Average viewers
Observed time
Retained Top 10 days / requested days
```

Rules:

- missing values render as an em dash, not zero;
- cards must distinguish primary scale from supporting scope;
- period totals are described as retained, not provider-wide;
- if the period summary row is missing but daily rows exist, daily evidence remains visible and unsupported period totals stay unavailable.

### 9.2 Retained daily trend

The trend shows every requested UTC day.

For each day:

- matching retained row -> viewer-minute bar and available details;
- no matching retained row -> patterned absence mark;
- missing provider day -> distinct missing state;
- partial day -> visible partial symbol/state.

Rules:

- absent is not drawn as a real zero bar;
- a 30-day view remains readable on 390px mobile;
- date labels are thinned rather than showing thirty vertical labels at equal strength;
- internal chart scrolling is allowed only inside a labelled chart region and must not create page-level overflow;
- bars or day targets are keyboard and touch selectable;
- selected-day state is visible without relying on color alone.

### 9.3 Selected-day interpretation

When a day is selected, show:

- UTC date;
- whether a retained Top 10 row exists;
- viewer-minutes;
- peak viewers;
- average viewers;
- observed time;
- retained daily rank;
- day coverage state;
- Open Day Flow;
- Open Battle Lines.

When no retained row exists, the panel says `Not in retained daily Top 10` and `Not confirmed offline`.

### 9.4 Recent retained appearances preview

Overview shows at most three newest retained-day entries.

A `View all retained days` action switches to Retained Days without another fetch.

### 9.5 Rivalry preview

Overview shows at most three rivalry candidates involving the channel.

Deterministic ordering:

1. higher rivalry score;
2. newer UTC day;
3. smaller viewer-minute gap;
4. stable pair-id order.

Each entry states that it is a daily aggregate candidate and links to provider-specific Battle Lines.

No rivalry result uses a compact honest empty state rather than a large empty grid.

## 10. Retained Days

Retained Days is the archive task for matching daily Top 10 rows.

Ordering:

```text
newest first
```

Default visible count:

```text
6
```

Rules:

- show at most six cards initially on desktop, tablet, and mobile;
- `Show all` reveals the remaining retained entries;
- `Show recent` restores the bounded set;
- controls state the visible and total counts;
- switching visibility does not change provider data or refetch;
- a 30-day mobile page must not render every retained day by default.

Each card may show:

- date;
- coverage state;
- viewer-minutes;
- peak viewers;
- average viewers;
- observed time;
- retained daily rank;
- Day Flow link;
- Battle Lines link.

Card selection synchronizes the selected day. Nested links must not trigger card selection twice.

Empty state:

```text
This channel did not appear in the retained daily Top 10 for the selected period.
This does not confirm that the channel was offline.
```

## 11. Report & Export

Report & Export is one secondary workspace using the loaded provider response.

Modes:

```text
Full summary
Short post
```

Actions:

```text
Copy summary
Download CSV
Download JSON
```

PNG/share-card output is deferred to the later shared report/export consolidation phase.

### 11.1 Full summary

Includes:

- ViewLoom and provider;
- channel display name and id;
- selected period;
- source and state;
- observed days / requested days;
- retained appearance count;
- available retained summary facts;
- newest retained day;
- up to three rivalry candidates;
- explicit retained-footprint and session limitations;
- provider-specific page URL.

### 11.2 Short post

A compact provider-specific summary suitable for copying.

It must still include `retained` or equivalent limitation language and must not describe absence as offline.

### 11.3 CSV contract

One row per requested day.

Required columns:

```text
provider
channel_id
display_name
period
day
retained_top10
coverage_state
viewer_minutes
peak_viewers
avg_viewers
observed_minutes
rank_by_viewer_minutes
```

Rules:

- missing numeric cells are blank;
- `retained_top10` is explicit true/false;
- absence is not exported as numeric zero;
- rows remain provider-specific.

### 11.4 JSON contract

JSON includes:

```text
schema
provider
channel
period
source
state
coverage
summary
daily
rivalry_candidates
limitations
```

Missing numeric values are `null`.

### 11.5 Filenames

```text
viewloom-<provider>-channel-<sanitized-id>-<period>.csv
viewloom-<provider>-channel-<sanitized-id>-<period>.json
```

## 12. State model

Channel distinguishes:

```text
loading
fresh / real
partial
stale
strong stale
empty retained footprint
missing channel id
error
demo
```

Rules:

- `missing channel id` sends no request;
- `empty retained footprint` means no matching retained period or daily row, not offline;
- real empty and demo are distinct;
- stale data may remain visible with a clear warning;
- request errors preserve the selected provider/id/period and offer retry;
- source and state appear in copied/exported output;
- a shared masthead status does not override the Channel page's own response evidence.

## 13. Responsive behavior

Desktop:

- compact header with scope facts;
- trend and selected-day interpretation may use two columns;
- period facts use a clear primary/supporting hierarchy;
- Retained Days uses up to three columns;
- Report & Export may use a two-column preview/action layout.

Tablet:

- controls wrap in semantic order;
- trend remains readable;
- task tabs remain directly accessible;
- no text is reduced below normal readable size.

Mobile at 390px and 360px:

- no page-level horizontal overflow;
- one-column task layout;
- at most six retained-day cards before expansion;
- touch targets are at least 48px where practical;
- trend labels are thinned;
- long names, URLs, summaries, and status text wrap inside containers;
- task tabs and period controls wrap without clipping;
- the page is not a scaled desktop layout.

## 14. Accessibility

- task tabs use accessible tab or button semantics;
- period controls expose pressed/current state;
- trend days are keyboard selectable;
- selected, missing, partial, and absent states do not rely on color alone;
- visible focus is provided;
- status feedback uses restrained live regions;
- copy/download buttons use explicit labels;
- reduced-motion preferences are respected;
- nested card links remain independently operable.

## 15. SEO and indexing

Channel v1 uses query-based identities and static HTML metadata.

Until unique path-based channel pages and dynamic canonical metadata exist:

```text
<meta name="robots" content="noindex,follow">
```

Rules:

- do not canonicalize every dynamic channel identity as if it were one indexable profile;
- external provider links remain followable;
- ViewLoom primary feature pages remain the indexable product surfaces;
- a future indexed Channel route requires separate SEO and routing approval.

## 16. Visual system

- use the accepted ViewLoom dark surface hierarchy;
- Twitch uses disciplined purple accents;
- Kick uses disciplined green accents;
- valid data cards must not resemble disabled gray placeholders;
- primary facts receive stronger type hierarchy than supporting facts;
- partial uses amber semantics;
- error uses red semantics;
- missing/absent use neutral patterned or symbolic treatment;
- provider accent never replaces source/state semantics.

## 17. Non-goals

Channel v1 does not include:

- exact session timeline or session list;
- category or language history;
- clips or VOD integration;
- provider-wide or cross-platform ranking;
- cross-provider identity merge;
- watchlist, alerts, login, or cloud preferences;
- AI interpretation;
- PNG/share-card generation;
- previous-period percentage comparison requiring another request;
- new collector cadence, D1 migration, or retention expansion;
- unrestricted channel search.

## 18. Acceptance contract

Repository checks:

- build, type, policy, naming, and public-readiness checks;
- static Channel contract;
- state and URL contract;
- Overview, Retained Days, rivalry, report, CSV, and JSON checks;
- shared History, Status, and provider-link regressions.

Browser matrix:

- Twitch desktop 1440×1100;
- Kick desktop 1440×1100;
- tablet 768px;
- Twitch mobile 390×844;
- Kick mobile 390×844;
- 360px narrow mobile;
- keyboard task/day selection;
- Back/Forward state restoration;
- 30-day archive bound of six before expansion;
- no page-level overflow;
- missing-id, empty retained footprint, partial, error, and demo states.

Hosted acceptance:

- deliberate `preview-*` branch;
- separate Twitch and Kick Preview bindings;
- real retained History responses;
- provider-specific desktop and mobile screenshots;
- exact production SHA through `/deployment.json`;
- public Twitch/Kick Channel smoke and browser checks;
- permanent acceptance evidence and temporary-note cleanup.

## 19. Completion definition

Channel / Streamer v1 is complete only when:

- all three task views work from one provider History payload;
- 7-day and 30-day state and Back/Forward work;
- retained absence remains honest;
- the default archive is bounded to six;
- copy, CSV, and JSON outputs preserve provider/source/state/missing semantics;
- desktop, tablet, mobile, keyboard, Preview, and production acceptance pass;
- stable decisions and evidence are moved into permanent docs;
- the temporary Channel audit note is deleted and unlinked.
