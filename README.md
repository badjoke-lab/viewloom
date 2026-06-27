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
P9H3 Overview hierarchy             complete PR #439
P9H3 canonical closeout             complete PR #440
P9H4A Overview balance              active
Active implementation branch        work-history-ui-h4a-overview-balance
Exact next branch                   work-history-ui-h4b-tasks
P9H4B branch created                no
```

Historical gate strings, not current state:

```text
Active implementation branch        none
Exact next branch                   work-history-ui-h4-tasks
P9H4 branch created                 no
P9H3 Overview hierarchy             active
Active implementation branch        work-history-ui-h3-overview
Exact next branch                   work-history-ui-h4-tasks
P9H4 branch created                 no
Active implementation branch        none
Exact next branch                   work-history-ui-h3-overview
P9H3 branch created                 no
Active implementation branch        work-history-ui-h2-chart
Exact next branch                   work-history-ui-h2-chart
P9H2 branch created                 no
```

P9H2 evidence:

```text
Workflow run: 28278497196
Artifact: history-ui-h2-chart / 7921020539
```

P9H3 evidence:

```text
PR: #439
Head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow run: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

P9H3 keeps the full desktop Overview and shortens the mobile default flow to Summary, coverage status, chart, and Selected day. Compare periods, Calendar, Rankings & changes, and detailed Coverage remain available through explicit controls without another History request.

P9H4A repairs the newly confirmed Overview defects: `Key changes` overlap, oversized desktop Calendar, compressed ranking width, Summary/coverage imbalance, withheld-comparison volume, and remaining mobile density. It changes no API, D1, collector, cron, retention, binding, provider, or output schema.

## Next sequence

```text
P9H4A Overview balance              active
P9H4B Archives and Report & Export  next after merge and explicit continuation
P9H5 responsive and accessibility
P9H6 local candidate
P9H7 production acceptance
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.