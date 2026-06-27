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
P9H4A Overview balance              complete PR #441
P9H4A canonical closeout            complete PR #442
P9H4B Archives and publishing       complete PR #443
P9H4B canonical closeout            complete PR #444
Active implementation branch        none
Exact next branch                   work-history-ui-h5-responsive
P9H5 branch created                 no
```

Historical gate strings, not current state:

```text
P9H4B Archives and publishing hierarchy  active
Active implementation branch        work-history-ui-h4b-tasks
Exact next branch                   work-history-ui-h5-responsive
P9H5 branch created                no
P9H4A Overview balance              active
Active implementation branch        work-history-ui-h4a-overview-balance
Exact next branch                   work-history-ui-h4b-tasks
P9H4B branch created                no
P9H4A canonical closeout            active
Active implementation branch        work-history-ui-h4a-closeout
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

P9H3 retained evidence:

```text
Workflow run: 28280486736
Artifact: history-ui-h3-overview / 7921680615
```

P9H4A evidence:

```text
PR: #441
Head: 9cbaed979394232ceee5efc6c95954385eb230fa
Merge: 0201ff8464a568e5d6aebd1b3d179bcde93a17e7
Workflow run: 28283570437
Artifact: history-ui-h4a-overview-balance / 7922730563
Digest: sha256:62bd0bd1c991cdc87286aa62d28668c961cac987eebaf606db5512469e968aac
```

P9H4A makes `Key changes` normal-flow, bounds the desktop Calendar, protects ranking width, presents four primary Summary facts plus a full-width coverage band, compacts withheld comparison, and improves mobile chart, Selected day, and More analysis presentation. It adds no History observer or request seam and changes no API, D1, collector, cron, retention, binding, provider, or output schema.

P9H4B evidence:

```text
PR: #443
Head: 93195f3e79f1edf7c95cd1150c94b41582c50c29
Merge: e28a6db311129fafe8cd1069ffe4ab240ba2b8bf
Workflow run: 28289223184
Artifact: history-ui-h4b-tasks / 7924451682
Digest: sha256:f07200e1d5966dda3093788778d845fa2f8e2cc2ddf8fb4d939dba7c9992662f
```

P9H4B repairs Archives and Report & Export hierarchy while preserving one provider response, direct links, Back/Forward, report, post, PNG, CSV, and JSON contracts.

## Next sequence

```text
P9H4A Overview balance              complete PR #441
P9H4B Archives and Report & Export  complete PR #443
P9H5 responsive and accessibility  exact next after explicit continuation
P9H6 local candidate
P9H7 production acceptance
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.