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
History P9H0 deterministic baseline      complete PR #430
History metric repair                    exact next after closeout
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 P8A inventory                    complete through PR #427
Phase 8 P8B browser audit                complete through PR #428
Phase 9 P9H0                             complete through PR #430
Phase 10 cross-site quality              queued
Phase 11 engineering/operations lock     queued
Phase 12 English release readiness       queued
Phase 13 English/Japanese localization   queued
Phase 14 es/pt-BR localization + launch  queued
Phase 15 next-feature audit              queued
Phase 16 next major feature              not approved
```

## 3. Active closeout window

```text
Current window: P9H0 documentation closeout
Current branch: work-p9h0-closeout
Predecessor: PR #430 merged at 716b8e2fb59a6783a647cb62274c82a521c0e535
Runtime product change: not allowed
Cloudflare Preview: not required and not allowed
Execution state: canonical documents, plans, index, contributor rules, and verifiers are being aligned
Exact next branch after closeout merge report and explicit continuation: work-history-ui-h1-metric
Exception: a newly proven P0 may interrupt
```

P9H1 has not been created.

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

The local keyboard scenarios moved focus to the ViewLoom home link. The P8B production body-focus observation remains an explicit production/local discrepancy for P9H5 and final production acceptance.

## 5. Closeout required reading

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

Future Phase 10–14 branches also read their registered permanent specification and implementation plan.

## 6. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           complete PR #428
P9H0 work-history-ui-h0-baseline         complete PR #430
C9H0 work-p9h0-closeout                  active documentation closeout
P9H1 work-history-ui-h1-metric           exact next after closeout
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before the closeout merge report and explicit continuation.

## 7. Closeout completion criteria

- roadmap, schedule, program plan, History repair plan, working note, documentation index, README, agent/contributor rules, and PR template identify P9H0 as complete and P9H1 as next;
- PR #430 evidence and the production/local keyboard discrepancy remain exact;
- Phase 10–11 cross-site quality specifications/plans are registered;
- Phase 13–14 localization specification/plan are registered;
- stale P8B-active wording is rejected by policy verification except where explicitly retained as historical verifier text;
- completed Watchlist/P8B/P9H0 contracts remain valid without requiring stale current-state wording;
- no product UI, API, D1, binding, collector, cron, retention, output-schema, provider-combination, Preview, or localization-runtime change is included;
- latest-head documentation and existing product gates pass;
- the closeout PR is squash merged and fully reported.

## 8. P9H1 entry contract

P9H1 begins only after explicit continuation. It repairs Viewer-minutes and Peak viewers across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports.

P9H1 must replace the metric-related P9H0 expected failures with passing assertions. It must preserve provider separation, one request per uncached provider/period/metric state, task no-refetch, Back/Forward, degraded states, and output schemas. It must not add another global fetch wrapper or document-wide observer.

## 9. Later approved windows

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

## 10. Stop rule

After the closeout PR merges, issue the full merge report and stop. Do not create `work-history-ui-h1-metric` until explicit continuation.