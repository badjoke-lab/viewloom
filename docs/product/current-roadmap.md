# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-23

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick data paths.

Verified production foundations:

- production branch: `main`;
- automatic production deployment: enabled;
- Preview branches restricted to `preview-*`;
- Twitch and Kick Pages Functions use separate D1 bindings;
- Twitch and Kick collectors expose bounded observations and freshness state;
- explicit 404 behavior is deployed;
- `/deployment.json` identifies the active production branch and commit;
- permanent Production Smoke automation is present.

Current feature state:

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production-ready core | maintain and audit |
| Heatmap | production core complete | polish only when a verified defect exists |
| Day Flow | production core complete | polish only when a verified defect exists |
| Battle Lines | production core complete | polish only when a verified defect exists |
| History & Trends | layout rebuild and production acceptance complete | maintain accepted contracts |
| Data Status | production core complete | maintain |
| Channel / Streamer | minimal retained-footprint page | next major product phase |
| Session / Category / Watchlist / Alerts | not approved for implementation | data-capability audit required first |

History production acceptance record:

```text
docs/operations/history-production-acceptance-2026-06-23.md
accepted production SHA: 3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

## 2. Immediate priority

The History H1–H7 milestone is closed. The next major product milestone is:

> Complete Channel / Streamer v1 from the current retained-ranking footprint without claiming complete session history.

The Channel phase must preserve the same honesty rules established by History:

- one provider at a time;
- retained observations are not provider-wide totals;
- absence from retained Top 10 does not prove that a channel was offline;
- exact session starts, ends, and uninterrupted duration are not inferred without sufficient retained data;
- missing, partial, stale, empty, demo, and error states remain distinct;
- Twitch and Kick routes, APIs, links, exports, and claims remain separated.

Before Channel implementation begins, its permanent specification and implementation plan must be reviewed against the current repository and data contract.

## 3. Ordered roadmap

### Phase 1 — production baseline and accepted core

State: completed; permanent maintenance responsibility.

Includes:

- Cloudflare production cutover;
- separate Twitch/Kick D1 bindings;
- collector and data-status visibility;
- exact deployment identity;
- explicit 404 behavior;
- permanent Production Smoke;
- accepted Heatmap, Day Flow, Battle Lines, History, and Status cores.

Maintenance rule:

- P0 production failures interrupt all planned work;
- P1 defects interrupt the active phase when they block its completion criteria;
- P2 polish is grouped and must not silently replace the active roadmap phase.

### Phase 1B / 1C — History rebuild and acceptance

State: completed on 2026-06-23.

Accepted structure:

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

Completion evidence:

- H1–H7 PR sequence completed;
- latest candidate workflow matrix passed;
- deliberate `preview-history-h7` runtime validation passed with separate Preview D1 bindings;
- Twitch desktop and Kick 390px full-page artifacts were reviewed;
- production deployed exact main SHA `3cde59cceb09a0c60f48794d6391cf5c356a1b31`;
- production browser acceptance passed;
- stable decisions were transferred to permanent docs;
- the temporary History working note was retired.

No further History density expansion is scheduled. Future History changes are maintenance or separately approved feature work.

### Phase 2 — remaining production P0/P1 repairs

State: conditional maintenance phase.

Purpose:

- repair only verified defects found in production or current acceptance gates;
- keep unrelated P2 visual work grouped;
- skip this phase when no material defect remains.

Entry rule:

- a reproducible production defect, failed permanent gate, or explicit acceptance gap exists.

Exit rule:

- the defect is covered by a permanent contract or browser gate and production smoke is green.

### Phase 3 — Channel / Streamer v1 completion

State: next.

Purpose:

- turn the existing retained-ranking footprint into a useful provider-specific Channel page;
- provide a coherent retained-history view without inventing sessions or complete platform coverage.

Target scope:

- Twitch and Kick provider-specific Channel routes;
- 7-day and 30-day retained views;
- retained appearances and trend summary;
- peak and viewer-minute facts supported by current data;
- rivalry candidates derived from retained observations;
- provider-safe links back to History, Day Flow, and Battle Lines;
- copyable summary;
- CSV and JSON export;
- honest coverage and absence language;
- desktop, tablet, mobile, keyboard, Preview, and production acceptance.

Required preparation:

1. audit the current Channel implementation and API payload;
2. confirm retained fields and unsupported claims;
3. update or create the permanent Channel specification;
4. create a PR-sliced implementation plan;
5. create a temporary working note only when unresolved implementation decisions require one.

Non-goals unless the data audit changes the roadmap:

- exact stream-session timelines;
- full-provider ranking claims;
- cross-platform channel totals;
- login or cloud-saved profiles;
- alerts;
- AI interpretation.

### Phase 4 — report and export component consolidation

State: queued after Channel.

Purpose:

- reuse stable report, copy, share-card, and export primitives across History and Channel;
- standardize provider labels, filenames, period language, coverage language, status messages, and mobile actions;
- remove duplication without changing data semantics;
- avoid adding new output modes until existing outputs share one tested contract.

### Phase 5 — next-feature data-capability audit

State: blocked by Phases 3–4.

Candidates:

- Session page;
- Category / Game trends;
- Language trends;
- Event layer;
- local Watchlist;
- Alerts.

The audit must determine:

- retained fields and time resolution;
- session reconstructability;
- provider parity;
- retention limits;
- D1 schema and migration requirements;
- cron and collector requirements;
- Cloudflare Free-plan cost;
- whether an honest MVP can be produced without invented precision.

No candidate moves directly from an idea to implementation.

### Phase 6 — one approved major expansion

State: future.

Only one major expansion may begin after Phase 5 updates this roadmap and the relevant permanent specification.

Tentative priority when technically honest and affordable:

1. minimal Session page;
2. Category / Game trends;
3. login-free local Watchlist.

## 4. Work that is not currently scheduled

The following must not be inserted ahead of the active roadmap without updating this document:

- additional History sections that increase page density;
- cross-platform combined totals or rankings;
- login or cloud user accounts;
- alerts or notifications;
- AI-generated interpretation;
- full-provider coverage claims;
- exact session history without a validated model;
- unrelated redesigns of accepted core pages;
- multiple major data expansions in parallel.

## 5. Roadmap update rule

Update this file when:

- a phase begins or completes;
- production acceptance changes the next executable phase;
- a new blocker changes priority;
- a feature is removed, deferred, or approved after data audit;
- a production defect becomes roadmap-level work rather than ordinary maintenance.

Every implementation PR must state:

```text
Roadmap phase:
Permanent specification:
Implementation plan:
Providers affected:
Data/API/DB/collector changes:
Preview requirement:
Production acceptance requirement:
```

Work not represented here must first update the roadmap or document an approved exception.
