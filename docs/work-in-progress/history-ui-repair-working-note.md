# TEMPORARY — ViewLoom History UI repair working note

Status: P9H2 closeout complete
Created: 2026-06-25
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed P9H1: PR #434
Completed P9H2 implementation: PR #436
Completed P9H2 canonical closeout: PR #438
Current implementation branch: none
Current documentation branch: none
Exact next branch after full report and explicit continuation: `work-history-ui-h3-overview`
P9H3 branch created: no
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation plan: `../product/history-ui-repair-plan.md`
P8B baseline: `../audits/public-browser-defects.json`
P9H0 record: `../audits/history-ui-h0-findings.md`
P9H0 owner map: `../audits/history-ui-h0-owner-map.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## Historical P9H1 closeout snapshot

The following exact value describes the working note immediately after PR #435. It is retained for historical acceptance gates and is not the current execution state.

```text
Current implementation branch: none
```

## P9H1 completion

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge commit: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow run: 28232602651
Artifact: history-ui-h1-metric
Artifact ID: 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

## P9H2 completion

```text
PR: #436
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge commit: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow run: 28278497196
Artifact: history-ui-h2-chart
Artifact ID: 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
Canonical closeout: PR #438
```

Accepted behavior:

- the chart exposes readable UTC dates, numeric scale, selected metric and unit;
- pointer, keyboard, and touch day inspection stay synchronized with URL and Selected day;
- complete, partial, in-progress, missing, and demo states have non-color meaning;
- SVG title, description, live inspection, forced-colors, and focus behavior are present;
- day inspection reuses the loaded response and does not cross provider boundaries;
- Viewer-minutes and Peak viewers remain synchronized across the accepted P9H1 surfaces;
- Battle Archive and Daily archive day selection remain synchronized after redraws;
- Twitch and Kick remain separate;
- report/share/PNG/CSV/JSON formats remain unchanged.

The compact mobile task flow remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final production acceptance.

## Current owners

```text
history-current-shell-entry.ts       URL, request, base chart and daily rendering
history-usability-pass.ts            compatibility import order and day-selection bridge
history-usability.ts                 completed-day and coverage-state augmentation
history-view-shell.ts                task URL state, Back/Forward, section rehoming
history-overview.ts                  metric-aware Overview augmentation
history-report-text.ts               report, share, export rendering
history-report-text-state.ts         report payload and metric context
history-focus-fallback.css           focus presentation
history-visual-responsive.css        responsive layout
```

## Accepted P9H2 owners

```text
history-chart-p9h2.ts                SVG semantics, exact inspection, non-color states
history-chart-keyboard-delegation.ts stable HTML keyboard routing after redraws
history-chart-p9h2-compat.ts         accepted legend DOM compatibility
history-chart-p9h2.css               state markers, focus, forced-colors, inspection panel
history-comparison-clarity.ts        no-baseline and tracked-stream presentation
history-archives.ts                  deterministic archive hierarchy readiness
history-day-link-bridge.ts           stable History day selection across redraws
history-ui-h2-chart-browser.mjs      Twitch desktop and Kick touch-mobile acceptance
verify-history-ui-h2-chart.mjs       repository and boundary contract
history-ui-h2-chart.yml              latest-head workflow and artifact evidence
```

## Current sequence

```text
P9H0 work-history-ui-h0-baseline         complete PR #430
P9H1 work-history-ui-h1-metric           complete PR #434
P9H2 work-history-ui-h2-chart            complete PR #436
P9H2 canonical closeout                  complete PR #438
P9H3 work-history-ui-h3-overview         exact next after full report and explicit continuation; not created
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## Stop rule

P9H2 implementation and canonical closeout are complete. Issue the full report and stop. Do not create `work-history-ui-h3-overview` until explicit continuation.