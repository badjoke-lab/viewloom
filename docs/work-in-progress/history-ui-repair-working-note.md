# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Current implementation branch: `work-history-ui-h3-overview`
Exact next branch after merge and explicit continuation: `work-history-ui-h4-tasks`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation plan: `../product/history-ui-repair-plan.md`
P8B baseline: `../audits/public-browser-defects.json`
P9H0 record: `../audits/history-ui-h0-findings.md`
P9H0 owner map: `../audits/history-ui-h0-owner-map.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## Historical gate snapshots

The following values are retained for permanent gates and are not current state.

```text
Current implementation branch: none
P9H3 work-history-ui-h3-overview         exact next after explicit continuation; not created

Current implementation branch: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart            active
P9H3 work-history-ui-h3-overview         exact next after P9H2 merge and explicit continuation; not created

Current implementation branch: none
P9H2 work-history-ui-h2-chart            exact next after explicit continuation; not created
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
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge commit: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow run: 28278497196
Artifact: history-ui-h2-chart
Artifact ID: 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

Accepted behavior:

- readable UTC date and numeric scale context;
- explicit selected metric and unit;
- exact daily inspection;
- synchronized chart, URL, and Selected day;
- pointer, keyboard, and touch inspection;
- complete, partial, in-progress, missing, and demo meaning without color alone;
- accessible SVG title, description, focus, and forced-colors support;
- one loaded History response reused for day inspection;
- Twitch and Kick remain separate;
- report/share/PNG/CSV/JSON formats remain.

The compact mobile task flow remains assigned to P9H3/P9H5. The production/local keyboard discrepancy remains assigned to P9H5 and final production acceptance.

## Current owners

```text
history-current-shell-entry.ts      URL, request, base chart and daily rendering
history-usability-pass.ts           compatibility import order
history-usability.ts                completed-day and coverage-state augmentation
history-view-shell.ts               task URL state, Back/Forward, section rehoming
history-overview.ts                 metric-aware Summary/Selected day/ranking/insights
history-overview.css                Overview hierarchy and compactness
history-view-shell.css              task navigation
history-visual-responsive.css       responsive baseline
history-report-text.ts              report, share, export rendering
history-report-text-state.ts        report payload and metric context
```

## P9H2 implementation owners retained for permanent acceptance

```text
history-chart-p9h2.ts               SVG semantics, roving day navigation, exact inspection
history-chart-p9h2-compat.ts        compatibility with the accepted four-span legend DOM
history-chart-p9h2.css              state markers, focus, forced-colors, inspection panel
history-usability.ts                API coverageState preservation, including in-progress
history-archives.ts                 deterministic archive hierarchy readiness
history-ui-h2-chart-browser.mjs     Twitch desktop and Kick touch-mobile acceptance
verify-history-ui-h2-chart.mjs      repository and boundary contract
history-ui-h2-chart.yml             latest-head workflow and artifact evidence
```

## P9H3 observed problems

```text
Summary repeats facts already present in the selected metric context and coverage status
Selected day is useful but visually detached from Summary and can become a long mobile card
comparison, calendar, ranking, supported changes, and coverage are all expanded by default
mobile top-streamer cards and coverage detail lengthen the default task path
history-view-shell.ts rehomes sections by source selector order rather than one explicit Overview contract
history-overview.ts retains one legacy fetch wrapper and one document-wide observer; P9H3 must not add more
```

## P9H3 execution plan

```text
1. preserve the accepted P9H1/P9H2 request, metric, state, chart, and output contracts
2. make the Overview order explicit and task-first
3. compact Summary and connect it to Selected day analysis
4. make comparison compact while retaining metric meaning
5. keep calendar and ranking secondary to chart inspection
6. collapse or limit secondary mobile detail while retaining an explicit way to reveal it
7. add dedicated P9H3 repository and browser gates for desktop and 390px mobile
8. prove no additional History request and no Twitch/Kick endpoint crossing
```

## Current sequence

```text
P9H0 work-history-ui-h0-baseline         complete PR #430
P9H1 work-history-ui-h1-metric           complete PR #434
P9H2 work-history-ui-h2-chart            complete PR #436
P9H3 work-history-ui-h3-overview         active
P9H4 work-history-ui-h4-tasks            exact next after P9H3 merge and explicit continuation; not created
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## Stop rule

Complete P9H3 on `work-history-ui-h3-overview`. Do not create `work-history-ui-h4-tasks` until P9H3 merges, the full merge report is issued, and explicit continuation is received.