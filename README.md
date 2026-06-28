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
P9H6 local candidate               complete PR #449
P9H6 canonical closeout             complete PR #450
P9H7 hosted/production acceptance  active
Active implementation branch        work-history-ui-h7-acceptance
Preview branch                      preview-history-ui-h7-acceptance
```

Historical gate strings, not current state:

```text
Active implementation branch        none
Exact next branch                   work-history-ui-h7-acceptance
P9H7 branch created                 no
P9H6 local candidate               active
Active implementation branch        work-history-ui-h6-candidate
P9H6 canonical closeout             active
Active implementation branch        work-history-ui-h6-closeout
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

## P9H6 accepted evidence

```text
PR: #449
Head: c7d54e530053b29091b84e651b78b679f55f3a8a
Merge: d46e2f3d04c9528e6493d9aa3d436000e340272a
Workflow run: 28308389704
Artifact: history-ui-h6-candidate / 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Manifest: viewloom-history-ui-h6-candidate-v1
Phases: 6
Scenarios: 21
```

P9H6 builds the accepted History implementation once, runs P9H1–P9H5 against one local preview and one exact HEAD, and records stable scenario IDs, provider-separated requests, and per-phase evidence digests. It changes no runtime, API, D1, collector, cron, retention, binding, provider, archive, metric, or output schema.

## Active P9H7 boundary

P9H7 adds acceptance tooling only. The final work HEAD must be deployed once to `preview-history-ui-h7-acceptance`, accepted against real Twitch and Kick data, squash merged to `main`, and then accepted again against the exact production deployment SHA. Phase 10 remains blocked until permanent evidence is written and temporary History repair notes are deleted.

## Next sequence

```text
P9H5 responsive and accessibility  complete PR #447
P9H6 local candidate               complete PR #449
P9H7 production acceptance         active
Phase 10 cross-site repair         blocked until P9H7 closure
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.
