# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-29

## Current position

```text
Phase 8 P8B complete PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete PR #451
P9H7 canonical closeout complete PR #453
Phase 10 U10A active
Active implementation branch: work-quality-u10a-baseline
Exact next implementation branch after U10A: work-quality-u10b-shell
U10B branch created: no
```

U10A is a defect and ownership baseline. It records non-History defects, authoritative and compatibility owners, missing assertions, and deterministic browser evidence before repair. Product repair is prohibited except proven P0 isolation.

## Current evidence

```text
docs/work-in-progress/u10a-quality-baseline.md
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
scripts/verify-quality-u10a-baseline.mjs
.github/workflows/quality-u10a-baseline.yml
```

## Accepted History production evidence

```text
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge workflow/artifact: 28325492470 / 7935573120
Post-merge workflow/artifact: 28325951638 / 7935706617
Providers: Twitch and Kick, separated
Hosted scenarios: 1440 / 820 / 390 / 360 / forced colors
Result: pass
```

## Ordered roadmap

```text
Phase 10 U10A defect and ownership baseline active
Phase 10 U10B shared shell exact next after U10A
Phase 10 U10C visualization queued
Phase 10 U10D analysis coherence queued
Phase 10 U10E responsive and accessibility queued
Phase 10 U10F readiness queued
Phase 10 U10G architecture queued
Phase 10 U10H acceptance queued
Phase 11 acceptance and operations queued
Phase 12 release readiness queued
Phase 13–14 localization queued
Phase 15 capability audit queued
Phase 16 major feature not approved
```

Do not start U10B or later phases in parallel.
