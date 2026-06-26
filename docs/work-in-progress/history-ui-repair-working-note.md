# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed P9H1: PR #434
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h2-chart`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation plan: `../product/history-ui-repair-plan.md`
P8B baseline: `../audits/public-browser-defects.json`
P9H0 record: `../audits/history-ui-h0-findings.md`
P9H0 owner map: `../audits/history-ui-h0-owner-map.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## P9H1 completion

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge commit: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow run: 28232602651
Artifact: history-ui-h1-metric
Artifact ID: 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

Accepted behavior:

- Viewer-minutes and Peak viewers update URL, request state, chart, Summary, Selected day, comparison, Ranking context, Daily archive, Report, Share, and Export;
- one response is used per uncached provider/period/metric state;
- task and archive switching reuse the loaded response;
- Back/Forward and direct links remain;
- Twitch and Kick remain separate;
- report/share/PNG/CSV/JSON formats remain;
- daily rows without observations are not used as the report metric day.

The compact mobile task flow remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final production acceptance.

## Current owners

```text
history-current-shell-entry.ts      URL, request, base chart and daily rendering
history-usability-pass.ts           compatibility import order
history-view-shell.ts               task URL state, Back/Forward, section rehoming
history-overview.ts                 metric-aware Overview augmentation
history-report-text.ts              report, share, export rendering
history-report-text-state.ts        report payload and metric context
history-focus-fallback.css          focus presentation
history-visual-responsive.css       responsive layout
```

## Current sequence

```text
P9H0 work-history-ui-h0-baseline         complete PR #430
P9H1 work-history-ui-h1-metric           complete PR #434
P9H2 work-history-ui-h2-chart            exact next after explicit continuation; not created
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## P9H2 entry

P9H2 begins from PR #434 and the current owner map. It covers chart scale, date context, units, exact detail, pointer/keyboard/touch inspection, selected-day synchronization, state distinction, legend, and accessible description.

It must preserve the P9H1 metric behavior, provider/request boundaries, Back/Forward, loaded-response reuse, state honesty, and output formats.

## Stop rule

P9H1 is complete through PR #434. There is no active implementation branch. Do not create `work-history-ui-h2-chart` until explicit continuation.