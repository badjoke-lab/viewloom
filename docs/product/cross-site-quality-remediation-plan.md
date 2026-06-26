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
- Existing feature/output/request-count contracts remain unless a separately approved specification changes them.
- Reproduction and failing assertions precede repair.
- Phase 10 begins only after History Phase 9 production acceptance.

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

Exact branch names may be changed only by the current schedule before creation.

## 4. U10A — defect ledger and ownership baseline

Deliverables:

- reread P8B machine/human records and latest production evidence;
- reproduce Day Flow date naming, mobile target sizes, Watchlist readiness, general smoke omissions, Channel no-id entry, Battle Lines selected-time/default-pair behavior, and first-render/loading concerns;
- classify each as P0/P1/P2/P3;
- record route, provider, viewport, state, owner file, current gate, and missing assertion;
- identify current and legacy entry modules for every affected feature;
- add failing gates or explicit baseline fixtures before repair;
- create a temporary Phase 10 working note.

No product repair in U10A except a proven P0 isolation.

## 5. U10B — shared shell and components

- consolidate design tokens, spacing, typography, surfaces, controls, provider identity, navigation, footer, and state panels;
- keep primary feature tabs and provider separation unchanged;
- preserve page-specific hierarchy;
- add shared component/source contracts and responsive snapshots;
- avoid premature localization catalogs.

## 6. U10C — data-visualization grammar

- define shared axes, units, legends, tooltips, selected-state, loading, empty, partial, stale, missing, demo, in-progress, and error presentation;
- adopt only where feature semantics remain exact;
- preserve Heatmap, Day Flow, Battle Lines, and History feature-specific behavior;
- add accessibility descriptions and non-color-only state distinctions.

## 7. U10D — analysis-page coherence

- repair reproduced Day Flow initial-render/date-control issues;
- repair reproduced Battle Lines recommended-pair/selected-time coherence;
- preserve provider-specific requests and existing date/bucket contracts;
- prove selected time, summary, inspector, and chart agree;
- prevent loading placeholders from being mistaken for accepted final content.

## 8. U10E — responsive and accessibility

Required widths:

```text
1440
820
390
360
```

- normalize applicable controls to at least 44px;
- keep important management/publishing actions at least 48px;
- repair accessible names, first keyboard entry, focus order, visible focus, wrapping, contrast, forced colors, reduced motion, and touch behavior;
- ensure mobile task hierarchy is compact and no page-level overflow exists;
- review long English and pseudo-long strings as a localization prerequisite.

## 9. U10F — readiness and route coverage

- include both Watchlist routes in general Public Readiness;
- include all appropriate owned routes in unified Production Smoke ownership;
- repair Channel no-id entry with provider-safe useful navigation without adding search/API behavior unless separately approved;
- prepare route manifest ownership for later legal and localized routes;
- preserve existing dedicated feature acceptance workflows.

## 10. U10G — architecture cleanup

- identify one authoritative controller/state owner per feature;
- remove duplicate/obsolete entry modules only after equivalence gates pass;
- retire safe compatibility/hotfix layers;
- forbid new feature coordination through global `window.fetch` replacement or document-wide MutationObserver state management;
- preserve URL, Back/Forward, request-count, provider, output, and degraded-state behavior;
- record any retained legacy layer with owner and removal condition.

## 11. U10H — Phase 10 candidate and acceptance

- run full web typecheck/build and all affected feature/shared gates;
- run the complete all-public local browser matrix and review screenshots;
- create one deliberate Preview candidate only if Cloudflare runtime validation is needed;
- verify exact production deployment and smoke after merge;
- transfer stable decisions to permanent specification and acceptance record;
- delete the Phase 10 working note.

## 12. O11A — permanent acceptance inventory

- enumerate every repository-owned public route, utility route, release route, owner, provider binding, width, state, and gate;
- reconcile P8A/P8B history with the current route set;
- define one versioned all-public acceptance schema;
- keep feature-specific gates linked rather than duplicated blindly.

## 13. O11B — unified browser matrix

- implement permanent route/width/state browser execution;
- cover identity, metadata, entry rendering, provider crossing, overflow, keyboard entry, accessible names, target sizes, and representative task flows;
- store machine-readable evidence and screenshot artifacts;
- ensure failure output names route, provider, viewport, state, and assertion.

## 14. O11C — workflow consolidation

- inventory all active workflows and assertions;
- consolidate duplicate setup/execution where it reduces cost without weakening protection;
- preserve unique feature contracts;
- retain same-PR concurrency cancellation;
- document every retired workflow and the replacement assertion;
- require page-wide task gates where isolated unit checks previously missed defects.

## 15. O11D — Web app type safety

- inventory `strictNullChecks` failures in the browser application;
- migrate by bounded module groups;
- add payload guards and explicit optional-state handling;
- forbid broad `any`, blanket assertions, or disabling strictness in new scopes;
- remove the app-side command-line override when clean;
- run behavior and browser regressions on each migration boundary.

## 16. O11E — server and worker type safety

- repeat the staged migration for Pages Functions and worker boundaries;
- keep provider bindings and response contracts explicit;
- preserve D1 and collector behavior;
- remove the remaining strict-null-check override only when the completed scopes pass.

## 17. O11F — monitoring and runbooks

- lock deployment identity, production smoke, provider Status, freshness, and capacity observation;
- document API/UI/collector/deployment failure diagnosis;
- define artifact retention and evidence ownership;
- prefer existing Status APIs and GitHub Actions over new cron work.

## 18. O11G — maintenance cadence and acceptance

- define weekly, monthly, and quarterly tasks;
- run the unified matrix and all permanent gates on the final candidate;
- verify Preview/production only where runtime behavior changed;
- publish a permanent Phase 10–11 acceptance record;
- update roadmap/schedule/program and remove the Phase 11 working note;
- name `R12A` as next and stop.

## 19. Verification expectations

Each branch runs targeted checks during iteration and complete latest-head checks at candidate completion. Layout/responsive branches require screenshot artifact review. Architecture/type changes require affected browser and output/request-count regressions.

## 20. Stop rule

After every merge, update roadmap, schedule, this plan, affected notes, and the exact next branch; issue the full merge report; stop until explicit continuation.