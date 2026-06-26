# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## 1. Operating rules

- P0 production failures interrupt planned work immediately.
- P1 defects may reorder Phase 9 when they block acceptance.
- normal work uses `work-*`; deliberate Cloudflare validation alone uses `preview-*`.
- only the latest candidate head is authoritative.
- every branch rereads the current roadmap, schedule, program plan, affected specifications/plans, active notes, and audit records before changing code.
- when repository state and documentation disagree, update documentation first.
- after every merge: issue the full merge report, update canonical state, name the exact next branch, stop, and wait for explicit continuation.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core
Day Flow                                 production core; Phase 10 repair queued
Battle Lines                             production core; Phase 10 repair queued
History baseline H1-H7                   production accepted
P9H0 History baseline                   complete PR #430
History metric repair                   active on work-history-ui-h1-metric
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 P8A inventory                    complete through PR #427
Phase 8 public inventory/browser audit  complete PR #428
Phase 9 P9H0                             complete through PR #430
P9H0 documentation closeout             complete PR #432
Final-state correction                  complete PR #433
Active implementation branch            work-history-ui-h1-metric
Exact next branch                       work-history-ui-h2-chart
P9H2 branch created                     no
Phase 10 cross-site quality              queued
Phase 11 engineering/operations lock     queued
Phase 12 English release readiness       queued
Phase 13 English/Japanese localization   queued
Phase 14 Spanish/pt-BR localization and staged launch queued
Phase 15 next-feature audit              queued
Phase 16 next major feature              not approved
```

## 3. P9H1 handoff

```text
Current branch: work-history-ui-h1-metric
Entry predecessor: PR #433
P9H0 evidence source: PR #430
Exact next branch after merge and explicit continuation: work-history-ui-h2-chart
P9H2 branch created: no
Exception: a newly proven P0 may interrupt
```

## 4. P9H0 completion evidence

```text
PR: #430
Final head: e3a1f64e7225a652de95a37ea755b192565d7798
Merge commit: 716b8e2fb59a6783a647cb62274c82a521c0e535
Workflow run: 28217951126
Artifact: history-ui-h0-baseline
Artifact ID: 7897373665
Digest: sha256:366d5aeeb896b62201cc842f79ba9426807ae81e997a3cc5d53360cfa43b104a
```

Deterministic failure set:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

P9H1 owns the three metric-context failures. `history-mobile-task-flow-too-long` remains owned by P9H3/P9H5.

The local keyboard scenarios moved focus to the ViewLoom home link. The P8B production body-focus observation remains an explicit production/local discrepancy for P9H5 and final production acceptance.

## 5. P9H1 required reading

```text
docs/operations/development-and-deployment-policy.md
docs/operations/development-policy-addendum.md
docs/operations/documentation-governance.md
docs/README.md
docs/product/current-roadmap.md
docs/product/current-schedule.md
docs/product/post-watchlist-program-plan.md
docs/product/history-and-trends-spec.md
docs/product/history-ui-repair-spec.md
docs/product/history-ui-repair-plan.md
docs/work-in-progress/history-ui-repair-working-note.md
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
docs/audits/history-ui-h0-baseline.md
docs/audits/history-ui-h0-owner-map.json
docs/audits/history-ui-h0-source-map.md
docs/audits/history-ui-h0-findings.md
```

## 6. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           complete PR #428
P9H0 work-history-ui-h0-baseline         complete PR #430
C9H0 work-p9h0-closeout                  complete PR #432
C9H0F work-p9h0-final-state              complete PR #433
P9H1 work-history-ui-h1-metric           active
P9H2 work-history-ui-h2-chart            exact next after P9H1 merge and explicit continuation
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before P9H1 merges, is fully reported, and explicit continuation is received.

## 7. P9H1 implementation contract

Changing Viewer-minutes or Peak viewers must update:

- URL and provider request/payload state;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- Summary labels and values;
- Selected day primary fact;
- comparison and Ranking context;
- supported Archives;
- Report, Share, and Export context.

P9H1 must replace the three metric-context expected failures with passing assertions. It must preserve provider separation, one request per uncached provider/period/metric state, task no-refetch, Back/Forward, degraded states, and output schemas. It must not add another global fetch wrapper or document-wide observer.

## 8. Later approved windows

```text
Phase 10  U10A–U10H  cross-site defect/UI/architecture remediation
Phase 11  O11A–O11G  acceptance, CI, type safety, monitoring, maintenance
Phase 12  R12A–R12C  English legal, Support, Stripe, release readiness
Phase 13  I13A–I13K  localization foundation plus English/Japanese
Phase 14  I14A–I14C  Spanish/pt-BR acceptance
          L14A–L14C  staged external launch and feedback classification
Phase 15  N15A–N15B  next-feature data-capability audit
Phase 16  feature-specific; not approved
```

## 9. Stop rule

Complete P9H1 on `work-history-ui-h1-metric`, merge it, name `work-history-ui-h2-chart`, and stop until explicit continuation.