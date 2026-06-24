# ViewLoom next-feature data-capability audit

Status: completed permanent audit record on PR #414 merge
Version: 1.0-complete
Last updated: 2026-06-24
Roadmap phase: Phase 5 — next-feature data-capability audit
Audit branch: `work-phase5-data-capability-audit`
Closure PR: #414

## 1. Purpose and decision

This audit determines what ViewLoom can honestly build next from its current Twitch and Kick data paths before approving new feature implementation.

The audit approves exactly one Phase 6 candidate:

```text
Provider-specific, login-free Local Watchlist v1
```

The following are not approved for immediate implementation:

```text
Session page as an exact session-history product
Category / Game trends
Language trends
Event Layer
Alerts
```

The approval is intentionally narrow. Watchlist v1 is a local observation shortcut over existing provider APIs. It is not live monitoring, an account product, an alert service, or a complete channel analytics system.

## 2. Audit boundary

Phase 5 is documentation and architecture analysis only. It changes no:

- public route or product UI;
- API behavior or response schema;
- D1 schema or binding;
- collector normalization or polling cadence;
- cron or retention;
- History, Channel, Heatmap, Day Flow, Battle Lines, or Status behavior;
- Twitch/Kick separation.

## 3. Current collection architecture

### 3.1 Shared operating limits

| Capability | Twitch | Kick |
|---|---:|---:|
| scheduled cadence | 5 minutes | 5 minutes |
| expected snapshots/day | 288 | 288 |
| latest observed limit | up to 300 | up to 100 official rows when available |
| raw snapshot retention | 30 days | 60 days |
| daily rollup retention | 180 days | 180 days |
| normal History read path | daily rollups | daily rollups |
| raw feature window | inside raw retention | inside raw retention |

The accepted zero-cost baseline previously measured approximately:

```text
Twitch raw payload growth: about 10 MB/day
Kick raw payload growth:   about 3 MB/day
Combined payload growth:   about 13 MB/day
```

D1 table and index overhead are additional.

### 3.2 Twitch collection boundary

Primary code:

```text
workers/collector-twitch/src/index.ts
workers/collector-twitch/wrangler.toml
```

Twitch reads the Helix streams endpoint in pages of 100 with a maximum of three pages.

The upstream row fields currently consumed are:

```text
user_login
user_name
viewer_count
started_at
```

The stored per-stream payload is reduced to:

```text
channelLogin
displayName
viewers
momentum
activity
```

`started_at` is used only to derive an activity value and is not retained. The current collector does not retain stream title, game/category, language, session id, or an upstream start timestamp.

Twitch coverage is a bounded observed Top 300 window. `covered_pages` and `has_more` expose whether additional Twitch streams may exist beyond the collected pages.

### 3.3 Kick collection boundary

Primary code:

```text
workers/collector-kick/src/index.ts
workers/collector-kick/src/official-livestreams.ts
workers/collector-kick/wrangler.toml
workers/collector-kick/migrations/0001_create_kick_channels.sql
```

Kick collection uses this order:

1. authenticated official livestreams, sorted by viewer count, limit 100;
2. registry-backed candidate reads when available;
3. seed-list fallback.

Registry/seed fallback may configure up to 220 slugs but attempts at most 75 each run. The first 20 are pinned and the remaining attempts rotate.

The stored per-stream payload is:

```text
slug
displayName
title
viewer_count
url
```

The current collector does not retain category, language, session id, or start time. The Kick registry records observation and targeting metadata such as last seen/live/check times, viewer count, title, priority, and success/failure counts. It is not a session-history table.

Kick coverage may be official Top 100, registry candidate coverage, or seed-list candidate coverage. It is not Twitch-parity directory coverage.

## 4. Stored data model

### 4.1 Minute snapshots

Both providers use provider-specific D1 databases and the `minute_snapshots` model.

Core fields:

```text
provider
bucket_minute
collected_at
total_viewers
stream_count
payload_json
source_mode
```

Twitch additionally uses coverage metadata including `covered_pages` and `has_more`.

The raw record describes one bounded observed snapshot, not the complete provider and not an authoritative online/offline directory.

### 4.2 Daily rollups

Permanent schema:

```text
db/d1/001_daily_rollups.sql
```

Fields:

```text
provider
day
total_viewer_minutes
peak_viewers
peak_streamer_id
peak_streamer_name
observed_snapshots
observed_stream_count
top_streamers_json
coverage_state
source_mode
updated_at
```

The rollup retains at most the Top 30 streams by daily viewer-minutes. Per-stream rollup facts are:

```text
streamerId
displayName
viewerMinutes
peakViewers
observedMinutes
rankByViewerMinutes
rankByPeak
```

The rollup does not contain title, category, language, exact start/end, session id, or uninterrupted-duration evidence.

## 5. Current public API capability

### Heatmap

```text
Twitch: /api/twitch-heatmap
Kick:   /api/kick-heatmap
```

Provides the latest observed bounded set, viewer count, momentum, update time, source state, and coverage metadata.

