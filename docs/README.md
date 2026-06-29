# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-29

Read the development policy, documentation governance, roadmap, schedule, program plan, affected specifications, implementation plan, active working note when one exists, and permanent evidence before changing the repository.

## Current execution state

```text
Phase 6 Local Watchlist v1                        complete PR #425
Phase 8 inventory/browser audit                  complete PR #428
Phase 9 History P1 repair                        complete
P9H7 production acceptance                      complete PR #451
P9H7 canonical closeout                         complete PR #453
Phase 10 U10A quality baseline                   complete PR #454
U10A canonical closeout                          complete PR #455
Active implementation branch                    none
Exact next implementation branch                work-quality-u10b-shell
U10B branch created                             no
```

## Current authorities

- Phase 10–11: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 implementation: `product/cross-site-quality-remediation-plan.md`
- U10A permanent defect ledger: `audits/cross-site-quality-u10a-baseline.json`
- U10A permanent owner map: `audits/cross-site-quality-u10a-owner-map.json`
- Phase 13–14 localization: `product/localization-spec.md`
- Phase 13–14 implementation: `product/localization-implementation-plan.md`

There is no active temporary working note. `work-quality-u10b-shell` may be created only after explicit continuation.

## Permanent evidence and records

- `audits/cross-site-quality-u10a-baseline.json`
- `audits/cross-site-quality-u10a-owner-map.json`
- `operations/history-production-acceptance-2026-06-28.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`

U10A latest-head workflow evidence is recorded inside the permanent baseline ledger:

```text
Quality U10A Baseline: 28356915812 / 7945707844
Public Browser Audit: 28356915810 / 7945757041
Implementation head: 51c8883ebdc31334828cc345f6a938f17c20a29b
Implementation merge: 7665c5244d2fa71539ce9d69b3f5b55c47463075
```

## Historical verifier index

The following entries are historical lookup keys for retained phase verifiers, not the current execution state.

```text
Phase 6  Local Watchlist v1
P9H1     metric execution repair
work-history-ui-h2-chart
P9H1 completed through PR #434
P9H6     work-history-ui-h6-candidate                    complete PR #449
P9H6 canonical closeout complete PR #450
P9H7     work-history-ui-h7-acceptance                   complete PR #451
U10A     work-quality-u10a-baseline                      complete PR #454
U10A canonical closeout                                 complete PR #455
```

Completed temporary History and U10A notes are absent by design. Do not start U10B or later phases without explicit continuation.
