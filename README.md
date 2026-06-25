# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data.

## Core roles

- Heatmap = Now
- Day Flow = Today / selected UTC day
- Battle Lines = Rivalry
- History = Trends across retained days
- Channel = One retained channel footprint
- Local Watchlist = Browser-local saved channel evidence

Twitch and Kick remain separated across routes, APIs, storage, D1 bindings, rankings, exports, and coverage claims. ViewLoom does not publish combined provider totals.

## Current production state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate provider bindings, provider-specific Functions, bounded collector/history data, deployment identity, production smoke, explicit 404 behavior, and public Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, and Status routes.

Local Watchlist v1 completed through PR #425 with local, hosted Preview, and production acceptance.

## Current priority

The active program is public-surface audit and P0/P1 repair, not a new feature expansion.

```text
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser defect audit        P8B active
Phase 9  P0/P1 repair; History is the central track       queued
```

Current branch:

```text
work-public-browser-audit
```

Exact next branch after P8B completion, merge reporting, and explicit continuation:

```text
work-history-ui-h0-baseline
```

A newly proven P0 may interrupt.

## Active P8B audit

P8B uses the completed P8A inventory as its route, provider-binding, owner, state, and existing-gate baseline.

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production browser scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
```

P8B records exact browser evidence and classifies defects. It does not repair public UI or change APIs, D1, bindings, collectors, cron, retention, output schemas, or Cloudflare Preview state.

Active files:

- [`docs/audits/P8B_SCOPE.md`](docs/audits/P8B_SCOPE.md)
- [`apps/web/scripts/public-browser-audit.mjs`](apps/web/scripts/public-browser-audit.mjs)
- [`scripts/verify-public-browser-audit.mjs`](scripts/verify-public-browser-audit.mjs)
- [`.github/workflows/public-browser-audit.yml`](.github/workflows/public-browser-audit.yml)

## Approved History repair

The current History production baseline remains deployed, but these are approved P1 defects:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy change across the page;
- chart interpretation is not yet permanently protected by complete scale, date, unit, and interaction gates;
- selected-day and supporting information are too thin or disconnected;
- lower-page regions are sparse, duplicated, or unclear;
- desktop, tablet, and mobile do not yet prove one coherent analysis workflow.

The repair preserves the two existing metrics and does not authorize new History APIs, D1 schemas, collectors, cron, retention, bindings, exact sessions, provider totals, login, alerts, or AI summaries.

## Canonical documentation

Read in order:

- [`docs/operations/development-and-deployment-policy.md`](docs/operations/development-and-deployment-policy.md)
- [`docs/operations/development-policy-addendum.md`](docs/operations/development-policy-addendum.md)
- [`docs/operations/documentation-governance.md`](docs/operations/documentation-governance.md)
- [`docs/README.md`](docs/README.md)
- [`docs/product/current-roadmap.md`](docs/product/current-roadmap.md)
- [`docs/product/current-schedule.md`](docs/product/current-schedule.md)
- [`docs/product/post-watchlist-program-plan.md`](docs/product/post-watchlist-program-plan.md)

For History:

- [`docs/product/history-and-trends-spec.md`](docs/product/history-and-trends-spec.md)
- [`docs/product/history-ui-repair-spec.md`](docs/product/history-ui-repair-spec.md)
- [`docs/product/history-ui-repair-plan.md`](docs/product/history-ui-repair-plan.md)
- [`docs/work-in-progress/history-ui-repair-working-note.md`](docs/work-in-progress/history-ui-repair-working-note.md)

For P8B:

- [`docs/audits/P8B_SCOPE.md`](docs/audits/P8B_SCOPE.md)
- [`docs/audits/public-surface-inventory.json`](docs/audits/public-surface-inventory.json)
- [`docs/audits/public-surface-inventory.md`](docs/audits/public-surface-inventory.md)
- [`docs/audits/public-surface-gaps.json`](docs/audits/public-surface-gaps.json)

Implementation does not begin from chat memory, an old PR, or screenshots alone.

## Development operations

- normal work uses `work-*` branches;
- `preview-*` is reserved for deliberate Cloudflare runtime validation of a completed candidate;
- only latest-head evidence counts;
- merge status is not production status;
- provider separation and bounded coverage are mandatory;
- after each merge, issue the full merge report and stop before creating the next branch.

## Repository structure

- `docs/` — canonical product, program, operations, audit, and temporary documents
- `apps/web/` — public pages, shared UI, Functions, and browser/contract checks
- `workers/` — provider collectors and retention operations
- `packages/` — shared contracts and helpers

## Immediate execution order

```text
P7A  governance and schedule reset                         complete PR #426
P8A  public route and acceptance inventory                 complete PR #427
P8B  all-public browser defect audit                       active
P9H0 exact History reproduction and failing gates          exact next
P9H1 metric execution repair                               queued
P9H2 chart scale, axes, units, and day interaction          queued
P9H3 Overview information hierarchy                        queued
P9H4 Archives and Report & Export repair                    queued
P9H5 responsive and accessibility repair                    queued
P9H6 complete local candidate QA                            queued
P9H7 deliberate Preview and production acceptance          queued
```

Phase 10–15 are governed by `post-watchlist-program-plan.md`. No next major feature is approved.
