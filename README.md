# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, storage, rankings, exports, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry
- History = Trends
- Channel = one retained channel footprint
- Local Watchlist = browser-local saved evidence

## Current state

```text
P9H0 History baseline               complete PR #430
P9H0 documentation closeout         complete PR #432
Final-state correction              complete PR #433
P9H1 metric synchronization         complete PR #434
P9H2 chart interpretation           complete PR #436
P9H2 canonical closeout             complete PR #437
P9H3 Overview hierarchy             active
Active implementation branch        work-history-ui-h3-overview
Exact next branch                   work-history-ui-h4-tasks
P9H4 branch created                 no
```

Historical gate strings, not current state:

```text
Active implementation branch        none
Exact next branch                   work-history-ui-h3-overview
P9H3 branch created                 no
Active implementation branch        work-history-ui-h2-chart
Exact next branch                   work-history-ui-h2-chart
P9H2 branch created                 no
```

P9H1 evidence:

```text
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

P9H2 evidence:

```text
PR: #436
Head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow run: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

P9H2 completed chart scale, UTC date context, metric/unit meaning, exact day inspection, keyboard/touch inspection, non-color state symbols, forced-colors support, and accessible SVG semantics without changing APIs, D1, collectors, bindings, provider separation, or outputs.

P9H3 repairs the Overview hierarchy. Desktop retains the full analysis. Mobile keeps Summary, coverage status, chart, and Selected day in the default flow, then exposes comparison, calendar, rankings/changes, and detailed coverage through explicit secondary-analysis controls. It adds no History request and changes no provider, API, storage, or output contract.

## Next sequence

```text
P9H3 Overview hierarchy             active
P9H4 Archives and Report & Export   next after merge and explicit continuation
P9H5 responsive and accessibility
P9H6 local candidate
P9H7 production acceptance
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.