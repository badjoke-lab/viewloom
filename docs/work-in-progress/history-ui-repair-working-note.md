# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Completed window: P8A — public surface inventory through PR #427
Exact next window: P8B — public browser defect audit
Exact next branch: `work-public-browser-audit`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation subplan: `../product/history-ui-repair-plan.md`
Completed inventory: `../audits/public-surface-inventory.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved defect classification

The following are approved P1 defects and are not waiting for another product decision:

```text
Metric controls do not produce a sufficiently observable and trustworthy change.
The main chart does not expose a readable scale, ticks, units, or complete interaction cues.
The chart-side information is too thin to support analysis.
Lower-page regions are sparse, weakly prioritized, or unclear in purpose.
Desktop and mobile do not read as one coherent analysis product.
```

Additional reference screenshots may refine styling later. They are not required before functional, chart-interpretability, information-architecture, responsive, or accessibility repair begins.

## 2. Completed predecessors

### P7A — PR #426

- corrected stale post-Watchlist authorities;
- approved History UI repair as P1 work;
- removed the screenshot blocker;
- added permanent repair specification and implementation plan;
- created this working note;
- updated policy verification.

### P8A — PR #427

- inventoried all 20 Vite HTML inputs plus the explicit 404 page;
- created Portal, Twitch, and Kick route records;
- created shared owner, control, state, gate, assessment, and gap profiles;
- recorded separate Twitch and Kick API/binding ownership;
- recorded existing contract, browser, Preview, and production evidence;
- added a human-readable report, machine-readable manifest, verifier, and workflow;
- made no runtime UI, API, D1, collector, cron, retention, binding, or Preview change.

## 3. P8A stable History findings

Both History routes are owned and recorded:

```text
/twitch/history/ -> /api/history -> DB_TWITCH_HOT
/kick/history/   -> /api/kick-history -> DB_KICK_HOT
```

Recorded user state and tasks:

```text
period: 7d / 30d / custom from-to
metric: viewer_minutes / peak_viewers
task: Overview / Archives / Report & Export
archive: Daily / Peaks / Battles
selected day
ranking sort and limit
Back / Forward and direct URL responsibility
report / short post / share / PNG / CSV / JSON
```

Recorded data states:

```text
loading
real
partial
stale
empty
missing
demo
error
in_progress
```

Recorded owners include:

```text
history-usability-pass.ts
history-current-shell-entry.ts
history-usability.ts
history-overview.ts
History API model/builders
History archive, comparison, report, share, and export modules
```

P8A confirms that broad legacy workflow coverage does not prove current usability. The approved History P1 classification remains unchanged.

## 4. Cross-site P8A findings relevant to P8B

```text
20 Vite HTML inputs
1 explicit 404 page
21 owned inventory entries
16 indexable routes
4 noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

Gaps requiring P8B evidence or later repair classification:

- both Watchlist routes are omitted from Public Readiness configuration;
- About, Support, Changelog, Channel, and Watchlist are omitted from the general Production Smoke page list;
- no single permanent browser matrix covers every major route at 1440, 820, 390, and 360 pixels across required states;
- Portal, provider homes, Heatmap, Day Flow, Battle Lines, content pages, and 404 have fragmented rather than consolidated viewport/state coverage;
- Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes are absent;
- Support refers to refund handling without a dedicated repository-owned Refund Policy route.

These are inventory findings, not automatically product defects. P8B must reproduce and classify them.

## 5. Required P8B browser evidence

P8B must include:

```text
1440px Twitch Overview
1440px Kick Overview
820px task and control wrapping
390px Overview and selected-day flow
360px narrow control and chart behavior
Viewer-minutes before and after state
Peak viewers before and after state
partial data
empty data
stale data
missing data
demo data
API error
loading state
Archives Daily / Peaks / Battles
Report & Export
Back / Forward and direct links
```

Cross-site evidence must also cover:

- Portal and provider homes;
- Heatmap, Day Flow, and Battle Lines;
- Channel and Watchlist;
- Status;
- About, Support, missing-policy entry points, Changelog, and 404;
- keyboard, focus, touch targets, reduced motion, contrast, long text, and horizontal overflow;
- provider separation and bounded-coverage wording.

P8B must record route, provider, viewport, data state, reproduction, owner file, current workflow, missing assertion, and P0/P1/P2/P3 classification for each defect.

## 6. Questions P9H0 must answer

- Which module is authoritative for metric URL state?
- Does changing metric fetch a new payload, reuse a payload containing both metrics, or combine both behaviors?
- Which visible values change when metric changes?
- Which values remain mislabeled or stale?
- Which module renders chart scale and day columns?
- What accessible representation exists for chart values?
- Which sections are physically moved by the view shell and which remain duplicated or hidden?
- Which compatibility layers can be retired safely?
- Which workflows assert real metric differences, axes, units, selected-day synchronization, and touch behavior?
- Which sparse areas are caused by missing data, hidden task content, fixed min-height, or empty placeholders?

## 7. Fixed boundaries

```text
Providers remain separate.
Primary metrics remain Viewer-minutes and Peak viewers.
No new D1 schema.
No collector, cron, retention, or binding change.
No new History API route.
No exact sessions.
No cross-platform total or ranking.
No login, cloud preference, alert, or AI summary.
No silent output-schema change.
```

## 8. Current sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           exact next after explicit continuation
P9H0 work-history-ui-h0-baseline         queued
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 9. Repository-comparison checklist

Before each branch:

```text
[ ] predecessor PR merged
[ ] full merge report issued
[ ] explicit continuation exists
[ ] schedule names the intended branch
[ ] roadmap, program plan, subplan, note, and audit records agree
[ ] required files and workflows exist
[ ] missing deliverables are listed
[ ] scope boundaries remain valid
```

Before merge:

```text
[ ] latest-head CI passes
[ ] required evidence exists
[ ] provider separation passes
[ ] canonical documents show completed and next state
[ ] exact next branch is named
```

## 10. Working-note rule

Update this note whenever an audit or repair branch discovers or resolves a material defect, owner, visual hierarchy decision, acceptance requirement, or scope boundary.

Transfer stable decisions into permanent documentation and delete this note in P9H7.
