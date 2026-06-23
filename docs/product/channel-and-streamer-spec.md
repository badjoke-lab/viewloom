# ViewLoom Channel / Streamer v1 specification

Status: accepted production product specification
Version: 1.0
Last updated: 2026-06-23
Roadmap phase: Phase 3 — Channel / Streamer v1 completed
Accepted production SHA: `efc14295f0a372b96afac740d6a01571f7582210`
Implementation record: `channel-v1-implementation-plan.md`
Production acceptance: `../operations/channel-production-acceptance-2026-06-23.md`

## 1. Purpose

Channel / Streamer is the provider-specific drill-down page for one retained channel identity.

It answers:

1. what retained footprint the channel had in the selected period;
2. on which UTC days it appeared in ViewLoom's retained daily Top 10;
3. which retained viewer-minute, peak, average, observed-time, and rank facts are available;
4. which retained daily rivalry candidates involved the channel;
5. which provider-specific History, Day Flow, and Battle Lines views can be opened next;
6. how the retained view can be copied or exported without overstating coverage.

It is not a complete channel analytics product and does not reconstruct exact stream sessions.

## 2. Position in ViewLoom

```text
Heatmap      = Now
Day Flow     = Today
Battle Lines = Rivalry
History      = Trends across retained days
Channel      = One channel's retained footprint
```

Channel is a secondary drill-down surface, not a fifth primary navigation destination. History remains the period-wide ranking and archive surface.

## 3. Provider separation

Canonical routes:

```text
/twitch/channel/?id=<streamer-id>
/kick/channel/?id=<streamer-id>
```

Mandatory rules:

- Twitch calls only `/api/history`;
- Kick calls only `/api/kick-history`;
- provider data, links, reports, exports, filenames, and claims never mix;
- `id` is the provider-specific identity key;
- `name` is an escaped display fallback and never replaces `id`;
- no cross-platform identity merge, totals, or ranking.

## 4. Identity and URL state

Supported query state:

```text
id=<provider-channel-id>
name=<escaped-display-name>
period=7d|30d
view=days|report
day=YYYY-MM-DD
```

Rules:

- `id` is required and normalized to lowercase `a-z`, `0-9`, underscore, and hyphen;
- missing or invalid `id` renders `Channel not selected` and sends no History request;
- period defaults to `30d`;
- Overview is the default task and omits `view` from the clean URL;
- invalid state falls back safely;
- task and selected-day changes reuse the loaded payload;
- period changes perform exactly one new provider History request;
- Back and Forward restore supported period, task, and selected-day state;
- provider and channel id never change silently during state restoration.

Display-name priority:

1. matching period `topStreamers[]` row;
2. latest matching retained daily row;
3. escaped `name` query value;
4. normalized channel id.

## 5. Data architecture

Channel v1 derives all tasks from one loaded provider History response.

```text
Twitch -> /api/history?period=<7d|30d>&metric=viewer_minutes
Kick   -> /api/kick-history?period=<7d|30d>&metric=viewer_minutes
```

| Channel output | History source |
|---|---|
| Period summary | matching `topStreamers[]` row |
| Daily footprint | `daily[]` plus matching daily streamer row |
| Retained Days | matching retained daily rows |
| Rivalry candidates | matching `battleArchive[]` entries |
| Evidence state | `source`, `state`, `period`, and `coverage` |

Channel v1 requires no:

- Channel-specific API;
- D1 migration or new binding;
- collector or cron change;
- retention change;
- raw minute payload in the browser;
- second History request for task switching, copy, CSV, or JSON.

## 6. Evidence and honesty boundary

Supported claims:

- the channel appears in the retained period Top streamers result;
- it appears in a retained daily Top 10 row on a specific UTC day;
- retained rows report viewer-minutes, peak viewers, average viewers, observed minutes, and retained rank;
- a retained daily rivalry candidate involves the channel;
- provider source, state, and coverage are displayed as supplied by History.

Unsupported claims:

- exact session start or end;
- exact uninterrupted duration;
- complete session history;
- offline status or zero viewers from absence;
- complete provider-wide rank or totals;
- exact category or language history;
- exact battle reversal time;
- cross-platform identity, totals, or ranking.

Required absence language:

```text
Not in retained daily Top 10
Not confirmed offline
```

Required session language:

```text
Exact session start/end history is not available from this retained footprint.
```

Missing numeric values remain unavailable, not observed zero.

## 7. Accepted task structure

```text
Overview
Retained Days
Report & Export
```

Only one task is visible at a time. Task switching updates URL state and does not fetch again.

### 7.1 Shared header

The header exposes:

- provider and provider-specific external channel link;
- selected period;
- source and state;
- observed days / requested days;
- retained daily Top 10 appearances;
- explicit session-history limitation;
- Last 7 days / Last 30 days;
- Copy current URL;
- task navigation.

