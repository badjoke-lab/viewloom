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

Local Watchlist v1 completed through PR #425. The public route inventory and all-public browser audit completed through PR #428.

## Current priority

The active program is History P1 repair, followed by cross-site quality/architecture work, release readiness, and UI localization. It is not a new major-feature expansion.

```text
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser defect audit        complete PR #428
Phase 9  History P1 repair                                P9H0 active
```

Current branch:

```text
work-history-ui-h0-baseline
```

Exact next branch after P9H0 completion, merge reporting, and explicit continuation:

```text
work-history-ui-h1-metric
```

A newly proven P0 may interrupt.

## Completed P8B audit

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production browser scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

P8B found no outage, materially wrong provider path, provider crossing, or horizontal overflow.

Permanent records:

- [`docs/audits/P8B_SCOPE.md`](docs/audits/P8B_SCOPE.md)
- [`docs/audits/public-browser-defects.json`](docs/audits/public-browser-defects.json)
- [`docs/audits/public-browser-audit.md`](docs/audits/public-browser-audit.md)
- [`apps/web/scripts/public-browser-audit.mjs`](apps/web/scripts/public-browser-audit.mjs)
- [`scripts/verify-public-browser-audit.mjs`](scripts/verify-public-browser-audit.mjs)

## Active History repair

Approved P1 defects:

- Viewer-minutes and Peak viewers do not produce one coherent page-wide change;
- the first keyboard Tab does not reliably enter a visible actionable control;
- desktop, tablet, and mobile do not present one coherent task-first analysis flow.

P9H0 first aligns all governing documents, then records exact failing gates and final module/controller ownership before product repair.

The repair preserves the two existing metrics and does not authorize new History APIs, D1 schemas, collectors, cron, retention, bindings, exact sessions, provider totals, login, alerts, AI summaries, or localization runtime.

## Approved later program

```text
Phase 10  reproduced cross-site defect/UI/architecture remediation
Phase 11  all-public acceptance, CI, type safety, monitoring, maintenance
Phase 12  English Support, legal, Stripe, and release readiness
Phase 13  localization foundation plus English/Japanese
Phase 14  Spanish/pt-BR localization and staged external launch
Phase 15  next-feature data-capability audit
Phase 16  at most one separately approved major feature; not approved now
```

UI localization is distinct from collecting or analyzing stream language. Initial approved locales are `en`, `ja`, `es`, and `pt-BR`, delivered only after the preceding quality and release-readiness phases.

## Canonical documentation

Read in order:

- [`docs/operations/development-and-deployment-policy.md`](docs/operations/development-and-deployment-policy.md)
- [`docs/operations/development-policy-addendum.md`](docs/operations/development-policy-addendum.md)
- [`docs/operations/documentation-governance.md`](docs/operations/documentation-governance.md)
- [`docs/README.md`](docs/README.md)
- [`docs/product/current-roadmap.md`](docs/product/current-roadmap.md)
- [`docs/product/current-schedule.md`](docs/product/current-schedule.md)
- [`docs/product/post-watchlist-program-plan.md`](docs/product/post-watchlist-program-plan.md)

Active History authorities:

- [`docs/product/history-and-trends-spec.md`](docs/product/history-and-trends-spec.md)
- [`docs/product/history-ui-repair-spec.md`](docs/product/history-ui-repair-spec.md)
- [`docs/product/history-ui-repair-plan.md`](docs/product/history-ui-repair-plan.md)
- [`docs/work-in-progress/history-ui-repair-working-note.md`](docs/work-in-progress/history-ui-repair-working-note.md)

Approved future authorities:

- [`docs/product/cross-site-quality-remediation-spec.md`](docs/product/cross-site-quality-remediation-spec.md)
- [`docs/product/cross-site-quality-remediation-plan.md`](docs/product/cross-site-quality-remediation-plan.md)
- [`docs/product/localization-spec.md`](docs/product/localization-spec.md)
- [`docs/product/localization-implementation-plan.md`](docs/product/localization-implementation-plan.md)

Implementation does not begin from chat memory, an old PR, or screenshots alone. Every branch rereads the current authorities and confirms the scheduled branch before changing code.

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
P9H0 exact History reproduction, ownership, failing gates  active
P9H1 metric execution repair                               exact next
P9H2 chart scale, axes, units, and day interaction          queued
P9H3 Overview information hierarchy                        queued
P9H4 Archives and Report & Export repair                    queued
P9H5 responsive and accessibility repair                    queued
P9H6 complete local candidate QA                            queued
P9H7 deliberate Preview and production acceptance          queued
```

Phase 10–16 are governed by `post-watchlist-program-plan.md`. No Phase 16 feature is approved.