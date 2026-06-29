# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-29

Read the development policy, documentation governance, roadmap, schedule, program plan, affected specifications, implementation plan, and permanent evidence before changing the repository.

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
Active implementation branch                    none
Exact next implementation branch                work-quality-u10c-visualization
U10C branch created                             no
```

## Current authorities

- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- U10A permanent defect ledger: `audits/cross-site-quality-u10a-baseline.json`
- U10A permanent owner map: `audits/cross-site-quality-u10a-owner-map.json`
- U10B permanent shared shell record: `audits/cross-site-quality-u10b-shared-shell.json`
- Permanent History acceptance: `operations/history-production-acceptance-2026-06-28.md`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Completed U10B implementation files

```text
apps/web/src/shared-shell.ts
apps/web/src/shared-shell.css
apps/web/src/mock-site.ts
apps/web/src/provider-home.ts
apps/web/src/live/watchlist-move-focus.ts
apps/web/scripts/quality-u10b-shell-browser.mjs
scripts/verify-quality-u10b-shell.mjs
.github/workflows/quality-u10b-shell.yml
```

Do not create U10C or start later phases before explicit continuation.
