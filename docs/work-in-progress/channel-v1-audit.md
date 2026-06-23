# TEMPORARY — Channel / Streamer v1 current-state audit

Status: active temporary note
Created: 2026-06-23
Roadmap phase: Phase 3 preparation — Channel / Streamer v1
Branch: `work-channel-v1-audit`
Delete when: Channel v1 production acceptance is complete and stable decisions have moved into permanent Channel documentation.

## 1. Purpose

This audit records what the current Twitch and Kick Channel pages actually do, what the existing retained History payload can prove, and what Channel v1 must not claim.

The current page is not a complete channel analytics product. It is a provider-specific view over the selected channel's **retained daily Top 10 ranking footprint**.

## 2. Current public routes

```text
/twitch/channel/?id=<streamer-id>&name=<display-name>&period=7d|30d
/kick/channel/?id=<streamer-id>&name=<display-name>&period=7d|30d
```

Entry paths:

```text
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
apps/web/src/live/channel-profile.ts
apps/web/src/channel-profile.css
```

Build registration:

```text
twitchChannel: twitch/channel/index.html
kickChannel:   kick/channel/index.html
```

## 3. Current data path

The page makes exactly one provider-specific History request.

```text
Twitch -> /api/history?period=7d|30d&metric=viewer_minutes
Kick   -> /api/kick-history?period=7d|30d&metric=viewer_minutes
```

No Channel-specific API, database query, binding, collector, cron, retention rule, or migration exists.

Current payload consumption:

| Channel section | History payload source |
|---|---|
| Period summary | `topStreamers[]` matching the selected streamer id |
| Daily footprint | `daily[].topStreamers[]` matching the selected streamer id |
| Retained days | matching `daily[].topStreamers[]` rows |
| Rivalry candidates | `battleArchive[]` entries involving the streamer |
| State | `state` |
| Period label | `period` |
| Scope note | `coverage.notes[0]` plus local limitation copy |

## 4. Current visible product

The page currently exposes:

- provider and selected channel name;
- external Twitch or Kick channel link;
- 7-day / 30-day period switch;
- period viewer-minutes;
- peak viewers;
- average viewers;
- observed minutes;
- count of retained daily Top 10 appearances;
- a bar footprint for every requested day;
- retained-day cards with viewer-minutes, peak, average, observed time, and retained rank;
- bounded daily rivalry candidates;
- provider-safe Day Flow, Battle Lines, and History links;
- missing-id and request-error states.

## 5. What the current data can prove

The current History payload can support these claims for the selected provider and requested period:

- the channel appears in the retained period `topStreamers` result;
- the channel appears in a retained daily Top 10 row on a specific UTC day;
- viewer-minutes, peak viewers, average viewers, observed minutes, and retained rank reported in those retained rows;
- a retained daily rivalry candidate includes the channel;
- an observed day has a particular coverage state;
- the current payload source/state/period/coverage reported by the provider-specific History endpoint.

All wording must remain scoped to retained observations.

## 6. What the current data cannot prove

Channel v1 must not claim any of the following from the current payload alone:

- that the channel was offline on a day without a matching retained Top 10 row;
- exact stream start or end times;
- exact uninterrupted session duration;
- complete session history;
- complete provider-wide rank;
- complete provider-wide viewer-minutes or peak totals;
- that the channel had zero viewers when absent from retained rows;
- exact category/game history;
- exact language history;
- exact battle reversal timestamps;
- cross-platform combined totals or identity merge;
- full-provider comparison against every channel.

Required absence language:

```text
Not in retained daily Top 10
Not confirmed offline
```

## 7. Existing honesty safeguards

Current implementation already includes several correct safeguards:

- Twitch and Kick choose separate History endpoints;
- provider routes and external links remain separate;
- one request only;
- missing `id` sends no request;
- absent daily bars are patterned and labelled as not retained, not offline;
- session start/end history is explicitly unavailable;
- missing numeric values render as an em dash rather than zero;
- rivalry links remain day-level aggregate links;
- no cross-platform totals are produced.

These safeguards are invariants for Channel v1.

## 8. Existing automated coverage

Static contract:

```text
apps/web/scripts/verify-channel-profile.mjs
.github/workflows/channel-profile.yml
```

