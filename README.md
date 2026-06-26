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

Local Watchlist v1 completed through PR #425. The all-public browser audit completed through PR #428.

## Authoritative execution state

```text
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser defect audit        complete PR #428
Phase 9  P0/P1 repair; History is the central track       P9H0 active
```

Scheduled identifier: `work-history-ui-h0-baseline`  
Execution branch: `work-p9h0-baseline`  
Exact next branch after P9H0: `work-history-ui-h1-metric`

P9H0 reproduces the three accepted History P1 findings, traces source ownership, records executable acceptance failures, and freezes browser evidence before product repair. No public UI, API, D1, binding, collector, cron, retention, or output-schema change is allowed in this window.

Active P9H0 package:

- [`docs/audits/history-ui-h0-baseline.md`](docs/audits/history-ui-h0-baseline.md)
- [`docs/audits/history-ui-h0-owner-map.json`](docs/audits/history-ui-h0-owner-map.json)
- [`apps/web/scripts/history-ui-h0-browser.mjs`](apps/web/scripts/history-ui-h0-browser.mjs)
- [`scripts/verify-history-ui-h0-baseline.mjs`](scripts/verify-history-ui-h0-baseline.mjs)
- [`.github/workflows/history-ui-h0-baseline.yml`](.github/workflows/history-ui-h0-baseline.yml)

## Historical P8B verifier record

The following exact text is retained only for completed Phase 8 verification. It is not the current schedule.

```text
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser defect audit        P8B active
Phase 9  P0/P1 repair; History is the central track       queued
work-public-browser-audit
work-history-ui-h0-baseline
```

The completed P8B package remains:

- [`docs/audits/P8B_SCOPE.md`](docs/audits/P8B_SCOPE.md)
- [`docs/audits/public-browser-defects.json`](docs/audits/public-browser-defects.json)
- [`docs/audits/public-browser-audit.md`](docs/audits/public-browser-audit.md)
- [`apps/web/scripts/public-browser-audit.mjs`](apps/web/scripts/public-browser-audit.mjs)
- [`scripts/verify-public-browser-audit.mjs`](scripts/verify-public-browser-audit.mjs)
- [`.github/workflows/public-browser-audit.yml`](.github/workflows/public-browser-audit.yml)

## Approved History repair

The current History production baseline remains deployed, but these are approved P1 defects:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy change across the page;
- the first keyboard entry is not reliably actionable;
- desktop, tablet, and mobile do not yet prove one coherent analysis workflow.

The broader repair specification also requires permanent chart interpretation, selected-day, lower-page, responsive, and accessibility acceptance.

## Canonical documentation

Read in order:

- [`docs/operations/development-and-deployment-policy.md`](docs/operations/development-and-deployment-policy.md)
- [`docs/operations/development-policy-addendum.md`](docs/operations/development-policy-addendum.md)
- [`docs/operations/documentation-governance.md`](docs/operations/documentation-governance.md)
- [`docs/README.md`](docs/README.md)
- [`docs/product/current-roadmap.md`](docs/product/current-roadmap.md)
- [`docs/product/current-schedule.md`](docs/product/current-schedule.md)
- [`docs/product/post-watchlist-program-plan.md`](docs/product/post-watchlist-program-plan.md)
- [`docs/product/history-and-trends-spec.md`](docs/product/history-and-trends-spec.md)
- [`docs/product/history-ui-repair-spec.md`](docs/product/history-ui-repair-spec.md)
- [`docs/product/history-ui-repair-plan.md`](docs/product/history-ui-repair-plan.md)
- [`docs/work-in-progress/history-ui-repair-working-note.md`](docs/work-in-progress/history-ui-repair-working-note.md)

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
P8B  all-public browser defect audit                       complete PR #428
P9H0 exact History reproduction and baseline gates         active
P9H1 metric execution repair                               exact next
P9H2 chart scale, axes, units, and day interaction          queued
P9H3 Overview information hierarchy                        queued
P9H4 Archives and Report & Export repair                    queued
P9H5 responsive and accessibility repair                    queued
P9H6 complete local candidate QA                            queued
P9H7 deliberate Preview and production acceptance          queued
```

Phase 10–15 are governed by `post-watchlist-program-plan.md`. No next major feature is approved.
