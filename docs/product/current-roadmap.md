# ViewLoom current roadmap

Status: source of truth
Last reset: 2026-06-21

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages and connected to separate Twitch and Kick data paths.

Verified production foundations:

- production branch: `main`;
- automatic production deployment: enabled;
- Preview branches restricted to `preview-*`;
- Twitch and Kick Pages Functions use separate D1 bindings;
- Twitch and Kick collectors report fresh bounded observations;
- explicit 404 behavior is deployed;
- deployment identity and production smoke automation are present.

Current feature state:

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production-ready core | maintain and audit |
| Heatmap | production core complete | polish only unless defects are found |
| Day Flow | production core complete | polish only unless defects are found |
| Battle Lines | production core complete | polish only unless defects are found |
| History & Trends | functionally extensive, layout incomplete | highest-priority rebuild |
| Data Status | production core complete | maintain |
| Channel / Streamer | minimal retained-footprint page | next major feature after History |
| Session / Category / Watchlist / Alerts | not approved for implementation | data-capability audit required first |

## 2. Immediate priority

The current History page is not considered visually complete even though its individual functions work.

The page accumulated comparison, calendar, report text, share card, export, peak archive, battle archive, top-streamer ranking, daily archive, and coverage sections as separate vertical blocks. This created a long implementation-order page rather than a coherent public analysis experience.

Therefore the next product milestone is:

> Rebuild History information architecture and layout before starting Channel / Streamer v1 expansion.

The governing documents are:

- `history-and-trends-spec.md`;
- `history-layout-rebuild-plan.md`;
- `../work-in-progress/history-layout-rebuild-working-note.md` while the rebuild is active.

## 3. Ordered roadmap

### Phase 1A — repository and production acceptance baseline

State: substantially complete; maintain during the History rebuild.

Purpose:

- keep production smoke checks green;
- keep Cloudflare, D1, provider separation, and collector freshness observable;
- treat newly discovered P0/P1 defects as interrupt work;
- avoid unrelated feature expansion before the History layout milestone is closed.

### Phase 1B — History information architecture and layout rebuild

State: next.

Purpose:

- make the first screen answer the History question without excessive scrolling;
- separate analysis, archives, and publishing/export tasks;
- move Top streamers into the primary analysis flow;
- collapse or paginate archive-heavy content;
- replace unfinished-looking light cards with the shared dark visual system;
- establish readable typography and spacing on desktop and mobile;
- preserve all working History data contracts, provider separation, deep links, exports, and honest coverage states.

Target History views:

```text
Overview
Archives
Report & Export
```

### Phase 1C — History production acceptance

State: blocked by Phase 1B.

Purpose:

- desktop, tablet, and mobile browser acceptance;
- deliberate Cloudflare Preview validation for the completed candidate;
- production deployment identity verification;
- production smoke and manual visual acceptance;
- deletion of the temporary History working note after stable decisions are transferred into permanent docs.

### Phase 2 — remaining production P0/P1 repairs

State: conditional.

Purpose:

- repair only defects found during acceptance;
- keep P2 visual polish grouped rather than interrupting core work;
- skip or shorten this phase when no material defect remains.

### Phase 3 — Channel / Streamer v1 completion

State: queued after History.

Purpose:

- turn the current retained-ranking footprint into a useful provider-specific channel page;
- add 7-day / 30-day period views, trend summary, retained appearances, peaks, rivalry candidates, provider-safe deep links, copy summary, and CSV/JSON export;
- continue to state that absence from retained Top 10 does not prove offline activity;
- do not invent precise session boundaries from insufficient data.

### Phase 4 — report and export component consolidation

State: queued after Channel.

Purpose:

- reuse stable report, copy, share-card, and export primitives across History and Channel;
- standardize provider labels, filenames, period language, coverage language, and mobile behavior;
- avoid adding new report modes until existing outputs are coherent.

### Phase 5 — next-feature data-capability audit

State: blocked by Phases 1–4.

Candidates:

- Session page;
- Category / Game trends;
- Language trends;
- Event layer;
- local Watchlist;
- Alerts.

No candidate proceeds directly to implementation. The audit must determine retained fields, session reconstructability, retention limits, provider parity, Free-plan cost, schema changes, and cron requirements.

### Phase 6 — one approved major expansion

State: future.

Select one feature from Phase 5. Do not start multiple major data expansions in parallel.

Priority order when technically honest and affordable:

1. minimal Session page;
2. Category / Game trends;
3. login-free local Watchlist.

## 4. Work that is not currently scheduled

The following must not be inserted ahead of the active roadmap without updating this document:

- additional History features that increase page density;
- login or cloud user accounts;
- cross-platform combined totals or rankings;
- alerts or notifications;
- AI-generated interpretation;
- full-provider coverage claims;
- exact session history without a validated data model;
- unrelated visual redesigns of already accepted core pages.

## 5. Roadmap update rule

Update this file when:

- a phase begins or completes;
- production acceptance changes the priority order;
- a new blocker changes the next executable phase;
- a feature is removed, deferred, or approved after data audit.

PR descriptions must state which roadmap phase they implement. Work that is not represented here must first update the roadmap or explicitly document an approved exception.
