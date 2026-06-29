# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 3.5
Last updated: 2026-06-29
Current phase: Phase 10 — U10A defect and ownership baseline active
Current implementation branch: `work-quality-u10a-baseline`
Exact next implementation branch after U10A: `work-quality-u10b-shell`
U10B branch created: no
Completed History production acceptance: PR #451
Completed History canonical closeout: PR #453

## Current program state

```text
Local Watchlist v1 complete PR #425
Phase 8 inventory/browser audit complete PR #428
Phase 9 History P1 repair complete
Phase 10 U10A active
Phase 11–15 queued
Phase 16 not approved
```

U10A reproduces and classifies non-History defects, records route/provider/viewport/state/owner/gate gaps, identifies authoritative and compatibility owners, adds static and deterministic browser fixtures, and maintains the temporary Phase 10 working note. Product repair is prohibited except proven P0 isolation.

## Historical verifier index

These strings identify completed evidence only. They are not current execution state.

```text
Version: 3.4
Current phase: Phase 10 — U10A defect and ownership baseline next
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-quality-u10a-baseline`
Completed metric synchronization: PR #434
Completed chart interpretation: PR #436
Completed Overview hierarchy: PR #439
Completed Overview balance: PR #441
Completed P9H4A canonical closeout: PR #442
Completed Archives and publishing hierarchy: PR #443
Completed P9H4B canonical closeout: PR #444
Completed responsive and accessibility repair: PR #447
Completed P9H5 canonical closeout: PR #448
Completed local candidate: PR #449
Completed P9H6 canonical closeout: PR #450
```

## Approved sequence

```text
U10A work-quality-u10a-baseline
U10B work-quality-u10b-shell
U10C work-quality-u10c-visualization
U10D work-quality-u10d-analysis-coherence
U10E work-quality-u10e-responsive
U10F work-quality-u10f-readiness
U10G work-quality-u10g-architecture
U10H work-quality-u10h-acceptance
O11A work-operations-o11a-matrix
O11B work-operations-o11b-browser
O11C work-operations-o11c-workflows
O11D work-operations-o11d-app-types
O11E work-operations-o11e-server-types
O11F work-operations-o11f-runbooks
O11G work-operations-o11g-acceptance
```

## U10A evidence

```text
docs/work-in-progress/u10a-quality-baseline.md
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
apps/web/scripts/quality-u10a-baseline-browser.mjs
scripts/verify-quality-u10a-baseline.mjs
.github/workflows/quality-u10a-baseline.yml
```

History production evidence remains in `docs/operations/history-production-acceptance-2026-06-28.md`.

After each merge, update canonical state, issue the full report, name the next branch, and stop. Phase 16 requires a separate approved specification.
