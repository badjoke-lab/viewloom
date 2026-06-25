# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## 1. Operating rules

- P0 production failures interrupt planned work immediately.
- P1 defects may reorder Phase 9 when they block acceptance.
- normal work uses `work-*`; deliberate Cloudflare validation alone uses `preview-*`.
- only the latest candidate head is authoritative.
- every branch reads roadmap, schedule, program plan, affected specifications/plans, active notes, and audit records before changing code.
- when repository state and documentation disagree, update documentation first.
- after every merge: issue the full merge report, update canonical state, name the exact next branch, stop, and wait for explicit continuation.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core; P8B audit active
Day Flow                                 production core; P8B audit active
Battle Lines                             production core; P8B audit active
History baseline H1-H7                   production accepted
History public-quality repair            approved P1 program
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 P8A inventory                    complete through PR #427
Phase 8 P8B browser audit                active
Phase 9 P0/P1 repair                     queued
Phase 10 shared UI consolidation         queued
Phase 11 operations lock                 queued
Phase 12 support/legal/release readiness queued
Phase 13 external launch                 queued
Phase 14 next-feature audit              queued
Phase 15 next major feature              not approved
```

## 3. Active completion window

```text
Current window: P8B — public browser defect audit
Current branch: work-public-browser-audit
Predecessor: PR #427 merged
Runtime product change: none allowed
Cloudflare Preview: not required and not allowed for this audit
Execution state: runtime matrix and final defect records produced; latest-head gates and merge remain
Exact next branch after completion: work-history-ui-h0-baseline
Exception: a newly proven P0 may interrupt
```

P8B is active.

Governing files:

```text
docs/README.md
docs/product/current-roadmap.md
docs/product/current-schedule.md
docs/product/post-watchlist-program-plan.md
docs/product/history-and-trends-spec.md
docs/product/history-ui-repair-spec.md
docs/product/history-ui-repair-plan.md
docs/work-in-progress/history-ui-repair-working-note.md
docs/audits/P8B_SCOPE.md
docs/audits/public-surface-inventory.json
docs/audits/public-surface-inventory.md
docs/audits/public-surface-gaps.json
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
```

## 4. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           active
P9H0 work-history-ui-h0-baseline         exact next after P8B unless P0 interrupts
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before the preceding merge report and explicit continuation.

## 5. P8A handoff record retained for completed Watchlist verification

The following exact block is a historical P8A handoff record, not the current schedule:

```text
Phase 8 P8B browser audit                exact next
Completed branch: work-public-surface-inventory
Exact next branch: work-public-browser-audit
```

The live completion branch is `work-public-browser-audit`; after its merge, the next branch is `work-history-ui-h0-baseline`.

## 6. P8A baseline retained by P8B

```text
20 Vite HTML inputs
1 explicit not-found page
21 owned inventory entries
16 indexable routes
4 noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

Stable P8A findings:

- all repository-owned HTML routes have owners, controls, states, gates, and provider bindings;
- Twitch uses `DB_TWITCH_HOT`; Kick uses `DB_KICK_HOT`;
- combined totals and rankings remain forbidden;
- both Watchlist routes are absent from Public Readiness configuration;
- About, Support, Changelog, Channel, and Watchlist are absent from the general Production Smoke route list;
- Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes are absent;
- History remains an approved P1 surface.

## 7. P8B executed matrix

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
```

Required checks include route identity, overflow, keyboard entry, accessible names, target sizes, provider separation, History metric execution, chart interpretation, selected-day synchronization, task/archive navigation, report/export, Back/Forward, request reuse, and honest degraded states.

## 8. P8B evidence package

```text
docs/audits/P8B_SCOPE.md
apps/web/scripts/public-browser-audit.mjs
.github/workflows/public-browser-audit.yml
scripts/verify-public-browser-audit.mjs
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

The runtime artifact contains:

```text
viewloom-public-browser-audit-v1 evidence
84 owned-route production screenshots
5 missing-surface probes
10 deterministic History scenarios
browser audit log
local preview log
```

## 9. Defect classification and result

```text
P0  0
P1  3
P2  5
P3  0
```

The ordered details and exact reproduction records are in `docs/audits/public-browser-defects.json` and `docs/audits/public-browser-audit.md`.

## 10. P8B completion criteria

- exact browser evidence exists for all 21 owned routes at all four widths;
- missing policy/disclosure routes are probed;
- History required states and interactions are captured;
- every P0/P1 records route, provider, viewport, state, reproduction, owner, file, current gate, and missing assertion;
- provider separation and bounded-coverage claims remain exact;
- machine-readable and human-readable defect records are committed;
- the ordered Phase 9 queue is explicit;
- latest-head policy, inventory, typecheck, build, P8B verifier, and browser workflow pass;
- no product repair, API, D1, binding, collector, cron, retention, output-schema, or Preview change is mixed into P8B;
- `work-history-ui-h0-baseline` is named as the exact next branch unless a P0 interrupts.

## 11. Phase 9 History repair sequence

```text
P9H0 exact baseline, ownership trace, and failing permanent gates
P9H1 metric execution synchronization
P9H2 chart interpretation and day interaction
P9H3 Overview summary and selected-day hierarchy
P9H4 Archives and Report & Export task repair
P9H5 responsive and accessibility repair
P9H6 complete local candidate and regression lock
P9H7 deliberate Preview and exact production acceptance
```

Non-History P0/P1 defects discovered by P8B receive narrow repair branches. P2 work waits for Phase 10 unless it blocks P1 acceptance.

## 12. Stop rule

P8B is active only as the completion branch until PR #428 merges. After the merge, issue the full merge report and stop. Do not create `work-history-ui-h0-baseline` until explicit continuation.
