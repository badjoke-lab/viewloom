# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## 1. Operating rules

- P0 production failures interrupt planned work immediately.
- P1 defects may reorder Phase 9 when they block acceptance.
- normal work uses `work-*`; deliberate Cloudflare validation alone uses `preview-*`.
- only the latest candidate head is authoritative.
- every branch reads the policy, documentation index, roadmap, this schedule, program plan, affected specifications/plans, active notes, and relevant audit records before changing code.
- when repository state and documentation disagree, update documentation first.
- after every merge: issue the full merge report, update canonical state, name the exact next branch, stop, and wait for explicit continuation.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core
Day Flow                                 production core; Phase 10 accessibility/clarity repair queued
Battle Lines                             production core; Phase 10 coherence reproduction queued
History baseline H1-H7                   production accepted
History public-quality repair            active P9H0
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 P8A inventory                    complete through PR #427
Phase 8 P8B browser audit                complete through PR #428
Phase 9 History P1 repair                active
Phase 10 cross-site quality remediation  queued
Phase 11 engineering/operations lock     queued
Phase 12 English release readiness       queued
Phase 13 English/Japanese localization   queued
Phase 14 es/pt-BR localization + launch  queued
Phase 15 next-feature audit              queued
Phase 16 next major feature              not approved
```

## 3. Active window

```text
Current window: P9H0 — exact History baseline, ownership trace, and failing permanent gates
Current branch: work-history-ui-h0-baseline
Predecessor: PR #428 merged at b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8
Explicit continuation: received 2026-06-26
Runtime product change: not allowed until governing-document alignment and failing-gate baseline are committed
Cloudflare Preview: not required and not allowed
Execution state: documentation-first alignment active
Exact next branch after P9H0 merge report and explicit continuation: work-history-ui-h1-metric
Exception: a newly proven P0 may interrupt
```

## 4. P9H0 required reading

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
docs/audits/P8B_SCOPE.md
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
```

Future Phase 10–14 branches also read their affected permanent specification and implementation plan registered in `docs/README.md`.

## 5. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           complete PR #428
P9H0 work-history-ui-h0-baseline         active
P9H1 work-history-ui-h1-metric           exact next after P9H0
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before the preceding merge report and explicit continuation.

## 6. P9H0 documentation-first batch

Before runtime or UI repair, P9H0 must:

- move all canonical current-state documents from P8B active to P9H0 active;
- register the revised Phase 7–16 program;
- register the cross-site quality remediation specification and plan;
- register the localization specification and implementation plan;
- update agent/contributor/PR-template reading requirements;
- update the development-policy verifier so stale P8B-active wording fails;
- preserve the completed P8A/P8B evidence as historical audit records.

This batch changes governance and planning only. It does not change public UI, APIs, D1, bindings, collectors, cron, retention, or output schemas.

## 7. P9H0 technical baseline

After the documentation-first batch, P9H0 must:

- reproduce all three P8B History P1 defects for Twitch and Kick with deterministic fixtures and real-data evidence where safe;
- trace metric state through URL, request/cache, chart, summary, selected day, comparison, ranking, archives, report, share, and exports;
- identify the authoritative controller and every compatibility/hotfix layer that mutates History state or DOM;
- add failing permanent assertions before product repair;
- freeze 1440, 820, 390, and 360px required artifacts and data states;
- record exact owner files and missing assertions in the working note;
- avoid broad styling or localization runtime changes.

## 8. P9H0 completion criteria

- canonical documents identify P9H0 as active and P9H1 as next;
- revised Phase 7–16 program and new Phase 10–14 specifications/plans are indexed;
- policy verification rejects stale P8B-active authorities;
- all three History P1 defects have deterministic failing gates or exact baseline evidence;
- authoritative owner modules and compatibility layers are recorded;
- provider separation and loaded-payload reuse remain intact;
- targeted typecheck/build/History checks pass where expected;
- intentionally failing baseline gates are represented in an approved test mode or recorded without making required CI permanently red;
- no product repair, Preview deployment, API, D1, binding, collector, cron, retention, or output-schema change is mixed into P9H0;
- the full latest-head candidate gate passes before merge.

## 9. Remaining Phase 9 sequence

```text
P9H1 metric execution synchronization
P9H2 chart interpretation and selected-day interaction
P9H3 Overview summary and hierarchy
P9H4 Archives and Report & Export task repair
P9H5 responsive, keyboard, touch, focus, and accessibility repair
P9H6 complete local candidate and regression lock
P9H7 deliberate Preview and exact production acceptance
```

## 10. Later approved windows

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

Detailed entry/exit criteria live in `post-watchlist-program-plan.md` and the affected permanent plans.

## 11. Stop rule

P9H0 may continue only on `work-history-ui-h0-baseline`. After its PR merges, issue the full merge report and stop. Do not create `work-history-ui-h1-metric` until explicit continuation.