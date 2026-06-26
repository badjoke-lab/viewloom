# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed predecessor: P8B through PR #428
Current window: P9H0 — exact baseline, ownership trace, and failing permanent gates
Current branch: `work-history-ui-h0-baseline`
Current draft PR: #431
Exact next branch after P9H0: `work-history-ui-h1-metric`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation subplan: `../product/history-ui-repair-plan.md`
P8B defect baseline: `../audits/public-browser-defects.json`
P9H0 ownership baseline: `../audits/history-p9h0-ownership.md`
Executable contract: `../../apps/web/docs/history-p9h0-baseline-contract.md`
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

Explicit continuation was received on 2026-06-26. The branch was created from current `main` and draft PR #431 was opened.

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
[x] docs/README.md and root README.md aligned
[x] AGENTS.md and CONTRIBUTING.md aligned
[x] pull request template aligned
[x] P8B audit status records marked complete
[x] development-policy verifier aligned
[x] completed Watchlist verifier decoupled from stale P8A/P8B current-state wording
[ ] latest-head documentation and completed-feature gates all pass
```

No runtime or public UI change was included in this documentation-first batch.

## 4. Exact P8B History findings

### Metric synchronization

Switching Viewer-minutes to Peak viewers changes URL, selected control, chart caption, and chart accessible name. It does not change the period summary or selected-day facts.

Confirmed source evidence:

- `history-current-shell-entry.ts` reads and requests the selected metric;
- `renderSummary()` receives no metric argument and emits Viewer-minutes labels/values;
- `renderSelectedDay()` receives no metric argument and shows both metrics without one selected-metric primary interpretation;
- ranking sorting can follow metric but surrounding meaning remains inconsistent;
- report state labels the selected metric, but several generated report facts remain Viewer-minutes-specific.

### Keyboard entry

At 1440, 820, 390, and 360 on both provider History routes, the first Tab did not move focus from `body` into a visible actionable control. Existing accessibility workflows did not reject it.

`history-visual-responsive.ts` binds focus paint to task/archive/report tabs but does not establish reliable first-page keyboard entry.

### Task hierarchy

Desktop separates many analytical blocks without one sufficiently strong primary sequence. Mobile stacks the desktop information architecture into a very long page where selected-day inspection, ranking, comparison, calendar, changes, and coverage compete.

The primary renderer creates the original long document. `history-view-shell.ts` later creates task panels and uses a MutationObserver to rehome already-rendered sections.

## 5. Confirmed runtime ownership

### Primary state/request/render owner

```text
apps/web/src/live/history-current-shell-entry.ts
```

It owns provider endpoint, period, metric, selected day, ranking sort/limit, primary URL replacement, AbortController request lifecycle, summary, chart, selected day, primary ranking, daily archive, and coverage rendering.

### Usability/import entry

```text
apps/web/src/live/history-usability-pass.ts
```

It executes before the primary renderer and imports the compatibility, usability, formatting, view-shell, Overview, default-day, archive, report, and responsive layers.

### Fetch-wrapper owners

```text
history-clarity-hotfix.ts
history-usability.ts
history-overview.ts
history-additional-rankings-state.ts
history-peak-archive-state.ts
history-battle-archive-state.ts
history-calendar-heat-state.ts
history-report-text-state.ts
```

Each binds the previous `window.fetch` and replaces it again. P9H1–P9H5 must not add another wrapper.

### Observer/rehome owners

```text
history-clarity-hotfix.ts
history-clarity-compat.ts
history-usability.ts
history-number-format.ts
history-view-shell.ts
history-overview.ts
history-default-day.ts
history-archives.ts
history-visual-responsive.ts
```

Several observers watch `document.documentElement` with `subtree: true`. `history-view-shell.ts` also patches `history.replaceState` and rehomes sections after render.

Permanent detail is in `docs/audits/history-p9h0-ownership.md`.

## 6. P9H0 executable baseline

Added:

```text
docs/audits/history-p9h0-ownership.md
apps/web/docs/history-p9h0-baseline-contract.md
scripts/verify-history-p9h0-baseline.mjs
.github/workflows/history-p9h0-baseline.yml
```

The verifier treats the three P1 defects as explicit scheduled known failures rather than passing behavior:

```text
P9H1: summary and selected-day metric synchronization
P9H3/P9H5: coherent task hierarchy
P9H5: reliable first keyboard entry
```

It also freezes the current fetch-wrapper, observer, replaceState, and DOM-rehome ownership. Each later repair PR must replace its expected-failure assertion with a passing permanent assertion.

## 7. Fixed boundaries

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

## 8. P9H0 repository checklist

```text
[x] revised governing documents pass development-policy verification on an earlier PR head
[x] P8B permanent audit records remain intact and marked historical/complete
[x] all three P1 defects have exact P8B evidence and executable known-failure assertions
[x] Twitch and Kick entry traces are complete
[x] primary and secondary runtime ownership is documented
[x] compatibility/hotfix/observer/fetch layers are inventoried
[x] missing permanent assertions are represented in approved expected-failure form
[ ] Watchlist completed-contract gates pass after stale-governance correction
[ ] P9H0 baseline workflow passes on latest head
[ ] targeted typecheck/build/History checks pass
[ ] final latest-head candidate gates pass
[x] no product repair or forbidden scope is mixed in
[x] P9H1 is named as exact next branch
```

## 9. P9H1 handoff target

P9H1 must repair metric execution end to end without broad task/layout work:

- pass selected metric explicitly to summary and selected-day renderers;
- synchronize summary labels/values, selected-day primary fact, comparison, ranking meaning, supported archives, report/share/export context;
- preserve one request per uncached provider/period/metric state and task no-refetch behavior;
- replace P9H0 metric expected-failure assertions with passing metric assertions;
- avoid adding another fetch wrapper or observer layer.

## 10. Working-note rule

Update this note when a source hypothesis is confirmed/rejected, ownership changes, a layer is retired/retained, a gate is added, defect behavior changes, or the ordered repair sequence changes.

Transfer stable decisions to permanent documentation and delete this note in P9H7.