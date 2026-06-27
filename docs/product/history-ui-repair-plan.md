# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.0
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Current implementation branch: `work-history-ui-h3-overview`
Exact next branch after merge and explicit continuation: `work-history-ui-h4-tasks`

## Historical P9H2 closeout snapshot

```text
Version: 1.9
Current implementation branch: none
Exact next branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created
```

## Historical P9H2 active snapshot

The following values describe the plan before PR #436 merged. They are retained for permanent P9H2 gates and are not current execution state.

```text
Version: 1.8
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`
P9H2 work-history-ui-h2-chart      active
```

## Historical P9H1 closeout snapshot

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

Required results now accepted:

- readable UTC date ticks and numeric scale;
- explicit metric and unit;
- exact daily detail;
- synchronized chart, URL, and Selected day state;
- pointer, keyboard, and touch inspection;
- Left/Right and Home/End movement;
- complete, partial, in-progress, missing, and demo meaning without color alone;
- accessible SVG title, description, and live inspection context;
- no additional History request when a day is inspected;
- no Twitch/Kick crossing or output-format change.

```text
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h2-chart-browser.mjs
scripts/verify-history-ui-h2-chart.mjs
.github/workflows/history-ui-h2-chart.yml
```

## Active P9H3 sequence

```text
P9H2 work-history-ui-h2-chart      complete PR #436
P9H3 work-history-ui-h3-overview   active
P9H4 work-history-ui-h4-tasks      exact next after P9H3 merge and explicit continuation; not created
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## P9H3 contract

P9H3 covers Overview order and compactness. It must:

- preserve provider, period, metric, state, and observed-scope context;
- keep controls and task navigation in coherent order;
- render a metric-aware Summary without duplicate or placeholder facts;
- make Selected day useful when a valid day exists;
- order chart, Selected day, comparison, calendar, rankings, supported changes, and coverage links coherently;
- shorten the mobile task flow without treating mobile as a scaled desktop;
- reuse loaded History data and preserve Back/Forward, provider separation, state honesty, and output schemas.

Implementation ownership:

```text
apps/web/src/live/history-current-shell-entry.ts   accepted state/request/base render owner
apps/web/src/live/history-view-shell.ts            task shell and section rehoming owner
apps/web/src/live/history-overview.ts              metric-aware Summary/Selected day/ranking/insights owner
apps/web/src/history-overview.css                  Overview hierarchy and compactness owner
apps/web/src/history-view-shell.css                task navigation owner
apps/web/src/history-visual-responsive.css         existing responsive baseline
```

P9H3 must not add a second History data source, another global fetch wrapper, a provider-neutral endpoint, or new server/storage work. New acceptance belongs in dedicated P9H3 repository and browser gates.

P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

## Stop rule

Complete P9H3 on `work-history-ui-h3-overview`. Do not create `work-history-ui-h4-tasks` until P9H3 merges, the full merge report is issued, and explicit continuation is received.