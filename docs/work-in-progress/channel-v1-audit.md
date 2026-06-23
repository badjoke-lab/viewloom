# TEMPORARY — Channel / Streamer v1 current-state audit

Status: active temporary note
Created: 2026-06-23
Roadmap phase: Phase 3 preparation — Channel / Streamer v1
Branch: `work-channel-v1-audit`
C0 state: completed in PR #398; retained as the active C1 working note
Delete when: Channel v1 production acceptance is complete and stable decisions have moved into permanent Channel documentation.

## 1. Purpose

This audit records what the current Twitch and Kick Channel pages actually do, what the existing retained History payload can prove, and what Channel v1 must not claim.

The current page is not a complete channel analytics product. It is a provider-specific view over the selected channel's **retained daily Top 10 ranking footprint**.

## 2. Current public routes and files

```text
/twitch/channel/?id=<streamer-id>&name=<display-name>&period=7d|30d
/kick/channel/?id=<streamer-id>&name=<display-name>&period=7d|30d
```

```text
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
apps/web/src/live/channel-profile.ts
apps/web/src/channel-profile.css
apps/web/src/navigation/channel-profile-link.ts
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

The page exposes:

- provider and selected channel name;
- external Twitch or Kick channel link;
- 7-day / 30-day period switch;
- period viewer-minutes, peak viewers, average viewers, and observed minutes;
- count of retained daily Top 10 appearances;
- one footprint column for every requested day;
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
- the provider-specific History endpoint reports a particular source, state, period, and coverage note.

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
- exact category/game or language history;
- exact battle reversal timestamps;
- cross-platform combined totals or identity merge;
- full-provider comparison against every channel.

Required absence language:

```text
Not in retained daily Top 10
Not confirmed offline
```

## 7. Existing honesty safeguards

Current implementation already includes these correct safeguards:

- Twitch and Kick choose separate History endpoints;
- provider routes and external links remain separate;
- the page makes one request only;
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

Existing browser coverage includes:

- Twitch History ranking to Channel deep link;
- Twitch desktop Channel page at 1440×1100;
- Kick mobile Channel page at 390×844;
- missing-id state;
- one provider-only History request;
- summary, footprint, retained days, rivalry cards, and provider-safe links;
- no page-level horizontal overflow;
- screenshot artifacts.

## 9. Production baseline completed in C0

The temporary Channel C0 production audit ran against the exact deployed main revision:

```text
production SHA: fcc30aec4b67055505762a07688b5e36a58802d4
workflow run:   28004912659
artifact:       channel-c0-production-artifacts
artifact id:    7812384078
```

The gate selected real retained channels from the public History APIs rather than using fixtures.

Twitch desktop baseline:

```text
channel:       StRoGo / strogo
period:        7d
API source:    real
API state:     partial
observed days: 7
retained days: 3
rivalry cards: 2
viewport:      1440×1100
```

Kick mobile baseline:

```text
channel:       absi
period:        30d
API source:    real
API state:     partial
observed days: 30
retained days: 17
rivalry cards: 0
viewport:      390×844
```

Both pages passed provider-safe external links, limitation copy, summary-card presence, retained-day footprint rendering, and page-level overflow checks.

## 10. Production visual findings

The production baseline confirms that the minimal page functions, but it is not a finished Channel v1 experience.

1. The page is one long sequence of equal-weight sections rather than a task-oriented product.
2. Kick 30-day mobile renders all 17 retained-day cards at once, creating an extremely long page. Channel v1 must bound the default visible archive and provide an explicit expansion control.
3. The five summary cards do not distinguish primary facts from supporting scope facts.
4. The daily footprint uses vertical date labels and becomes weak for 30-day reading.
5. Light summary/day/rivalry cards have weak visual integration with the accepted dark ViewLoom surface system.
6. Period controls and scope facts are functional but do not form a clear analysis hierarchy.
7. An empty rivalry result is honest, but the section still consumes substantial space without helping the user choose the next task.
8. The shared masthead may report collector status unavailable even while the Channel page receives real History data; Channel must keep its own source/state evidence unambiguous.
9. The current mobile page has no task separation, no compact archive mode, and no publishing workspace.

## 11. Remaining structural limitations

- Period switching uses `history.replaceState` and a new request, but Back/Forward restoration is not covered.
- There is no copyable summary, CSV export, or JSON export.
- There is no explicit source / observed-days / requested-days summary near the hero beyond inherited state and prose.
- There is no dedicated previous-period comparison contract.
- Rivalry candidates are bounded by `slice(0, 5)` but are not ranked or explained as a deliberate relevance order.
- There is no permanent Channel-specific Preview or production acceptance gate.
- Implementation, presentation, and payload transformation are concentrated in one `channel-profile.ts` file.
- `channel-profile.css` is compressed into one line, making review and extension harder.
- The existing minimal contract under `apps/web/docs/` is not the permanent product specification governed by the repository documentation index.

## 12. Channel v1 direction fixed by the roadmap

Channel v1 should become a coherent retained-footprint product while keeping the same data honesty boundary.

Target capabilities for the permanent specification:

- provider-specific Twitch and Kick Channel pages;
- 7-day and 30-day retained periods;
- clear source, state, observed scope, and limitation summary;
- retained period summary and readable retained daily trend;
- bounded retained-day archive with expansion;
- retained rivalry candidates and honest empty state;
- provider-safe links to History, Day Flow, and Battle Lines;
- copyable provider-specific summary;
- CSV and JSON export using the loaded payload;
- desktop, tablet, mobile, keyboard, Preview, and production acceptance.

## 13. Decisions required in the C1 specification

The permanent Channel specification must decide:

- final task structure and section order;
- whether `Overview / Retained Days / Report & Export` are explicit task views;
- canonical URL state for period, task, and selected day;
- Back/Forward behavior;
- default archive visibility bounds on desktop and mobile;
- ordering and explanation rules for rivalry candidates;
- the retained trend visual and missing-day treatment;
- whether previous-period comparison is supportable without a second request;
- copy, CSV, and JSON schemas and filenames;
- whether the page remains a History-derived client view for v1;
- Preview branch and production acceptance matrix;
- permanent specification path and implementation PR slicing.

## 14. Non-goals for the first Channel v1 implementation

- exact session timeline;
- category or language timeline;
- clips or VOD integration;
- login or cloud-saved profiles;
- watchlist or alerts;
- AI interpretation;
- cross-platform merged identity;
- provider-wide ranking claims;
- new collector cadence;
- D1 migration solely to make the retained-footprint page look more complete.

## 15. C0 completion

C0 is complete because:

- current routes, files, data path, fields, and gates are recorded;
- supported and unsupported claims are explicit;
- provider-separation and honesty invariants are fixed;
- fixture browser coverage and real production baselines are recorded;
- current product limitations are listed;
- C1 specification decisions are enumerated;
- the documentation index links this active temporary note;
- no Channel runtime behavior changes are included in the audit PR.

Next executable step:

```text
C1 — create the permanent Channel / Streamer v1 specification and PR-sliced implementation plan.
```

## 16. Deletion checklist

Delete this temporary note only after:

- a permanent Channel / Streamer specification exists;
- a PR-sliced implementation plan exists;
- Channel v1 passes its complete candidate matrix;
- deliberate Cloudflare Preview acceptance passes when required;
- exact production deployment and public smoke pass;
- stable decisions and final evidence move into permanent docs;
- roadmap and schedule move to the next approved phase;
- this note is removed from `docs/README.md`.
