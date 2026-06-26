# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed predecessor: P8B through PR #428
Current window: P9H0 — exact baseline, ownership trace, and failing permanent gates
Current branch: `work-history-ui-h0-baseline`
Exact next branch after P9H0: `work-history-ui-h1-metric`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation subplan: `../product/history-ui-repair-plan.md`
Audit baseline: `../audits/public-browser-defects.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved P1 defects

```text
Metric switching changes only part of the page-wide meaning.
The first keyboard Tab does not reliably enter a visible control.
Desktop/tablet/mobile do not present one coherent task-first analysis flow.
```

Related repair requirements include chart interpretation, selected-day usefulness, compact degraded states, and explicit controller/module ownership.

## 2. Completed predecessors

### P7A — PR #426

- corrected stale source-of-truth documents;
- approved History repair as P1 work;
- added repair specification, plan, and this note.

### P8A — PR #427

- inventoried 21 repository-owned public surfaces;
- recorded route owners, controls, states, gates, provider bindings, and missing release routes.

### P8B — PR #428

- executed 84 production route scenarios and 10 deterministic History scenarios;
- recorded P0 0 / P1 3 / P2 5 / P3 0;
- found no outage, provider crossing, materially wrong provider path, or horizontal overflow;
- committed exact reproduction, owner, current-gate, missing-assertion, and evidence records;
- named P9H0 as the next branch.

Merge commit:

```text
b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8
```

## 3. P9H0 documentation-first batch

Explicit continuation was received on 2026-06-26. The branch was created from current `main`.

Required document changes:

```text
[x] current-roadmap.md moved to Phase 9 P9H0
[x] current-schedule.md moved to Phase 9 P9H0
[x] post-watchlist-program-plan.md expanded to Phase 7–16
[x] cross-site-quality-remediation-spec.md added
[x] cross-site-quality-remediation-plan.md added
[x] localization-spec.md added
[x] localization-implementation-plan.md added
[x] history-ui-repair-spec.md strengthened
[x] history-ui-repair-plan.md advanced to P9H0
[x] this working note advanced to P9H0
[ ] docs/README.md and root README.md aligned
[ ] AGENTS.md and CONTRIBUTING.md aligned
[ ] pull request template aligned
[ ] P8B audit status records marked complete
[ ] development-policy verifier aligned and executed
```

No runtime or public UI change is allowed before this batch is internally consistent.

## 4. Exact P8B History findings

### Metric synchronization

Switching Viewer-minutes to Peak viewers changes URL, selected control, chart caption, and chart accessible name. It does not change the period summary or selected-day facts.

Known source evidence:

- `history-current-shell-entry.ts` reads and requests the selected metric;
- `renderSummary()` currently emits Viewer-minutes labels/values regardless of the selected primary metric;
- selected-day rendering shows both metrics instead of a selected-metric primary interpretation;
- ranking sorting can follow metric but surrounding meaning remains inconsistent.

### Keyboard entry

At 1440, 820, 390, and 360 on both provider History routes, the first Tab did not move focus from `body` into a visible actionable control. Existing accessibility workflows did not reject it.

### Task hierarchy

Desktop separates many analytical blocks without one sufficiently strong primary sequence. Mobile stacks the desktop information architecture into a very long page where selected-day inspection, ranking, comparison, calendar, changes, and coverage compete.

## 5. Current ownership candidates

```text
apps/web/src/live/history-current-shell-entry.ts
apps/web/src/live/history-view-shell.ts
apps/web/src/live/history-overview.ts
apps/web/src/live/history-usability-pass.ts
History comparison, archive, report, share, export, responsive, focus, compatibility, and hotfix modules
```

P9H0 must not assume the first entry file is the sole owner. It must trace runtime script order and all later DOM/state mutation.

## 6. Architecture questions P9H0 must answer

- Which module owns provider, period, metric, selected day, task, archive, sort, and limit after all scripts load?
- Which module owns the final request and cache lifecycle?
- Which metric-dependent values remain stale or mislabeled?
- Which modules own chart, summary, selected day, comparison, ranking, archives, report, share, and exports?
- Which layers patch `window.fetch` or observe/move document-wide DOM?
- Which layers are authoritative, compatibility-only, redundant, or obsolete?
- Which layers can be retired in P9H1–P9H5 without changing accepted URL/request/output behavior?
- Which retained layers need a named removal condition?

## 7. Required failing-gate baseline

P9H0 must add or extend gates for:

```text
metric changes summary label/value
metric changes selected-day primary fact/unit
metric changes report context where supported
first Tab reaches visible actionable control
mobile task order remains compact and intentional
one authoritative state owner is recorded
no new global fetch/MutationObserver coordination layer
```

The baseline may use an expected-failure mode or machine-readable defect fixture. Required CI must not remain permanently red.

## 8. Required viewports and states

```text
1440
820
390
360

real
partial
stale
empty
missing
demo
in progress
error
loading
```

Baseline artifacts must make provider, metric, period, state, and viewport identifiable.

## 9. Fixed boundaries

```text
Providers remain separate.
Primary metrics remain Viewer-minutes and Peak viewers.
No new D1 schema, API, collector, cron, retention, or binding.
No exact sessions or provider totals.
No login, cloud preference, alerts, or AI summary.
No output-schema change.
No localization runtime in Phase 9.
No Cloudflare Preview in P9H0–P9H6.
```

## 10. P9H0 repository checklist

```text
[ ] revised governing documents pass policy verification
[ ] P8B permanent audit records remain intact and marked historical/complete
[ ] all three P1 defects have exact deterministic baseline evidence
[ ] Twitch and Kick owner traces are complete
[ ] final runtime script/module ownership is documented
[ ] compatibility/hotfix/observer/fetch layers are inventoried
[ ] missing permanent assertions are implemented or recorded in approved expected-failure form
[ ] targeted typecheck/build/History checks pass
[ ] final latest-head candidate gates pass
[ ] no product repair or forbidden scope is mixed in
[ ] P9H1 is named as exact next branch
```

## 11. Working-note rule

Update this note when a source hypothesis is confirmed/rejected, ownership changes, a layer is retired/retained, a gate is added, defect behavior changes, or the ordered repair sequence changes.

Transfer stable decisions to permanent documentation and delete this note in P9H7.