# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-26

Chat memory, screenshots, old PRs, and completed milestone notes do not override this index.

## Required reading order

1. `operations/development-and-deployment-policy.md`
2. `operations/development-policy-addendum.md`
3. `operations/documentation-governance.md`
4. this index
5. `product/current-roadmap.md`
6. `product/current-schedule.md`
7. `product/post-watchlist-program-plan.md`
8. affected baseline specification
9. affected active/future specification
10. affected implementation plan
11. active working note
12. relevant audit and acceptance records

## Current state

```text
P9H0 baseline                 complete PR #430
P9H0 documentation closeout  complete PR #432
Active implementation branch none
Exact next branch             work-history-ui-h1-metric
P9H1 branch created           no
```

## Active History authorities

- `product/history-and-trends-spec.md`
- `product/history-ui-repair-spec.md`
- `product/history-ui-repair-plan.md`
- `work-in-progress/history-ui-repair-working-note.md`

## P9H0 evidence

- `audits/history-ui-h0-baseline.md`
- `audits/history-ui-h0-owner-map.json`
- `audits/history-ui-h0-source-map.md`
- `audits/history-ui-h0-findings.md`
- `../apps/web/scripts/history-ui-h0-browser.mjs`
- `../scripts/verify-history-ui-h0-baseline.mjs`
- `../.github/workflows/history-ui-h0-baseline.yml`

The local keyboard run did not reproduce the P8B production body-focus result. That discrepancy remains for P9H5 and final production acceptance.

## Future authorities

Phase 10–11:

- `product/cross-site-quality-remediation-spec.md`
- `product/cross-site-quality-remediation-plan.md`

Phase 13–14:

- `product/localization-spec.md`
- `product/localization-implementation-plan.md`

These documents do not authorize early implementation.

## Completed audit and acceptance records

- `audits/P8A_SCOPE.md`
- `audits/P8B_SCOPE.md`
- `audits/public-surface-inventory.json`
- `audits/public-browser-defects.json`
- `audits/public-browser-audit.md`
- `operations/history-production-acceptance-2026-06-23.md`
- `operations/channel-production-acceptance-2026-06-23.md`
- `operations/report-export-consolidation-acceptance-2026-06-24.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Repository comparison rule

Before changing code or public behavior, compare the schedule with actual branches and PRs, confirm the predecessor merge report and explicit continuation, compare planned deliverables with repository evidence, and update governing documents first when state or scope changed.

## Precedence

```text
development policy
this index and documentation governance
roadmap
schedule
program plan
active/future specification
baseline specification
implementation plan
working note
audit/acceptance evidence
completed records
```

There is no active implementation branch. P9H1 resumes only after explicit continuation.