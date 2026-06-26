# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## Current position

```text
Phase 7 source reset                     complete PR #426
Phase 8 inventory/browser audit          complete PR #428
P9H0 History baseline                    complete PR #430
P9H0 documentation closeout              complete PR #432
Final-state correction                   complete PR #433
P9H1 History metric synchronization      complete PR #434
P9H1 merge                               31b81d3ed3a56369055ba09eb4de871dfc59d315
Active implementation branch             none
Exact next branch                        work-history-ui-h2-chart
P9H2 branch created                      no
Phase 10 cross-site quality              queued
Phase 11 engineering/operations lock     queued
Phase 12 English release readiness       queued
Phase 13 English/Japanese localization   queued
Phase 14 Spanish/pt-BR and launch        queued
Phase 15 next-feature audit              queued
Phase 16 major feature                   not approved
```

## P9H1 evidence

```text
PR: #434
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge commit: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow run: 28232602651
Artifact: history-ui-h1-metric
Artifact ID: 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

Accepted scenarios:

```text
Twitch desktop 1440 × 1000
Kick mobile 390 × 844
```

P9H1 keeps URL, provider request, control, chart, Summary, Selected day, comparison, Ranking context, Daily archive, Report, Share, and Export aligned with Viewer-minutes or Peak viewers. Report and Archives task changes do not request History again. Twitch and Kick remain separate. Daily rows without observations are excluded from report metric-day selection.

No API, D1, collector, cron, retention, binding, provider-combination, or output-schema change was made.

## Immediate sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## P9H2 entry contract

P9H2 covers chart interpretation: readable UTC date ticks, numeric scale, visible metric and unit, exact detail, pointer/keyboard/touch inspection, selected-day synchronization, honest states, non-color-only legend, and accessible chart description.

P9H2 preserves P9H1 metric synchronization, provider/request boundaries, Back/Forward, local task no-refetch, degraded states, and output schemas.

## Stop rule

P9H1 is complete through PR #434. There is no active implementation branch. `work-history-ui-h2-chart` is the exact next branch and has not been created. Stop until explicit continuation.