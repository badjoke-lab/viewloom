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
P9H5 responsive and accessibility  complete PR #447
P9H5 canonical closeout             complete PR #448
Active implementation branch        none
Exact next branch                   work-history-ui-h6-candidate
P9H6 branch created                 no
```

Historical gate strings, not current state:

```text
P9H5 responsive and accessibility  active
Active implementation branch        work-history-ui-h5-responsive
Exact next branch                   work-history-ui-h6-candidate
P9H6 branch created                 no
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

## P9H5 accepted evidence

```text
PR: #447
Head: 2dd3926cd3e02ded472ef20ab1090b86d13675d4
Merge: d7d20a4874fb44afc2abe6cf2384951d26bd4804
Workflow run: 28293856405
Artifact: history-ui-h5-responsive / 7925847144
Digest: sha256:5d6f0d7a38dd58f19b270b9ab9ea0de331f3f0aaaa3bb66ef6d4caae4211d854
```

P9H5 establishes deterministic keyboard entry, stable chart keyboard inspection, pointer/touch day selection, required-width wrapping, 44px general and 48px archive/publishing targets, long-text wrapping, reduced-motion support, increased contrast, and forced-colors acceptance. It adds no competing History request seam and changes no API, D1, collector, cron, retention, binding, provider, archive, or output schema.

## Next sequence

```text
P9H4A Overview balance              complete PR #441
P9H4B Archives and Report & Export  complete PR #443
P9H5 responsive and accessibility  complete PR #447
P9H6 local candidate               exact next after explicit continuation
P9H7 production acceptance
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.