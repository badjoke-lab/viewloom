# ViewLoom cross-site quality remediation specification

Status: approved future permanent specification
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 10–11
Implementation plan: `cross-site-quality-remediation-plan.md`
Entry condition: Phase 9 History production acceptance complete

## 1. Purpose

This specification defines the accepted target for repairing reproduced cross-site defects, consolidating shared interaction and visual rules, retiring obsolete UI layers, and locking a maintainable acceptance/operations system.

It is a quality and architecture program, not a new product-feature program.

## 2. Evidence baseline

The initial baseline is the completed Phase 8 P8B audit:

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

Phase 10 may add newly reproduced defects from the accepted production state, but it must record exact routes, providers, states, owner files, reproduction steps, and missing assertions before repair.

## 3. Included repair areas

- common page shell, navigation, footer, provider identity, and status presentation;
- shared design tokens, spacing, typography, surfaces, buttons, forms, and state panels;
- chart axes, units, legend, tooltip, selection, loading, empty, partial, stale, missing, and error grammar;
- Day Flow first-render clarity, date-control accessibility, and interaction coherence;
- Battle Lines recommended-pair/selected-time coherence and initial-render clarity;
- responsive layout at 1440, 820, 390, and 360px;
- keyboard entry, visible focus, pointer/touch operation, accessible names, and target sizes;
- Channel no-id entry behavior and useful provider-safe navigation;
- Watchlist inclusion in general readiness coverage;
- general Production Smoke route coverage;
- duplicate entry points, obsolete implementations, and compatibility/hotfix layers where safe to retire;
- permanent all-public acceptance, CI, type-safety, monitoring, runbooks, and maintenance cadence.

## 4. Provider invariants

Every repair must preserve:

- separate Twitch and Kick routes, APIs, D1 bindings, collectors, rankings, exports, filenames, and coverage claims;
- no combined provider totals or rankings;
- no cross-provider request or storage access;
- provider-specific accents without provider-wide color flooding;
- bounded observation language rather than provider-wide claims;
- exact existing output schemas unless separately approved.

## 5. Reproduction-first rule

A suspected issue is not repaired merely because it appeared in a screenshot or prior conversation.

Before code change, the responsible branch must record:

- route and provider;
- viewport and state;
- exact reproduction;
- expected and actual behavior;
- authoritative owner module;
- current workflow coverage;
- missing assertion;
- classification and repair window.

A P0 may interrupt. P1 may reorder acceptance work. P2 follows the scheduled Phase 10 branch. P3 remains deferred.

## 6. Shared interaction contract

- one visible primary task per page region;
- controls have stable labels and accessible names;
- first keyboard entry reaches a visible actionable control;
- focus order follows reading and task order;
- focus is visible in default, increased-contrast, and forced-color modes;
- hover is never the only way to inspect required information;
- pointer, touch, and keyboard actions produce equivalent core outcomes;
- Back/Forward and direct links restore supported state;
- controls do not trigger unrelated provider requests;
- loading and unavailable states remain explicit rather than leaving large unexplained blanks.

## 7. Responsive contract

Required widths:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- desktop layouts are reorganized, not simply scaled down;
- controls wrap in semantic order;
- primary mobile controls are at least 44px high/wide where applicable;
- important management/publishing actions are at least 48px where applicable;
- long labels, URLs, legal text, and data-state explanations wrap safely;
- charts retain readable scale, units, selection, and state distinctions;
- mobile pages present a compact task flow instead of an unprioritized desktop stack.

## 8. Chart and data-state grammar

Shared visualization rules must define:

- metric and unit naming;
- numeric scale and date/time context;
- baseline and selected item/day/time;
- exact detail through visible text or tooltip;
- keyboard and touch inspection;
- complete, partial, stale, in-progress, missing, demo, empty, and error distinctions;
- non-color-only legend or labels;
- accessible chart name and description;
- compact explicit fallback panels when data is unavailable.

Feature-specific meaning remains in each feature specification. A shared component may not erase provider or feature semantics.

## 9. Architecture consolidation contract

Phase 10 must inventory active entry modules and compatibility layers before deletion.

Accepted direction:

- one authoritative controller/state owner per public feature route;
- explicit render/update boundaries;
- no new global `window.fetch` replacement for feature coordination;
- no new document-wide `MutationObserver` used as the primary state-management mechanism;
- no duplicate current/legacy entry module serving the same accepted route without a documented reason;
- retire obsolete layers only after contract and browser gates prove equivalent behavior;
- preserve output, URL, provider, request-count, and degraded-state contracts.

## 10. Readiness and smoke coverage

The permanent all-public matrix must enumerate every repository-owned public route, including utility/noindex routes where appropriate.

It must cover:

- route status and identity;
- title, canonical, robots, H1, entry rendering;
- provider binding/request separation;
- core controls and accessible names;
- required widths and overflow;
- representative real and degraded states;
- feature-specific interaction gates;
- readiness and production smoke ownership.

Watchlist, About, Support, Changelog, Channel, and other owned routes must not rely solely on unrelated feature workflows without being represented in the unified matrix.

## 11. Type-safety contract

The repository-level `strict: true` intent must not be silently weakened indefinitely by command-line overrides.

Phase 11 must:

- inventory current strict-null-check failures;
- migrate the Web application and server/Functions boundaries in staged branches;
- keep generated/provider payload validation explicit;
- avoid broad `any` or non-null assertions used only to silence migration failures;
- keep behavioral tests passing during the migration;
- remove temporary typecheck overrides only when the affected scope is clean.

## 12. CI consolidation contract

CI consolidation must reduce duplication without reducing protection.

- only latest-head results count;
- same-PR obsolete runs are cancelled;
- feature-specific gates remain where they prove unique contracts;
- one permanent all-public browser matrix covers route-level coherence;
- workflow consolidation must document preserved and retired assertions;
- a green set of isolated checks is not sufficient when a page-wide task remains broken.

## 13. Monitoring and maintenance contract

Phase 11 must lock:

- deployment identity checks;
- collector freshness and capacity observation;
- provider-specific Status checks;
- failure runbooks;
- weekly, monthly, and quarterly maintenance tasks;
- artifact retention and evidence ownership;
- escalation rules for P0/P1/P2/P3 findings.

No unnecessary cron is added when existing Status APIs or GitHub Actions can provide the evidence.

## 14. Non-goals

This program does not authorize:

- new APIs, D1 schemas, bindings, collector fields, cron jobs, or retention changes;
- exact session reconstruction;
- category or stream-language analytics;
- combined Twitch/Kick totals or identities;
- login, accounts, cloud sync, alerts, or AI interpretation;
- UI localization runtime work;
- a new major feature.

## 15. Acceptance

Phase 10–11 are accepted only when:

- reproduced defects have exact permanent gates;
- all 21 current owned routes and any newly added release routes have ownership and unified acceptance coverage;
- required widths, keyboard entry, focus, accessible names, target sizes, wrapping, contrast, forced colors, and overflow pass;
- Day Flow, Battle Lines, Channel, Watchlist, shared shell, and state grammar changes pass feature and provider regressions;
- obsolete layers are retired or explicitly documented;
- effective type-safety migration gates pass for the completed scopes;
- unified CI, monitoring, runbooks, and maintenance cadence are permanent;
- deliberate Preview and exact production acceptance pass where public behavior changed;
- permanent records are updated and temporary notes are deleted at milestone closure.