Browser contract:

```text
apps/web/scripts/channel-profile-browser.mjs
.github/workflows/channel-profile-browser.yml
```

Current browser matrix:

- Twitch History ranking to Channel deep link;
- Twitch desktop Channel page at 1440×1100;
- Kick mobile Channel page at 390×844;
- missing-id state;
- one provider-only History request;
- summary, footprint, retained days, rivalry cards, provider-safe links;
- no page-level horizontal overflow;
- screenshot artifacts.

## 9. Current UI and structural limitations

The minimal page is useful but not yet a finished Channel v1 product.

Confirmed limitations:

1. The page is a long sequence of equal-weight sections rather than a task-oriented information architecture.
2. The five summary cards do not distinguish primary facts from supporting scope facts.
3. The daily footprint is a simple horizontal-scroll bar field with vertical date labels; it is functional but weak for 30-day reading.
4. Period switching uses `history.replaceState` and a new request, but Back/Forward restoration is not covered.
5. There is no copyable summary, CSV export, or JSON export.
6. There is no explicit source / observed-days / requested-days summary near the hero beyond inherited state and prose.
7. The page has no dedicated previous-period comparison contract.
8. Rivalry candidates are bounded by `slice(0, 5)` but are not ranked or explained as a deliberate relevance order in the UI.
9. The page has no Channel-specific Preview or production acceptance gate.
10. The implementation, presentation, and payload transformation are concentrated in one `channel-profile.ts` file.
11. The CSS is compressed into one line, which makes review and extension harder.
12. The existing minimal contract lives under `apps/web/docs/` and is not yet the permanent product specification governed by the repository documentation index.

## 10. Channel v1 direction fixed by the current roadmap

Channel v1 should become a coherent retained-footprint product while keeping the same data honesty boundary.

Target capabilities for specification work:

- provider-specific Twitch and Kick Channel pages;
- 7-day and 30-day retained periods;
- clear source, state, observed scope, and limitation summary;
- retained period summary;
- readable retained daily trend / appearance view;
- retained-day archive;
- retained rivalry candidates;
- provider-safe links to History, Day Flow, and Battle Lines;
- copyable provider-specific summary;
- CSV and JSON export using the loaded payload;
- desktop, tablet, mobile, keyboard, Preview, and production acceptance.

## 11. Decisions still required in C1 specification

The permanent Channel specification must decide:

- final task structure and section order;
- whether Overview / Retained Days / Report & Export become explicit task views;
- canonical URL state for period and any selected day;
- Back/Forward behavior;
- ranking and ordering rules for rivalry candidates;
- the exact retained trend visual and missing-day treatment;
- whether a previous-period comparison is supportable without another request or payload change;
- output schemas and filenames for copy / CSV / JSON;
- whether Channel remains a History-derived client view or receives a Channel-specific API later;
- Preview branch and production acceptance matrix;
- permanent specification path and implementation PR slicing.

## 12. Non-goals for the first Channel v1 implementation

Unless a later data audit changes the roadmap, the first Channel v1 does not include:

- exact session timeline;
- category or language timeline;
- clips or VOD integration;
- login or cloud-saved profiles;
- watchlist or alerts;
- AI interpretation;
- cross-platform merged identity;
- provider-wide ranking claims;
- new collector cadence;
- D1 migration solely to make the existing retained-footprint page look more complete.

## 13. C0 completion criteria

C0 is complete when:

- current routes, files, data path, fields, and gates are recorded;
- supported and unsupported claims are explicit;
- existing provider-separation and honesty invariants are fixed;
- current product limitations are listed;
- C1 specification decisions are enumerated;
- the documentation index links this active temporary note;
- no Channel runtime behavior changes are included in the audit PR.

## 14. Deletion checklist

Delete this temporary note only after:

- a permanent Channel / Streamer specification exists;
- a PR-sliced implementation plan exists;
- Channel v1 passes its complete candidate matrix;
- deliberate Cloudflare Preview acceptance passes when required;
- exact production deployment and public smoke pass;
- stable decisions and final evidence move into permanent docs;
- roadmap and schedule move to the next approved phase;
- this note is removed from `docs/README.md`.
