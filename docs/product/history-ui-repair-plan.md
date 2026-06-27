# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.9
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #438
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h3-overview`
P9H3 branch created: no

## Historical P9H1 closeout snapshot

The following exact values describe the implementation plan immediately after PR #435. They are retained for historical acceptance gates and are not the current execution state.

```text
Version: 1.7
Current implementation branch: none
P9H2 work-history-ui-h2-chart      exact next; not created
```

## Completed P9H1

PR #434 aligned Viewer-minutes and Peak viewers across the History URL, request state, chart, Summary, Selected day, comparison, Ranking context, Daily archive, Report, Share, and Export.

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

## Completed P9H2

PR #436 repaired the daily trend chart while preserving all accepted P9H1 metric behavior.

```text
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

Accepted results:

- readable UTC date ticks and numeric scale;
- explicit metric and unit;
- exact daily detail;
- synchronized chart, URL, Selected day, and inspection state;
- pointer, keyboard, and touch inspection;
- Left/Right and Home/End movement;
- complete, partial, in-progress, missing, and demo meaning without color alone;
- accessible SVG title, description, live inspection, focus, and forced-colors behavior;
- no additional History request when a day is inspected;
- stable Daily archive and Battle Archive day selection after redraws;
- no Twitch/Kick crossing or output-format change.

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h2-chart-browser.mjs
scripts/verify-history-ui-h2-chart.mjs
.github/workflows/history-ui-h2-chart.yml
```

## Remaining sequence

```text
P9H2 work-history-ui-h2-chart      complete PR #436
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H3 covers Overview order, analytical usefulness, duplicate removal, and compactness while preserving P9H1/P9H2 behavior. P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

## Stop rule

P9H2 and PR #438 closeout are complete. Do not create `work-history-ui-h3-overview` until the full closeout report is issued and explicit continuation is received.