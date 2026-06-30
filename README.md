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
Local Watchlist v1                     complete PR #425
Phase 8 inventory/browser audit        complete PR #428
Phase 9 History P1 repair             complete
P9H7 production acceptance            complete PR #451
P9H7 canonical closeout               complete PR #453
Phase 10 U10A quality baseline        complete PR #454
U10A canonical closeout               complete PR #455
Phase 10 U10B shared shell            complete PR #456
U10B canonical closeout               complete PR #457
Phase 10 U10C visualization           complete PR #458
U10C canonical closeout               complete PR #459
Phase 10 U10D analysis coherence      complete PR #462
U10D canonical closeout               complete PR #464
Active implementation branch          none
Exact next implementation branch      work-quality-u10e-responsive
U10E branch created                   no
```

Permanent evidence:

```text
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
docs/audits/cross-site-quality-u10b-shared-shell.json
docs/audits/cross-site-quality-u10c-visualization.json
docs/audits/cross-site-quality-u10d-analysis-coherence.json
```

## Current sequence

```text
U10A defect and ownership baseline       complete PR #454
U10B shared shell                        complete PR #456
U10C visualization                       complete PR #458
U10D analysis coherence                  complete PR #462
U10E responsive and accessibility        exact next
U10F readiness                           queued
U10G architecture                        queued
U10H acceptance                          queued
Phase 11 acceptance and operations       queued
Phase 12 release readiness               queued
Phase 13–14 localization                 queued
Phase 15 capability audit                queued
Phase 16 major feature                    not approved
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop.
