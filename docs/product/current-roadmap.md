# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick routes, APIs, D1 bindings, collectors, rankings, exports, and coverage claims.

Verified foundations:

- `main` is the production branch;
- production deployment identity is exposed through `/deployment.json`;
- Twitch and Kick Pages Functions and D1 bindings remain separate;
- collectors expose bounded observations and freshness state;
- explicit 404 behavior and permanent Production Smoke automation exist;
- Local Watchlist v1 is accepted through PR #425;
- the post-Watchlist source reset completed through PR #426;
- the static public-surface inventory completed through PR #427;
- the all-public browser audit completed through PR #428.

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production core | shared-quality work is scheduled in Phase 10 |
| Heatmap | production core | preserve current data and interaction contracts |
| Day Flow | production core | accessible date naming and first-render clarity are scheduled in Phase 10 |
| Battle Lines | production core | selected-time/default-battle coherence is scheduled for Phase 10 reproduction and repair |
| History & Trends | production baseline accepted; P1 repair active | Phase 9 central repair track |
| Data Status | production core | preserve explicit freshness, coverage, partial, and stale states |
| Channel / Streamer | v1 accepted | Phase 10 may repair empty-entry navigation without changing retained-footprint claims |
| Report/export shared layer | complete through PR #413 | preserve exact output contracts |
| Local Watchlist v1 | complete through PR #425 | preserve browser-local and provider-separated contracts |
| Support/legal/Stripe | incomplete | Phase 12 release-readiness work |
| UI localization | approved future program | Phase 13 English/Japanese; Phase 14 Spanish/pt-BR |
| Session / Category / stream-language analytics / Event / Alerts | not approved | require later capability audit and explicit approval |

## 2. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact active window and next branch:
  docs/product/current-schedule.md

Complete Phase 7–16 program:
  docs/product/post-watchlist-program-plan.md

History repair:
  docs/product/history-ui-repair-spec.md
  docs/product/history-ui-repair-plan.md
  docs/work-in-progress/history-ui-repair-working-note.md

Cross-site quality program:
  docs/product/cross-site-quality-remediation-spec.md
  docs/product/cross-site-quality-remediation-plan.md

Localization program:
  docs/product/localization-spec.md
  docs/product/localization-implementation-plan.md

Browser-audit baseline:
  docs/audits/P8B_SCOPE.md
  docs/audits/public-browser-defects.json
  docs/audits/public-browser-audit.md
```

## 3. Current priority

```text
Phase 7 — source-of-truth reset
State: complete through PR #426

Phase 8 — public-surface inventory and browser defect audit
P8A: complete through PR #427
P8B: complete through PR #428

Phase 9 — P0/P1 core repair; History central track
Current window: P9H0
Current branch: work-history-ui-h0-baseline
Execution state: documentation alignment and exact failing-gate baseline active
Exact next branch after P9H0 merge report and explicit continuation: work-history-ui-h1-metric
Exception: a newly proven P0 may interrupt
```

The first P9H0 batch must align all governing documents before runtime repair. Every later branch must reread the revised authorities instead of using chat memory or the pre-PR-428 schedule.

## 4. Phase 8 result

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History state/interaction scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

No production outage, materially wrong provider path, provider crossing, or horizontal overflow was found.

Approved P1 defects:

- History metric execution is not synchronized across the full page;
- History has no reliable first keyboard-focus entry;
- History lacks one coherent desktop/mobile task hierarchy.

Scheduled P2 work:

- shared mobile targets below 44px;
- Watchlist missing from general Public Readiness;
- general Production Smoke route omissions;
- Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes absent;
- Day Flow date control lacks an accessible name.

## 5. Ordered roadmap

```text
Phase 7   source-of-truth reset and repair-program lock              complete PR #426
Phase 8   public inventory and browser defect audit                   complete PR #428
Phase 9   History P1 repair                                           active P9H0
Phase 10  cross-site defect, UI, responsive, and architecture repair queued
Phase 11  acceptance, CI, type safety, monitoring, and maintenance   queued
Phase 12  English legal, Support, Stripe, and release readiness      queued
Phase 13  localization foundation plus English/Japanese             approved and queued
Phase 14  Spanish/pt-BR localization and staged external launch      approved and queued
Phase 15  next-feature data-capability audit                          queued
Phase 16  one separately approved major feature, if any              not approved
```

No Phase 16 feature is approved by this roadmap.

## 6. Phase 9 sequence

```text
P9H0 work-history-ui-h0-baseline
P9H1 work-history-ui-h1-metric
P9H2 work-history-ui-h2-chart
P9H3 work-history-ui-h3-overview
P9H4 work-history-ui-h4-tasks
P9H5 work-history-ui-h5-responsive
P9H6 work-history-ui-h6-candidate
P9H7 work-history-ui-h7-acceptance
```

P9H0 owns exact reproduction, authoritative-module tracing, compatibility-layer inventory, failing permanent gates, and documentation alignment. It does not add a new metric, API, D1 schema, collector field, cron, retention rule, or provider combination.

## 7. Phase 10–14 summary

### Phase 10 — cross-site quality remediation

Repair only reproduced defects and accepted cross-site inconsistencies. This includes common shell/components, chart grammar, Day Flow/Battle Lines coherence, responsive/accessibility targets, Channel/Watchlist readiness gaps, and safe retirement of duplicate or obsolete UI layers.

### Phase 11 — engineering and operations lock

Create one permanent all-public acceptance matrix, consolidate overlapping CI without weakening feature gates, restore effective strict null checking in staged scopes, and lock monitoring/runbooks/maintenance cadence.

### Phase 12 — English release readiness

Complete Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, Support, Stripe registration/payment flow, public limitations, FAQ, and release assets in the English source language.

### Phase 13 — English and Japanese localization

Introduce locale routing, typed message catalogs, fallback/missing-key gates, `Intl` formatting, pseudo-locale checks, localized shared shell and all public feature surfaces, then complete English/Japanese browser and production acceptance.

### Phase 14 — Spanish, Brazilian Portuguese, and launch

Add `es` and `pt-BR`, complete four-language SEO/browser acceptance, and perform staged external publication with evidence-based feedback classification.

Arabic/RTL is not included. It requires a separately approved RTL phase after actual usage evidence.

## 8. Localization boundaries

UI localization is distinct from collecting or analyzing stream language. The approved localization program:

- does not add provider-language analytics;
- does not translate streamer names, channel IDs, stream titles, categories, or provider-origin data;
- does not alter APIs, D1, collectors, cron, retention, or bindings;
- keeps existing English URLs canonical and adds locale-prefixed non-English routes;
- keeps Twitch and Kick separated in every locale.

## 9. Work not approved in the current window

- another History primary metric or archive type;
- exact session reconstruction;
- category or stream-language collection;
- cross-platform totals or rankings;
- login, cloud accounts, alerts, or AI interpretation;
- new D1 schema, collector, cron, retention, binding, or API route;
- localization runtime work before Phase 13;
- multiple major feature expansions in parallel.

## 10. Roadmap update rule

Update this file when a phase begins or completes, a P0/P1 changes order, localization scope changes, or a future feature is approved or deferred.

After every merge, issue the full merge report, update canonical state, name the exact next branch, and stop until explicit continuation.