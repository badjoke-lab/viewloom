# ViewLoom cross-site quality remediation implementation plan

Status: approved future implementation plan
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 10–11
Permanent specification: `cross-site-quality-remediation-spec.md`
Entry condition: P9H7 History production acceptance and merge report complete

## 1. Objective

Repair reproduced non-History cross-site defects, consolidate shared interaction/visual rules, safely retire obsolete UI layers, and lock one maintainable acceptance, type-safety, monitoring, and maintenance system before localization begins.

## 2. Fixed boundaries

- Twitch and Kick remain separate.
- No new API, D1 schema, binding, collector field, cron, or retention rule.
- No exact sessions, category/stream-language analytics, provider totals, login, alerts, AI interpretation, or localization runtime.
- Existing feature/output/request-count contracts remain unless separately approved.
- Reproduction and failing assertions precede repair.

## 3. Branch sequence

```text
U10A work-quality-u10a-baseline
U10B work-quality-u10b-shell
U10C work-quality-u10c-visualization
U10D work-quality-u10d-analysis-coherence
U10E work-quality-u10e-responsive
U10F work-quality-u10f-readiness
U10G work-quality-u10g-architecture
U10H work-quality-u10h-acceptance
O11A work-operations-o11a-matrix
O11B work-operations-o11b-browser
O11C work-operations-o11c-workflows
O11D work-operations-o11d-app-types
O11E work-operations-o11e-server-types
O11F work-operations-o11f-runbooks
O11G work-operations-o11g-acceptance
```

Exact names may change only through the current schedule before creation.

## 4. U10A — defect and ownership baseline

- reread P8B records and latest production evidence;
- reproduce Day Flow date naming, small targets, Watchlist readiness, general smoke omissions, Channel no-id entry, Battle Lines selected-time/default-pair behavior, and first-render concerns;
- classify each finding;
- record route, provider, viewport, state, owner file, current gate, and missing assertion;
- identify current and legacy entries;
- add failing gates or explicit baseline fixtures;
- create a temporary Phase 10 working note.

No product repair in U10A except proven P0 isolation.

## 5. U10B — shared shell and components

Consolidate design tokens, spacing, typography, surfaces, controls, provider identity, navigation, footer, and state panels. Preserve page-specific hierarchy and provider separation. Add shared source contracts and responsive snapshots. Do not introduce localization catalogs yet.

## 6. U10C — visualization grammar

Define shared axes, units, legends, tooltips, selected state, loading, empty, partial, stale, missing, demo, in-progress, and error presentation. Adopt only where feature semantics remain exact. Add accessible descriptions and non-color-only distinctions.

## 7. U10D — analysis coherence

Repair reproduced Day Flow first-render/date-control issues and Battle Lines recommended-pair/selected-time coherence. Prove chart, selected time, summary, and inspector agree. Preserve provider-specific requests and date/bucket contracts.

## 8. U10E — responsive and accessibility

At 1440, 820, 390, and 360px:

- normalize applicable controls to at least 44px;
- keep important management/publishing actions at least 48px;
- repair accessible names, keyboard entry, focus order/visibility, wrapping, contrast, forced colors, reduced motion, and touch behavior;
- keep mobile task flows compact;
- review pseudo-long strings as a localization prerequisite.

## 9. U10F — route readiness

- include both Watchlist routes in general Public Readiness;
- include all appropriate owned routes in unified Production Smoke ownership;
- repair Channel no-id entry with provider-safe navigation without adding unapproved search/API behavior;
- prepare route-manifest ownership for release and localized routes;
- preserve dedicated feature acceptance workflows.

## 10. U10G — architecture cleanup

- identify one authoritative state/controller owner per feature;
- remove duplicate or obsolete entries only after equivalence gates pass;
- retire safe compatibility/hotfix layers;
- forbid new global fetch replacement and document-wide observer coordination;
- preserve URL, Back/Forward, request counts, provider separation, outputs, and degraded states;
- record retained legacy layers with owner and removal condition.

## 11. U10H — Phase 10 acceptance

Run full typecheck/build, feature/shared gates, and all-public browser artifacts. Use one deliberate Preview candidate only where Cloudflare runtime validation is needed. Verify exact production deployment after merge. Publish permanent acceptance and delete the Phase 10 working note.

## 12. O11A–O11C — acceptance and workflow system

- enumerate every owned route, utility route, release route, owner, binding, width, state, and gate;
- implement one permanent route/width/state browser matrix;
- store machine-readable evidence and screenshots;
- consolidate duplicate workflows without weakening unique feature contracts;
- retain same-PR cancellation;
- document each retired workflow and its replacement assertion;
- require page-wide task gates where isolated checks missed defects.

## 13. O11D–O11E — strict-null migration

Migrate the browser application first, then Pages Functions and worker boundaries. Inventory failures, use bounded module groups, add explicit payload guards, avoid broad `any` and blanket assertions, keep behavior regressions passing, and remove command-line strict-null overrides only when each scope is clean.

## 14. O11F–O11G — operations lock

Lock deployment identity, production smoke, provider Status, freshness/capacity observation, failure diagnosis, artifact retention, and weekly/monthly/quarterly maintenance. Run the unified matrix on the final candidate, publish a permanent Phase 10–11 acceptance record, update canonical documents, remove temporary notes, name R12A as next, and stop.

## 15. Stop rule

After every merge, update roadmap, schedule, this plan, affected notes, and the exact next branch; issue the full merge report; stop until explicit continuation.