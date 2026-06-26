# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## Current position

```text
Phase 7 P7A   complete PR #426
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
P9H0 closeout complete PR #432
Final-state correction complete PR #433
Phase 9 P9H1  complete PR #434
Phase 9 P9H2  active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
```

## Verified state

- Local Watchlist v1 is complete through PR #425.
- P9H1 completed metric synchronization across History URL, requests, chart, Summary, Selected day, ranking, archives, reports, share cards, and exports.

```text
P9H1 merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

The compact mobile task flow remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final acceptance.

## Historical P9H1 closeout snapshot

The following values describe the repository immediately after PR #435. They are retained for historical acceptance gates and are not the current execution state.

```text
Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
```

## P9H2 target

P9H2 repairs the daily chart so it has readable UTC dates, numeric scale, explicit metric and unit, exact day detail, synchronized selected-day state, pointer/keyboard/touch inspection, state markers that do not rely on color, and an accessible title and description.

It must preserve Twitch/Kick separation, P9H1 request behavior, Back/Forward, local task reuse, state honesty, and output formats.

## Phase 9 sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   exact next after P9H2 merge and explicit continuation; not created
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## Later program

```text
Phase 10 cross-site quality repair
Phase 11 acceptance, CI, type safety, monitoring
Phase 12 English legal, Support, Stripe readiness
Phase 13 English/Japanese localization
Phase 14 Spanish/pt-BR localization and staged launch
Phase 15 next-feature data audit
Phase 16 not approved
```

No Phase 16 feature is approved.

## Stop rule

Complete P9H2 on `work-history-ui-h2-chart`, merge it, name `work-history-ui-h3-overview` as the exact next branch, and stop until explicit continuation.