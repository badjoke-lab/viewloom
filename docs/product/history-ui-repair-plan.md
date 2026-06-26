# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.5
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed window: P9H0 through PR #430
Completed closeout: PR #432
Current implementation branch: none
Exact next branch: `work-history-ui-h1-metric`
Permanent specification: `history-and-trends-spec.md`
Active repair specification: `history-ui-repair-spec.md`
Program authority: `post-watchlist-program-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`
P9H0 evidence: `../audits/history-ui-h0-findings.md`

## 1. Objective

Repair the public Twitch and Kick History experience so existing retained-data capabilities are understandable, visibly responsive to controls, coherent on desktop/tablet/mobile, and owned by a maintainable controller structure.

This is defect, information-architecture, accessibility, and architecture repair. It is not feature expansion or localization implementation.

## 2. Approved P1 defects

- Viewer-minutes and Peak viewers do not update every metric-dependent surface.
- production and deterministic keyboard-entry evidence do not agree.
- desktop and mobile do not present one coherent task-first analysis flow.

Related requirements include readable chart scale/units/date context, useful selected-day analysis, compact degraded states, and safe retirement of redundant compatibility layers.

## 3. Preserved boundaries

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- 7-day, 30-day, and supported custom periods;
- primary metrics `viewer_minutes` and `peak_viewers` only;
- selected day, comparison, calendar, ranking, Archives, Report, Share, PNG, CSV, and JSON contracts;
- honest loading, real, partial, stale, empty, missing, demo, error, and in-progress states;
- bounded coverage language;
- loaded-payload reuse for task switching and outputs.

Not authorized: another metric/archive, new API/D1/collector/cron/retention/binding, exact sessions, cross-provider totals, login, alerts, AI summaries, localization runtime, or silent output-schema change.

## 4. Phase sequence

```text
P7A  complete PR #426
P8A  complete PR #427
P8B  complete PR #428
P9H0 complete PR #430
C9H0 work-p9h0-closeout                  complete PR #432
P9H1 work-history-ui-h1-metric           exact next; not created
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 5. P9H0 completed baseline

PR #430 verified:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

Metric URL, request, control, chart caption, and chart accessible name change, while Summary, Selected day, and Ranking context remain stale. The 390px Kick fixture measured 15,058px, about 17.84 viewport heights, with seven major Overview sections.

Local first-Tab moved to the ViewLoom home link. The P8B production body-focus observation remains a discrepancy for P9H5/final acceptance.

Primary owners are recorded in `history-ui-h0-owner-map.json` and `history-ui-h0-source-map.md`.

## 6. P9H1 — metric execution

Changing Viewer-minutes or Peak viewers must update:

- URL and request/payload state;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- Summary labels and values;
- Selected day primary fact;
- comparison and Ranking context;
- supported archive values;
- Report, Share, and Export context.

P9H1 must replace metric-related P9H0 expected failures with passing assertions. Checking only styling or `aria-pressed` is insufficient.

P9H1 must preserve one request per uncached provider/period/metric state, task/archive no-refetch, Back/Forward, provider separation, degraded states, and output schemas. It must not add another global fetch wrapper or document-wide observer.

## 7. P9H2 — chart and day interaction

Require readable UTC date ticks, numeric scale, visible metric/unit, exact detail, pointer/keyboard/touch inspection, selected-day synchronization, honest state distinctions, non-color-only legend, and accessible chart description.

## 8. P9H3 — Overview hierarchy

Require metric-aware high-value Summary, useful Selected day, coherent comparison/calendar/ranking/coverage order, and removal of duplicate or placeholder facts.

## 9. P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing hierarchy while preserving direct links, Back/Forward, no-refetch switching, provider/period/metric/scope/source/state/limitation context, and output schemas.

## 10. P9H5 — responsive and accessibility

At 1440, 820, 390, and 360px, repair mobile density, production/local keyboard discrepancy, focus order/visibility, touch/keyboard inspection, targets, wrapping, reduced motion, contrast, forced colors, and overflow.

## 11. P9H6–P9H7

Run all History/shared-web gates on the final local candidate. Then create one deliberate `preview-*` candidate, verify Functions/bindings/real retained data, merge only the accepted candidate, verify exact production identity, publish acceptance, and delete the working note.

## 12. Architecture acceptance

By P9H6:

- one explicit authoritative History controller/state owner is documented;
- no new global fetch replacement or document-wide observer coordinates state;
- redundant layers are removed where equivalence is proven;
- retained compatibility layers have owner, purpose, and removal condition;
- URL, Back/Forward, provider, request-count, output, and degraded-state contracts remain protected.

## 13. Stop rule

There is no active implementation branch. Do not create `work-history-ui-h1-metric` until explicit continuation. Apply the same merge-report-and-stop rule after every later branch.