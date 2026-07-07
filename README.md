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
Phase 10 U10E responsive repair       complete PR #465
U10E canonical closeout               complete PR #466
Phase 10 U10F readiness               complete PR #468
U10F canonical closeout               complete PR #469
Phase 10 U10G architecture            complete PR #470
Phase 10 U10H production acceptance   complete PR #471
U10H canonical closeout               complete PR #472
Phase 11 P11A strict-null migration   complete
Phase 11 P11B CI ownership            complete
Phase 11 P11C monitoring contract     complete; hosted closeout after merge
Phase 11 P11D escalation runbook      complete
Phase 11 P11E maintenance cadence     complete
Phase 11 P11F acceptance ownership    complete
Phase 11 P11G final acceptance        active
Active implementation branch          work-quality-phase11-acceptance-operations
Current workstream                    P11G final pre-merge acceptance
```

Permanent Phase 11 evidence:

```text
docs/audits/phase11-strict-null-baseline.json
docs/audits/phase11-ci-ownership-baseline.json
docs/audits/phase11-ci-overlap-classification.json
docs/audits/phase11-monitoring-contract.json
docs/audits/phase11-public-acceptance-ownership.json
docs/operations/phase11-monitoring-and-escalation.md
docs/operations/phase11-maintenance-cadence.md
```

Active Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.

## Current sequence

```text
Phase 10 complete through U10H
Phase 11 P11A–P11F complete
Phase 11 P11G final acceptance active
Phase 12 release readiness queued
Phase 13–14 localization queued
Phase 15 capability audit queued
Phase 16 major feature not approved
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. After every merge, issue the full report and stop.
