# ViewLoom P9H0 History ownership and known-failure baseline

Status: active P9H0 audit record
Created: 2026-06-26
Branch: `work-history-ui-h0-baseline`
Source baseline: PR #428 / `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`
Verifier: `scripts/verify-history-p9h0-baseline.mjs`

## 1. Purpose

This record freezes the current History runtime composition and the three verified P1 failures before product repair. It distinguishes the primary live renderer from later compatibility, archive, report, responsive, and DOM-rehoming layers.

This is a baseline and ownership trace, not a claim that the current architecture is accepted.

## 2. Route entry order

Both provider History pages load the same History modules in this order:

```text
/src/mock-site.ts
/src/live/history-usability-pass.ts
/src/live/history-current-shell-entry.ts
/src/navigation/history-day-link-bridge.ts
/src/analytics.ts
```

`history-usability-pass.ts` executes its import graph before `history-current-shell-entry.ts` starts the first History request. This means every fetch wrapper installed by the usability/import graph can observe or transform the payload before the primary renderer receives it.

Provider endpoints remain separate:

```text
Twitch  /api/history
Kick    /api/kick-history
```

## 3. Primary state and render owner

`apps/web/src/live/history-current-shell-entry.ts` currently owns:

- provider and endpoint selection;
- period, metric, custom range, selected day, ranking sort, and ranking limit state;
- URL replacement for those fields;
- AbortController request lifecycle;
- the primary History request;
- summary, chart, selected day, primary ranking, daily archive, and coverage rendering.

Current defect boundary:

- metric state and request query change correctly;
- chart metric values/caption/accessibility name change;
- `renderSummary()` does not receive the selected metric and emits Viewer-minutes labels/values;
- `renderSelectedDay()` does not receive the selected metric and presents both metrics without a selected-metric primary interpretation;
- later enhancement layers also write Viewer-minutes-specific summary text.

Therefore `history-current-shell-entry.ts` is the primary repair owner for P9H1, but it is not the only runtime writer.

## 4. Import graph and secondary owners

`apps/web/src/live/history-usability-pass.ts` imports, in order:

```text
history-clarity-hotfix
history-clarity-compat
history-usability
history-number-format
history-view-shell
history-overview
history-default-day
history-archives
history-visual-responsive
```

`history-default-day.ts` additionally imports:

```text
history-additional-rankings
history-peak-archive
history-battle-archive
history-calendar-heat
history-report-text
```

### Current responsibilities

| Module | Current responsibility | Architecture concern |
|---|---|---|
| `history-clarity-hotfix.ts` | payload normalization, summary/archive/coverage post-processing | replaces `window.fetch`; document-wide MutationObserver |
| `history-clarity-compat.ts` | archive filter/toggle compatibility | second archive controller; document-wide MutationObserver |
| `history-usability.ts` | default day, summary formatting, coverage scope, selected-day/ranking/archive post-processing | replaces `window.fetch`; overlaps default-day/archive/summary owners; document-wide MutationObserver |
| `history-number-format.ts` | post-render compact number rewriting | document-wide MutationObserver; locale-hardcoded `en-US` |
| `history-view-shell.ts` | Overview/Archives/Report tabs, URL view/archive state, DOM rehoming | patches `history.replaceState`; subtree MutationObserver moves sections after render |
| `history-overview.ts` | Overview insights and hierarchy markers | replaces `window.fetch`; document-wide MutationObserver |
| `history-default-day.ts` | latest completed-day auto-selection | overlaps `history-usability.ts`; document-wide MutationObserver |
| `history-archives.ts` | archive hierarchy/featured-card post-processing | document-wide MutationObserver |
| `history-visual-responsive.ts` | viewport data attributes and focus paint | body/state MutationObservers; focus fallback only targets later task tabs |
| additional ranking state | ranking payload/cache/sort | replaces `window.fetch`; independent URL writes |
| peak archive state | peak payload/cache | replaces `window.fetch` |
| battle archive state | battle payload/cache | replaces `window.fetch` |
| calendar state | calendar payload/cache/metric | replaces `window.fetch` |
| report state | report/share/export payload/cache and prose | replaces `window.fetch`; metric label changes but several report facts remain Viewer-minutes-specific |

## 5. Fetch wrapper chain

The current accepted import graph installs at least these History fetch wrappers before the primary renderer request:

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

Each wrapper binds the previous `window.fetch` and replaces `window.fetch` again. P9H1–P9H5 must not add another wrapper. P9H6 must document the final retained chain or replace it with one explicit payload/controller boundary while preserving request counts and output behavior.

## 6. Mutation and rehome chain

The current route uses multiple MutationObservers for:

- payload-driven DOM enhancement;
- number formatting;
- archive compatibility and hierarchy;
- Overview readiness and insights;
- selected-day defaulting;
- shell DOM rehoming;
- responsive/focus fallback.

Several observe `document.documentElement` with `subtree: true`. P9H0 records this as architecture debt, not as a P0/P1 by itself. Removal order must be gated because these layers currently supply accepted archive, report, comparison, calendar, and responsive behavior.

## 7. Verified P1 baselines

### Metric synchronization

```text
Expected:
metric change updates chart, summary, selected day, comparison, ranking meaning, archives, report/share/export context.

Current:
URL/control/request/chart change; summary and selected-day primary meaning remain Viewer-minutes-oriented or metric-neutral.
```

### Keyboard entry

```text
Expected:
first Tab from document entry reaches a visible actionable control.

Current:
P8B production evidence records body retaining focus on first Tab at 1440, 820, 390, and 360 for both providers.
```

`history-visual-responsive.ts` binds custom focus paint only to task/archive/report tabs that are created later; it does not establish reliable first-page keyboard entry.

### Task hierarchy

```text
Expected:
one coherent task-first desktop/tablet/mobile sequence.

Current:
primary renderer creates the long original document; history-view-shell later creates panels and moves many already-rendered sections with a MutationObserver. Mobile receives a long reordered stack with competing analysis regions.
```

## 8. Authoritative direction

P9H1–P9H5 must move toward:

- one explicit History controller/state owner;
- one payload distribution boundary;
- direct render ownership rather than repeated post-render DOM correction;
- task/view structure created before feature content is rendered rather than rehomed afterward;
- selected metric passed explicitly to every metric-dependent renderer/output;
- explicit first keyboard-entry and focus order;
- no new global fetch replacement or document-wide observer coordination.

This is a bounded repair. It may not weaken provider separation, URL/Back/Forward, one-request-per-uncached-state, task no-refetch, degraded-state, report/share/export, or schema contracts.

## 9. P9H0 known-failure gates

The baseline verifier intentionally requires the following defects/debt to remain visible until their scheduled repair branch:

```text
P9H1: summary and selected-day metric synchronization missing
P9H5: first keyboard-entry defect remains recorded
P9H3/P9H5: task hierarchy defect remains recorded
P9H1–P9H5: multi-wrapper/multi-observer ownership remains inventoried
```

When a scheduled repair removes one of these conditions, the same verifier and this record must be updated in that repair PR. A defect must not disappear accidentally without a replacement permanent assertion.

## 10. P9H0 exit handoff

P9H0 is complete only when:

- this ownership trace and the executable baseline verifier agree;
- both provider routes have identical governed entry composition;
- the three P1 defects are represented by exact machine-checkable known-failure assertions or preserved P8B evidence;
- the current fetch/observer/rehome ownership chain is explicit;
- all existing non-baseline regressions pass;
- P9H1 is named as the exact next branch.