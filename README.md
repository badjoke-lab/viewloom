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
Active implementation branch          none
Exact next branch                     work-quality-u10a-baseline
U10A branch created                   no
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

The requested P9H7 Preview deployment never became available and returned 404 before product checks. PR #452 was closed without merge. Exact production identity and the full provider/browser matrix passed before and after the acceptance-only PR #451 merge.

## Next sequence

```text
Phase 10 U10A defect and ownership baseline   exact next after explicit continuation
Phase 11 acceptance and operations            queued
Phase 12 release readiness                     queued
Phase 13–14 localization                       queued
Phase 15 capability audit                      queued
Phase 16 major feature                         not approved
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop.