A channel absent from the latest payload is not confirmed offline. It may be outside the bounded observed set, outside the attempted Kick candidate set, missing because of collection gaps, or actually offline.

### Day Flow

```text
Twitch: /api/day-flow
Kick:   /api/kick-day-flow
```

Provides one day or rolling 24-hour 5m/10m viewer-volume and share analysis from raw snapshots. It can derive first and last observed buckets inside the selected window, but those are not authoritative session start/end values.

### Battle Lines

```text
Twitch: /api/battle-lines
Kick:   /api/kick-battle-lines
```

Provides viewer-derived rivalry lines and events inside a bounded raw window. Twitch reads at most 360 snapshot rows with an eight-second query timeout. Event types such as reversal, rapid rise, gap collapse, and peak are derived from observed viewer changes.

These events are not external real-world event records, exact stream events, or activity/chat events.

### History

```text
Twitch: /api/history
Kick:   /api/kick-history
```

History prefers daily rollups, permits a custom range of at most 90 days in v1, fills missing days explicitly, and exposes period summaries, daily rows, Top streams, coverage, and previous-period comparisons.

History does not expose category, language, exact sessions, or raw minute payloads to the browser.

### Channel

Channel derives one channel's retained footprint from one provider History response. It explicitly does not claim exact sessions, complete history, offline status from absence, provider-wide rank, or category/language history.

## 6. Retained field capability matrix

| Field or fact | Twitch | Kick | Long-term rollup | Product meaning |
|---|---:|---:|---:|---|
| provider channel id | yes | yes | Top 30 only | provider-specific identity |
| display name | yes | yes | Top 30 only | display fallback |
| viewer count at snapshot | yes | yes | aggregated | bounded observed value |
| snapshot time | yes | yes | day only | five-minute observation time |
| stream title | no | yes | no | not provider-parity |
| category/game | no | no | no | unavailable from current stored data |
| language | no | no | no | unavailable |
| upstream start time | fetched then discarded | not retained | no | unavailable for product claims |
| session id | no | no | no | unavailable |
| exact stream end | no | no | no | unavailable |
| authoritative offline state | no | no | no | absence is not proof |
| daily viewer-minutes | yes | yes | yes | observed bounded aggregate |
| daily peak | yes | yes | yes | observed bounded aggregate |
| daily observed minutes | yes | yes | yes | sampled presence, not uninterrupted duration |
| current momentum | yes | derived | no | latest snapshot comparison only |
| activity/chat heat | no | no | no | explicitly unavailable |
| latest observed membership | yes | yes | no | current bounded observation |

## 7. Candidate evaluation

### 7.1 Exact Session page

Decision:

```text
not approved
```

Current raw snapshots can derive contiguous observed-presence runs inside raw retention, but they cannot honestly establish:

- exact stream start;
- exact stream end;
- exact uninterrupted duration;
- complete session history;
- offline intervals;
- session identity across observation gaps.

A missing channel may be outside the Twitch Top 300, outside Kick's Top 100 or attempted candidates, affected by a collector/API gap, or offline.

A future feature could be renamed and scoped as `Observed Runs`, but it would require:

- a new materialized run/session-like table;
- an explicit gap and coverage model;
- forward-only generation or a bounded raw backfill;
- no claim that an observed run equals a platform session;
- storage and operational review.

Scanning many days of raw JSON on demand is not approved. Existing raw APIs are deliberately bounded to one-day/24-hour windows and row limits.

### 7.2 Category / Game trends

Decision:

```text
deferred; new collection required
```

The current Home parser can consume category-shaped fields, but current collectors do not store them. Real category output therefore lacks a reliable source.

A future Category/Game phase requires:

- Twitch collector game/category id and name retention;
- verified Kick category source and adapter;
- normalized provider-specific category identity;
- new category rollup storage;
- forward-only history or clearly bounded backfill;
- coverage labels that do not imply provider parity.

This is a data-platform expansion, not a UI-only feature.

### 7.3 Language trends

Decision:

```text
not approved
```

No language field is retained for either provider. Provider parity and source accuracy are unverified. Automatic classification would introduce a separate error model.

Language trends require new collection, normalization, accuracy policy, and rollup storage before product design can begin.

### 7.4 Event Layer

Decision:

```text
deferred
```

Viewer-derived Battle Lines events already exist inside raw windows. Turning them into a separate long-term Event Layer would require event materialization and retention and would otherwise duplicate Battle Lines.

An external event layer for tournaments or scheduled events requires a separate source of truth. Manual registration is technically possible but introduces a new event table and ongoing editorial maintenance. It is not the strongest next zero-cost product expansion.

### 7.5 Login-free Local Watchlist

Decision:

```text
approved as the single Phase 6 candidate
```

This candidate can be built without new collection or server-side user state.

Approved data sources:

```text
latest provider Heatmap response
one provider History response for the selected period
browser localStorage
```

The latest Heatmap response can show whether a saved channel is present in the latest bounded observation and, when present, its observed viewer count and update time.

The History response can show a saved channel's retained period and daily footprint when the channel appears in the retained Top stream results.

Required absence language:

