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
Phase 10 U10B shared shell                       active
Active implementation branch                    work-quality-u10b-shell
Exact next implementation branch                work-quality-u10c-visualization
U10C branch created                             no
```

## Current authorities

- Phase 10–11 specification: `product/cross-site-quality-remediation-spec.md`
- Phase 10–11 plan: `product/cross-site-quality-remediation-plan.md`
- Active U10B note: `work-in-progress/u10b-shared-shell.md`
- U10A permanent defect ledger: `audits/cross-site-quality-u10a-baseline.json`
- U10A permanent owner map: `audits/cross-site-quality-u10a-owner-map.json`
- Permanent History acceptance: `operations/history-production-acceptance-2026-06-28.md`

U10B may change only the shared public shell and its acceptance evidence. Feature logic, APIs, D1, bindings, collectors, cron, retention, output schemas, localization runtime, and provider combination remain outside scope.

## Active implementation files

```text
apps/web/src/shared-shell.ts
apps/web/src/shared-shell.css
apps/web/src/mock-site.ts
apps/web/src/provider-home.ts
apps/web/scripts/quality-u10b-shell-browser.mjs
scripts/verify-quality-u10b-shell.mjs
.github/workflows/quality-u10b-shell.yml
```

Do not create U10C or start later phases before U10B merge, canonical closeout, reporting, and explicit continuation.
