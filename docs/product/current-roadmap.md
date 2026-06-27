# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-27

## Current position

```text
Phase 7 P7A   complete PR #426
Phase 8 P8A   complete PR #427
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
P9H0 closeout complete PR #432
Final-state correction complete PR #433
Phase 9 P9H1  complete PR #434
Phase 9 P9H2  complete PR #436
P9H2 canonical closeout complete PR #437
Phase 9 P9H3  complete PR #439
P9H3 canonical closeout complete PR #440
Phase 9 P9H4A complete PR #441
P9H4A canonical closeout complete PR #442
Phase 9 P9H4B complete PR #443
P9H4B canonical closeout complete PR #444
Active implementation branch: none
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
```

P9H4B repaired Archives and Report & Export hierarchy while preserving direct links, Back/Forward, one loaded provider response, and every output contract.

## Historical gate snapshots

```text
Phase 9 P9H4B active
Active implementation branch: work-history-ui-h4b-tasks
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
P9H4B canonical closeout active
Active implementation branch: work-history-ui-h4b-closeout
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4b-tasks
P9H4B branch created: no
Phase 9 P9H4A active
Active implementation branch: work-history-ui-h4a-overview-balance
Exact next implementation branch: work-history-ui-h4b-tasks
P9H4B branch created: no
P9H4A canonical closeout active
Active implementation branch: work-history-ui-h4a-closeout
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
Phase 9 P9H3  active
Active implementation branch: work-history-ui-h3-overview
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
Phase 9 P9H2  active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
P9H2 branch created: no
```

## Verified state

- Local Watchlist v1 is complete through PR #425.
- Source reset and public browser audit are complete through PR #428.
- History metric synchronization is complete through PR #434.
- History chart interpretation is complete through PR #436 and closed through PR #437.
- History Overview hierarchy is complete through PR #439 and closed through PR #440.
- History Overview balance is complete through PR #441 and closed through PR #442.
- History Archives and publishing hierarchy is complete through PR #443 and closed through PR #444.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

Historical P9H1 evidence:

```text
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

P9H4B accepted evidence:

```text
Head: 93195f3e79f1edf7c95cd1150c94b41582c50c29
Workflow run: 28289223184
Artifact: history-ui-h4b-tasks / 7924451682
Digest: sha256:f07200e1d5966dda3093788778d845fa2f8e2cc2ddf8fb4d939dba7c9992662f
Merge: e28a6db311129fafe8cd1069ffe4ab240ba2b8bf
```

The production/local keyboard discrepancy remains assigned to P9H5 and final acceptance.

## Authority map

```text
Product priority: docs/product/current-roadmap.md
Exact state: docs/product/current-schedule.md
Complete program: docs/product/post-watchlist-program-plan.md
History repair: docs/product/history-ui-repair-spec.md
                docs/product/history-ui-repair-plan.md
                docs/work-in-progress/history-ui-repair-working-note.md
```

## Ordered roadmap

```text
Phase 7   source-of-truth reset                              complete PR #426
Phase 8   inventory and browser defect audit                 complete PR #428
Phase 9   History P1 repair                                  P9H4B complete; P9H5 next
Phase 10  cross-site defect/UI/architecture repair           queued
Phase 11  acceptance, CI, type safety, monitoring            queued
Phase 12  English legal, Support, Stripe, release readiness  queued
Phase 13  localization foundation plus English/Japanese      approved and queued
Phase 14  Spanish/pt-BR localization and staged launch       approved and queued
Phase 15  next-feature data-capability audit                 queued
Phase 16  one separately approved major feature              not approved
```

No Phase 16 feature is approved.

## Phase 9 sequence

```text
P9H0  work-history-ui-h0-baseline          complete PR #430
P9H1  work-history-ui-h1-metric            complete PR #434
P9H2  work-history-ui-h2-chart             complete PR #436
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        exact next after explicit continuation; not created
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

P9H4B is complete and canonically closed through PR #444. Do not create `work-history-ui-h5-responsive` before explicit continuation is received.