```text
Not in latest observed set
Not confirmed offline

Not in retained History result
No complete history is implied
```

No per-channel server request is required. A provider page can fetch Heatmap once and History once, then match all locally saved ids.

### 7.6 Alerts

Decision:

```text
not approved
```

A real alert service requires persistent user subscriptions, background condition evaluation, delivery infrastructure, permission handling, retry/error behavior, and privacy/operational policy.

A browser tab that is open and polling is not an honest substitute for background alerts. Alerts remain deferred until Watchlist behavior, account strategy, delivery mechanism, and event reliability are separately approved.

## 8. Ranked recommendation

| Rank | Candidate | Decision | Reason |
|---:|---|---|---|
| 1 | Local Watchlist v1 | approve | existing APIs plus localStorage; low cost; honest bounded value |
| 2 | Observed Runs research | defer | possible from raw data, but requires new model and non-session naming |
| 3 | Category / Game trends | defer | collector and rollup expansion required |
| 4 | Event Layer | defer | new event source/storage or Battle Lines duplication |
| 5 | Language trends | no-go now | no retained field and uncertain accuracy |
| 6 | Alerts | no-go now | user state, background evaluation, and delivery infrastructure required |

## 9. Approved Local Watchlist v1 boundary

### Position

Watchlist is a provider-specific secondary surface for saved channel shortcuts and bounded observation evidence.

Provisional canonical routes:

```text
/twitch/watchlist/
/kick/watchlist/
```

A combined provider total or merged identity view is prohibited.

### Local storage

Use provider-separated, versioned localStorage keys.

Provisional stored entry:

```text
provider
channelId
displayName
addedAt
```

No server account, D1/KV/R2 user storage, or cross-device sync is part of v1.

### Data access

A provider Watchlist load may use:

```text
one latest Heatmap request
one History request for the selected period
```

All saved channels are matched locally against those responses. No N-per-channel request pattern is approved.

Period changes may issue one new provider History request. Local add/remove/reorder operations issue no network request.

### Supported states

Latest observation:

```text
Currently in latest observed set
Not in latest observed set
Latest provider data partial/stale/missing
```

Retained period evidence:

```text
Present in retained period result
Present on retained daily Top 10 days
Not in retained History result
History partial/missing
```

### Supported facts

When available:

- latest observed viewers;
- latest observation timestamp and state;
- period viewer-minutes, peak, average, and observed time from retained History;
- retained daily Top 10 appearance count;
- latest retained appearance;
- provider-safe links to Channel, Heatmap, Day Flow, Battle Lines, and History.

### Prohibited claims and features

Watchlist v1 must not claim or provide:

- authoritative live/offline status;
- complete tracking of saved channels;
- exact stream sessions;
- alerts or notifications;
- account login or cloud sync;
- cross-platform identity matching;
- cross-provider totals or rankings;
- provider-wide rank;
- category or language history;
- background collection beyond current collectors.

### Initial scale boundary

The permanent Watchlist specification must set a bounded saved-entry limit and mobile rendering contract before implementation. The initial recommendation is at most 50 saved ids per provider, with a smaller default visible subset and explicit expansion or filtering.

## 10. Phase 6 required PR sequence

### W0 — permanent specification and implementation plan

Documentation only.

Must freeze:

- routes and provider separation;
- localStorage schema and migration behavior;
- saved-entry limit;
- latest/retained evidence states and exact absence language;
- request-count contract;
- task structure, responsive layout, accessibility, and SEO;
- PR slicing and acceptance plan.

### W1 — local state and storage foundation

Implement provider-separated versioned localStorage, id normalization, add/remove/reorder behavior, and testable state without data fetching or final visual design.

### W2 — provider data adapters

Connect one provider Heatmap response and one provider History response, match saved ids locally, and preserve partial/stale/missing semantics.

### W3 — Watchlist user interface

Build provider-specific desktop/tablet/mobile surfaces and approved add/remove entry points without changing existing feature meaning.

### W4 — candidate QA

Run repository, browser, storage migration, request-count, provider-separation, accessibility, mobile, and overflow gates.

### W5 — hosted Preview and production acceptance

Because Watchlist is a visible new route, use an approved `preview-*` branch, verify real Twitch/Kick bindings independently, review artifacts, confirm the exact production SHA, then retire temporary notes.

## 11. Phase 5 closure conditions

PR #414 may merge only when:

- this permanent audit record is complete;
- roadmap and schedule approve only Local Watchlist v1 for Phase 6;
- the temporary Phase 5 note is deleted and unlinked after transfer;
- development policy verification fixes the decision as source of truth;
- final diff contains no runtime, route, UI, API, D1, binding, collector, cron, or retention change;
- the complete required repository regression matrix passes.

## 12. Final result

ViewLoom's current retained data is strong for bounded latest observation, day-level raw analysis, daily trends, rivalry, and retained channel footprint. It is not yet a session, category, language, external-event, or alert data platform.

Local Watchlist v1 is approved because it adds user value by organizing existing provider-specific evidence without inventing unavailable facts or adding ongoing server cost.
