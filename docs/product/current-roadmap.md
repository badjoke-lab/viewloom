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
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
```

## Historical gate snapshots

```text
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
- The source reset and public browser audit are complete through PR #428.
- History P9H0 and its closeout are complete through PR #433.
- History metric synchronization is complete through PR #434.
- History chart interpretation is complete through PR #436 and closed through PR #437.
- History Overview hierarchy is complete through PR #439 and closed through PR #440.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

Historical P9H1 evidence:

```text
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
```

P9H3 accepted evidence:

```text
Head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Workflow run: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
```

The mobile task-flow defect is resolved by P9H3. The earlier production/local keyboard discrepancy remains for P9H5 and final acceptance.

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
Phase 9   History P1 repair                                  P9H3 complete; P9H4 next
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
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      complete PR #436
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H3 keeps the complete desktop Overview and shortens the mobile default flow to Summary, coverage status, chart, and Selected day. Secondary analysis remains available through explicit controls without additional History requests.

## Stop rule

P9H3 is complete and canonically closed through PR #440. Do not create `work-history-ui-h4-tasks` before explicit continuation is received.
