# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-29

Read the development policy, documentation governance, roadmap, schedule, program plan, affected specifications, implementation plan, active working note, and permanent evidence before changing the repository.

## Current execution state

```text
Phase 6 Local Watchlist v1                        complete PR #425
Phase 8 inventory/browser audit                  complete PR #428
Phase 9 History P1 repair                        complete
P9H7 production acceptance                      complete PR #451
P9H7 canonical closeout                         complete PR #453
Phase 10 U10A quality baseline                   complete PR #454
U10A canonical closeout                          complete PR #455
Phase 10 U10B shared shell                       complete PR #456
U10B canonical closeout                          complete PR #457
Phase 10 U10C visualization                      active
Active implementation branch                    work-quality-u10c-visualization
Exact next implementation branch                work-quality-u10d-analysis-coherence
U10D branch created                             no
```

## Current authorities

- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- Active U10C note: `work-in-progress/u10c-visualization.md`
- U10A permanent defect ledger: `audits/cross-site-quality-u10a-baseline.json`
- U10A permanent owner map: `audits/cross-site-quality-u10a-owner-map.json`
- U10B permanent shared shell record: `audits/cross-site-quality-u10b-shared-shell.json`
- Permanent History acceptance: `operations/history-production-acceptance-2026-06-28.md`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## U10C implementation boundary

U10C owns the shared visualization reading guide, metric/unit synchronization, UTC context, selection/detail explanation, normalized visualization state, and the eight-route browser matrix. It does not change feature analysis meaning, APIs, storage, collection, retention, or provider separation.

Do not create U10D or start later phases before U10C merge, canonical closeout, reporting, and explicit continuation.
