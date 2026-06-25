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

ViewLoom Core v1 is deployed on Cloudflare Pages with:

- separate Twitch and Kick D1 bindings;
- provider-specific Pages Functions;
- bounded collector and retained-history data;
- production deployment identity and smoke checks;
- explicit not-found behavior;
- production Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, and Status routes.

Local Watchlist v1 completed through PR #425 with local, hosted Preview, and production acceptance.

## Current priority

The active program is public-surface audit and P0/P1 repair, not a new major feature.

```text
Phase 7  source-of-truth reset and repair-program lock    complete PR #426
Phase 8  all-public-surface inventory and browser audit   active
Phase 9  P0/P1 repair; History UI is the central track    queued
```

Current window and branch:

```text
P8A
work-public-surface-inventory
```

Exact next branch after P8A merge reporting and explicit continuation:

```text
work-public-browser-audit
```

## Approved History repair

The current History production baseline remains deployed, but these are approved P1 defects:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy change across the page;
- the main chart lacks readable scale, date ticks, units, and interaction cues;
- chart-side information is too thin or placeholder-like;
- lower-page regions are sparse or unclear in purpose;
- desktop, tablet, and mobile do not form one coherent analysis workflow.

Additional reference screenshots may refine styling later. They are not a blocker for functional, chart, information-architecture, responsive, or accessibility repair.

The repair preserves the two existing primary metrics and does not authorize new History APIs, D1 schemas, collectors, cron changes, retention changes, bindings, exact sessions, cross-provider totals, login, alerts, or AI summaries.

## Canonical documentation

Before changing this repository, read in order:

- [`docs/operations/development-and-deployment-policy.md`](docs/operations/development-and-deployment-policy.md)
- [`docs/operations/development-policy-addendum.md`](docs/operations/development-policy-addendum.md)
- [`docs/operations/documentation-governance.md`](docs/operations/documentation-governance.md)
- [`docs/README.md`](docs/README.md)
- [`docs/product/current-roadmap.md`](docs/product/current-roadmap.md)
- [`docs/product/current-schedule.md`](docs/product/current-schedule.md)
- [`docs/product/post-watchlist-program-plan.md`](docs/product/post-watchlist-program-plan.md)

For the active History repair program also read:

- [`docs/product/history-and-trends-spec.md`](docs/product/history-and-trends-spec.md) — accepted baseline
- [`docs/product/history-ui-repair-spec.md`](docs/product/history-ui-repair-spec.md) — active repair target
- [`docs/product/history-ui-repair-plan.md`](docs/product/history-ui-repair-plan.md) — Phase 7–9 subplan
- [`docs/work-in-progress/history-ui-repair-working-note.md`](docs/work-in-progress/history-ui-repair-working-note.md) — active execution memory

For P8A also read:

- [`docs/audits/P8A_SCOPE.md`](docs/audits/P8A_SCOPE.md)
- [`docs/audits/README.md`](docs/audits/README.md)

Implementation does not begin from chat memory, an old PR, or screenshots alone. Repository authorities are updated first when scope, priority, or behavior changes.

## Development operations

- normal work uses `work-*` branches;
- `preview-*` is reserved for deliberate Cloudflare runtime validation of a completed candidate;
- only the latest candidate head is authoritative;
- merge status is not production status;
- production completion requires exact deployment identity and public smoke verification;
- provider separation and honest bounded coverage are mandatory;
- after every merge, issue the full merge report and stop before creating the next branch.

## Repository structure

- `docs/` — canonical product, program, operations, audit, and temporary working documents
- `apps/web/` — public pages, shared UI, Pages Functions, and browser/contract checks
- `workers/` — provider collectors and retention operations
- `packages/` — shared contracts and helpers where applicable

## Immediate execution order

```text
P7A  governance and schedule reset                         complete PR #426
P8A  public route and acceptance inventory                 active
P8B  desktop/tablet/mobile browser defect audit            next
P9H0 exact History reproduction and failing gates          queued
P9H1 metric execution repair                               queued
P9H2 chart scale, axes, units, and day interaction          queued
P9H3 Overview information hierarchy                        queued
P9H4 Archives and Report & Export task repair               queued
P9H5 responsive and accessibility repair                    queued
P9H6 complete local candidate QA                            queued
P9H7 deliberate Preview and exact production acceptance    queued
```

Phase 10–15 are governed by `post-watchlist-program-plan.md`. No next major feature is approved. Category/Game, Observed Runs, Event, Language, and Alerts require a later data-capability audit and explicit approval.
