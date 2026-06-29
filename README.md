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
Active implementation branch          none
Exact next branch                     work-quality-u10b-shell
U10B branch created                   no
```

U10A classified eight cross-site findings without product repair, recorded authoritative and compatibility owners, and preserved provider separation. Its permanent records are:

```text
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
```

Latest accepted U10A evidence:

```text
Implementation head: 51c8883ebdc31334828cc345f6a938f17c20a29b
Implementation merge: 7665c5244d2fa71539ce9d69b3f5b55c47463075
Quality U10A Baseline: 28356915812 / 7945707844
Public Browser Audit: 28356915810 / 7945757041
Owned routes / viewports / production scenarios: 21 / 4 / 84
Mobile target scenarios: 18
Minimum measured target height: 34px
Horizontal overflow scenarios: 0
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

The permanent History record is `docs/operations/history-production-acceptance-2026-06-28.md`.

## Next sequence

```text
Phase 10 U10A defect and ownership baseline   complete PR #454
Phase 10 U10B shared shell                    exact next after explicit continuation
Phase 10 U10C visualization                   queued
Phase 10 U10D analysis coherence              queued
Phase 10 U10E responsive and accessibility    queued
Phase 10 U10F readiness                       queued
Phase 10 U10G architecture                    queued
Phase 10 U10H acceptance                      queued
Phase 11 acceptance and operations            queued
Phase 12 release readiness                    queued
Phase 13–14 localization                      queued
Phase 15 capability audit                     queued
Phase 16 major feature                        not approved
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop.