Source, state, and scope must remain visible near the top rather than only in a bottom methodology section.

### 7.2 Overview

Accepted order:

1. compact header and controls;
2. primary and supporting period facts;
3. retained daily footprint and selected-day interpretation;
4. at most three recent retained appearances;
5. at most three rivalry candidates;
6. concise Scope & Limits.

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

Daily footprint rules:

- every requested UTC day is represented;
- retained, absent, missing, and partial are distinct;
- absence is not drawn as a real zero bar;
- date labels are thinned on mobile;
- day targets are keyboard and touch selectable;
- selected state does not rely on color alone;
- internal chart scrolling must not create page-level overflow.

Selected-day interpretation may show date, retained status, viewer-minutes, peak, average, observed time, retained rank, coverage, and provider-safe Day Flow / Battle Lines links.

Rivalry ordering is deterministic:

1. higher rivalry score;
2. newer UTC day;
3. smaller viewer-minute gap;
4. stable pair-id order.

### 7.3 Retained Days

Ordering:

```text
newest first
```

Default visible count:

```text
6
```

Rules:

- desktop, tablet, and mobile show at most six cards initially;
- `Show all` reveals the remaining retained entries;
- `Show recent` restores the bounded set;
- visible and total counts are stated;
- expansion does not fetch or alter provider data;
- empty state says the channel did not appear in the retained daily Top 10 and does not confirm offline status;
- card selection synchronizes the selected day;
- nested links must not activate the card twice.

### 7.4 Report & Export

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

Rules:

- reports identify ViewLoom, provider, channel, period, source/state, observed scope, retained appearances, available summary facts, and limitations;
- Short post still includes retained-footprint limitation language;
- copy and downloads reuse the loaded payload;
- action success and error feedback is visible;
- provider-specific filenames are mandatory;
- PNG/share-card output is deferred to a later shared-output phase.

## 8. Export contracts

CSV contains one row per requested day.

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

CSV rules:

- cells are escaped;
- missing numeric cells are blank;
- `retained_top10` is explicit;
- filenames include provider, channel, and period.

JSON top-level fields:

```text
schema: viewloom-channel-v1
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

JSON rules:

- missing numeric values are `null`;
- provider identity is explicit;
- limitations are included;
- filenames include provider, channel, and period.

## 9. Visual, responsive, accessibility, and SEO rules

- use the accepted ViewLoom dark surface hierarchy;
- Twitch uses disciplined purple accents;
- Kick uses disciplined green accents;
- provider accent never replaces source/state semantics;
- valid data cards must not resemble disabled placeholders;
- primary facts have stronger hierarchy than supporting facts;
- partial uses amber semantics, error uses red, and absent/missing use neutral non-color treatment;
- mobile is a dedicated responsive composition rather than a scaled desktop page;
- page-level horizontal overflow is prohibited;
- report text and long names wrap safely;
- primary mobile actions target at least 48px where practical;
- keyboard focus is visible;
- reduced-motion preferences are respected;
- query-based dynamic Channel pages use `noindex,follow`;
- primary ViewLoom feature pages remain the indexable product surfaces.

## 10. Non-goals

Channel v1 does not include:

- exact session timeline or session list;
- category or language history;
- clips or VOD integration;
- provider-wide or cross-platform ranking;
- cross-provider identity merge;
- watchlist, alerts, login, or cloud preferences;
- AI interpretation;
- PNG/share-card generation;
- previous-period comparison requiring another request;
- new collector cadence, D1 migration, or retention expansion;
- unrestricted channel search.

## 11. Production acceptance

Permanent evidence:

```text
docs/operations/channel-production-acceptance-2026-06-23.md
accepted production SHA: efc14295f0a372b96afac740d6a01571f7582210
Preview run: 28027105615
Preview artifact: 7821161692
Production run: 28028685856
Production artifact: 7821826483
```

Accepted hosted matrix:

- separate Twitch and Kick Preview bindings with real retained data;
- Twitch desktop 1440×1100;
- Kick mobile 390×844;
- Overview, Retained Days, and Report & Export;
- archive bound of six before expansion;
- copy, CSV, and JSON without an extra History request;
- provider-specific filenames and content;
- mobile touch targets and long-text wrapping;
- no page-level horizontal overflow;
- exact production SHA through `/deployment.json`.

## 12. Completion and maintenance rule

Channel / Streamer v1 is complete.

Future changes are maintenance unless the roadmap and this specification are amended first. A verified P0/P1 production defect may interrupt later work. P2 visual polish must not silently replace the active roadmap phase.

History UI appearance work is a separate pending item and is not part of Channel maintenance or acceptance.
