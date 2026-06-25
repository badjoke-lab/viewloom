# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## 1. Current product state

ViewLoom Core v1 is deployed on Cloudflare Pages with separate Twitch and Kick data paths.

Verified production foundations:

- `main` is the production branch;
- production deployment identity is exposed through `/deployment.json`;
- Twitch and Kick Pages Functions and D1 bindings remain separate;
- collectors expose bounded observations and freshness state;
- explicit 404 behavior and permanent Production Smoke automation exist;
- Local Watchlist v1 is accepted through PR #425;
- the post-Watchlist source reset completed through PR #426;
- the static public-surface inventory completed through PR #427.

| Area | State | Roadmap meaning |
|---|---|---|
| Portal and provider homes | production core; P8B audit active | verified defects only after audit |
| Heatmap | production core; P8B audit active | verified defects only after audit |
| Day Flow | production core; P8B audit active | verified defects only after audit |
| Battle Lines | production core; P8B audit active | verified defects only after audit |
| History & Trends | production baseline accepted; P1 repair approved | P8B reproduction, then Phase 9 central repair |
| Data Status | production core; P8B audit active | verified defects only after audit |
| Channel / Streamer | v1 accepted; P8B cross-site audit active | preserve retained-footprint contract |
| Report/export shared layer | complete through PR #413 | preserve exact output contracts |
| Local Watchlist v1 | complete through PR #425 | preserve accepted local/Preview/production contract |
| Session / Category / Language / Event / Alerts | not approved | require later capability audit and explicit approval |

## 2. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact active window and next branch:
  docs/product/current-schedule.md

Complete Phase 7–15 program:
  docs/product/post-watchlist-program-plan.md

History repair target and sequence:
  docs/product/history-ui-repair-spec.md
  docs/product/history-ui-repair-plan.md
  docs/work-in-progress/history-ui-repair-working-note.md

P8B route and evidence baseline:
  docs/audits/P8B_SCOPE.md
  docs/audits/public-surface-inventory.json
  docs/audits/public-surface-inventory.md
  docs/audits/public-surface-gaps.json
```

## 3. Current priority

```text
Phase 7 — source-of-truth reset
State: complete through PR #426

Phase 8 — public-surface inventory and browser defect audit
P8A: complete through PR #427
P8B: active
Current branch: work-public-browser-audit
Exact next branch: work-history-ui-h0-baseline
Exception: a newly proven P0 may interrupt
```

P8B is an audit branch. It captures exact browser evidence, classifies defects, and produces the ordered Phase 9 queue. It does not repair product UI or alter data/runtime contracts.

## 4. Approved History P1 defects

The following remain approved without another product gate:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable, trustworthy page-wide change;
- the main chart lacks or fails to prove all required scale, ticks, units, and interaction cues;
- chart-side or selected-day information is too thin or disconnected;
- lower-page regions are sparse, weakly prioritized, duplicated, or unclear;
- desktop, tablet, and mobile do not yet prove one coherent task-oriented analysis flow.

Additional screenshots may refine styling later. They are not an entry criterion for repair.

## 5. Ordered roadmap

```text
Phase 7   source-of-truth reset and repair-program lock              complete PR #426
Phase 8   P8A inventory complete PR #427; P8B browser audit active
Phase 9   P0/P1 core repair; History UI central track                queued
Phase 10  cross-site visual and interaction-system consolidation     queued
Phase 11  operations, monitoring, and maintenance lock               queued
Phase 12  Support, legal, Stripe, and release-readiness audit        queued
Phase 13  external launch and feedback classification                queued
Phase 14  next-feature data-capability audit                         queued
Phase 15  one separately approved major feature, if any              not approved
```

No Phase 15 feature is approved by this roadmap.

## 6. Phase 8 P8B deliverables

```text
21 owned routes × 4 required viewports
5 missing policy/disclosure probes
10 deterministic History state/interaction scenarios
machine-readable runtime evidence
full-page screenshot artifact
machine-readable defect ledger
human-readable audit report
ordered Phase 9 queue
```

Required widths:

```text
1440px
820px
390px
360px
```

Required states where applicable:

```text
real/fresh
partial
stale
empty
missing
demo
error
loading
in progress
storage unavailable
long content
```

Defect classes:

```text
P0  outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, automation, or secondary interaction defect
P3  deferred improvement or feature request
```

## 7. Phase 9 sequence

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

Non-History P0/P1 defects discovered in P8B receive narrow repair branches. P2 polish and automation consolidation wait for the relevant later phase unless they block P1 acceptance.

## 8. Later phases

- Phase 10: shared UI, chart grammar, responsive, and accessibility consolidation.
- Phase 11: unified acceptance matrix, monitoring, runbooks, and maintenance cadence.
- Phase 12: Support, Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, Stripe, and launch readiness.
- Phase 13: staged external launch and feedback classification.
- Phase 14: evaluate zero or one next-feature candidate.
- Phase 15: no implementation branch until separately approved.

## 9. Work not approved in the current window

- new History primary metrics or archive types;
- exact session reconstruction;
- category or language collection;
- cross-platform totals or rankings;
- login, cloud accounts, alerts, or AI interpretation;
- new D1 schema, collector, cron, retention, binding, or API route;
- multiple major feature expansions in parallel.

## 10. Roadmap update rule

Update this file when a phase begins or completes, a P0/P1 changes order, or a future feature is approved or deferred.

After every merge, issue the full merge report, update canonical state, name the exact next branch, and stop until explicit continuation.
