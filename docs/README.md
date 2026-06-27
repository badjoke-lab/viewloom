# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-27

Chat memory, screenshots, old PRs, and completed milestone notes do not override this index.

## Required reading order

1. `operations/development-and-deployment-policy.md`
2. `operations/development-policy-addendum.md`
3. `operations/documentation-governance.md`
4. this index
5. `product/current-roadmap.md`
6. `product/current-schedule.md`
7. `product/post-watchlist-program-plan.md`
8. affected specification and implementation plan
9. active note under `work-in-progress/`
10. relevant audit and acceptance records

## Canonical program documents

- `product/current-roadmap.md`
- `product/current-schedule.md`
- `product/post-watchlist-program-plan.md`
- `product/history-ui-repair-spec.md`
- `product/history-ui-repair-plan.md`
- `work-in-progress/history-ui-repair-working-note.md`

## Current execution state

```text
Phase 6  Local Watchlist v1                              complete PR #425
P9H0     deterministic History baseline                  complete PR #430
P9H1     metric execution repair                         complete PR #434
P9H2     chart interpretation repair                     complete PR #436
P9H2     canonical closeout                              complete PR #437
P9H3     work-history-ui-h3-overview                       active
Active implementation branch                              work-history-ui-h3-overview
P9H4     work-history-ui-h4-tasks                          exact next; not created
```

Historical gate strings, not current state:

```text
Active implementation branch                              none
P9H3     work-history-ui-h3-overview                       exact next; not created
P9H2 active on work-history-ui-h2-chart
P9H2     work-history-ui-h2-chart                          exact next; not created
```

## Local Watchlist permanent evidence

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
- `../apps/web/docs/watchlist-latest-w2a-contract.md`
- `../apps/web/docs/watchlist-history-w2b-contract.md`

## History permanent evidence

P9H0 completed through PR #430. Documentation closeout completed through PR #432 and final-state correction through PR #433.

P9H1 completed through PR #434.

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

P9H2 completed through PR #436 and was canonically closed through PR #437.

```text
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Workflow run: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

P9H2 files:

- `../apps/web/src/live/history-chart-p9h2.ts`
- `../apps/web/src/live/history-chart-p9h2-compat.ts`
- `../apps/web/src/history-chart-p9h2.css`
- `../apps/web/scripts/history-ui-h2-chart-browser.mjs`
- `../scripts/verify-history-ui-h2-chart.mjs`
- `../.github/workflows/history-ui-h2-chart.yml`

## Active P9H3 implementation

P9H3 keeps the full desktop analysis while shortening the mobile default flow to Summary, coverage status, chart, and Selected day. Comparison, calendar, rankings/changes, and detailed coverage remain available through explicit secondary controls. It adds no History request and changes no provider or output contract.

- `../apps/web/src/live/history-overview-p9h3.ts`
- `../apps/web/src/history-overview-p9h3.css`
- `../apps/web/scripts/history-ui-h3-overview-browser.mjs`
- `../scripts/verify-history-ui-h3-overview.mjs`
- `../.github/workflows/history-ui-h3-overview.yml`

## Approved future authorities

- Phase 10–11: `product/cross-site-quality-remediation-spec.md`, `product/cross-site-quality-remediation-plan.md`
- Phase 13–14: `product/localization-spec.md`, `product/localization-implementation-plan.md`

## Completed audit records

- `audits/public-surface-inventory.json`
- `audits/public-browser-defects.json`
- `audits/public-browser-audit.md`
- `audits/history-ui-h0-baseline.md`
- `audits/history-ui-h0-owner-map.json`
- `audits/history-ui-h0-findings.md`

P9H3 is active on `work-history-ui-h3-overview`. `work-history-ui-h4-tasks` must not be created before P9H3 merges and explicit continuation is received.