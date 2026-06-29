# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-29

## Current position

```text
Phase 8 inventory/browser audit          complete PR #428
Phase 9 History P1 repair                complete
P9H7 production acceptance              complete PR #451
P9H7 canonical closeout                 complete PR #453
U10A defect and ownership baseline       active
Active implementation branch             work-quality-u10a-baseline
Exact next branch after U10A              work-quality-u10b-shell
U10B branch created                       no
```

## U10A execution window

```text
Entry main commit: 3ad171002ca908f8cf05e458c40009f88fdc6df4
Purpose: reproduce and classify non-History defects
Required output: defect ledger, owner map, missing assertions, static verifier, browser evidence, temporary working note
Product repair: prohibited except proven P0 isolation
Provider boundary: Twitch and Kick remain separate
```

U10A currently covers Day Flow first render and date controls, Battle Lines recommendation and selected-time coherence, Channel no-id entry, Watchlist Public Readiness ownership, Production Smoke route ownership, and mobile target-size measurement.

## Exact sequence

```text
U10A work-quality-u10a-baseline          active
U10B work-quality-u10b-shell             exact next after U10A merge and explicit continuation
U10C work-quality-u10c-visualization     queued
U10D work-quality-u10d-analysis-coherence queued
U10E work-quality-u10e-responsive        queued
U10F work-quality-u10f-readiness         queued
U10G work-quality-u10g-architecture      queued
U10H work-quality-u10h-acceptance        queued
```

## Retained History acceptance

```text
Implementation PR: #451
Closeout PR: #453
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge production workflow: 28325492470
Pre-merge artifact: 7935573120
Post-merge production workflow: 28325951638
Post-merge artifact: 7935706617
1440 / 820 / 390 / 360
Forced colors: pass
Provider separation: pass
Real Viewer-minutes and Peak viewers: pass
```

After every merge, update canonical documents, issue the full merge report, name the next branch, and stop until explicit continuation.
