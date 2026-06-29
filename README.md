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
P9H0 History baseline                  complete PR #430
P9H1 metric synchronization            complete PR #434
P9H2 chart interpretation              complete PR #436
P9H3 Overview hierarchy                complete PR #439
P9H4A Overview balance                 complete PR #441
P9H4B Archives and publishing          complete PR #443
P9H5 responsive and accessibility     complete PR #447
P9H6 local candidate                  complete PR #449
P9H7 production acceptance            complete PR #451
P9H7 canonical closeout               complete PR #453
Phase 9 History P1 repair             complete
Phase 10 U10A quality baseline        active
Active implementation branch          work-quality-u10a-baseline
Exact next branch after U10A          work-quality-u10b-shell
U10B branch created                   no
```

U10A is baseline-only. It classifies non-History defects, records authoritative and compatibility owners, and adds static plus browser evidence before repair. Product repair is prohibited except proven P0 isolation.

Current U10A records:

```text
docs/work-in-progress/u10a-quality-baseline.md
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
```

## History production evidence

```text
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge workflow/artifact: 28325492470 / 7935573120
Post-merge workflow/artifact: 28325951638 / 7935706617
Providers: Twitch and Kick, separated
Hosted scenarios: 1440 / 820 / 390 / 360 / forced colors
Result: pass
```

The permanent record is `docs/operations/history-production-acceptance-2026-06-28.md`.

## Next sequence

```text
Phase 10 U10A defect and ownership baseline   active
Phase 10 U10B shared shell                    exact next after U10A
Phase 11 acceptance and operations            queued
Phase 12 release readiness                    queued
Phase 13–14 localization                      queued
Phase 15 capability audit                     queued
Phase 16 major feature                        not approved
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop.