# ViewLoom cross-site quality remediation specification

Status: approved future permanent specification
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 10–11
Implementation plan: `cross-site-quality-remediation-plan.md`
Entry condition: P9H7 History production acceptance complete

## 1. Purpose

This specification defines the target for repairing reproduced cross-site defects, consolidating shared interaction and visual rules, safely retiring obsolete UI layers, and locking a maintainable acceptance, type-safety, monitoring, and operations system.

It is a quality and architecture program, not a new feature program.

## 2. Evidence baseline

The initial baseline is the completed P8B audit:

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

Any new issue must record route/provider, viewport/state, expected and actual behavior, owner file, existing gate, missing assertion, and classification before repair.

## 3. Included work

- common shell, navigation, footer, provider identity, and status presentation;
- design tokens, spacing, typography, controls, forms, surfaces, and state panels;
- chart axes, units, legends, tooltips, selection, loading, empty, partial, stale, missing, and error grammar;
- Day Flow first-render clarity and date-control accessibility;
- Battle Lines recommended-pair/selected-time coherence;
- responsive layout at 1440, 820, 390, and 360px;
- keyboard entry, focus, touch, accessible names, and target sizes;
- Channel no-id entry behavior;
- Watchlist readiness coverage and general Production Smoke coverage;
- duplicate entries, obsolete implementations, and compatibility/hotfix layers where safe to retire;
- all-public acceptance, CI, strict-null migration, monitoring, runbooks, and maintenance cadence.

## 4. Provider invariants

Every change preserves separate Twitch and Kick routes, APIs, D1 bindings, collectors, rankings, exports, filenames, and coverage claims. Combined provider totals/rankings and cross-provider requests/storage are forbidden. Existing output schemas remain exact unless separately approved.

## 5. Shared interaction contract

- one visible primary task per page region;
- controls have stable labels and accessible names;
- first keyboard entry reaches a visible actionable control;
- focus order follows reading and task order;
- visible focus works in default, increased-contrast, and forced-color modes;
- hover is not the only way to inspect required information;
- pointer, touch, and keyboard produce equivalent core outcomes;
- Back/Forward and direct links restore supported state;
- controls do not trigger unrelated provider requests;
- loading and unavailable states are explicit.

## 6. Responsive contract

Required widths:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- desktop layouts are reorganized rather than simply scaled down;
- controls wrap in semantic order;
- applicable mobile controls are at least 44px;
- important management/publishing actions are at least 48px;
- long labels, URLs, legal text, and state explanations wrap safely;
- charts retain readable scale, units, selection, and state distinctions;
- mobile pages present a compact task flow.

## 7. Visualization and state grammar

Shared rules must define metric/unit naming, numeric scale, date/time context, baseline, selection, exact detail, keyboard/touch inspection, complete/partial/stale/in-progress/missing/demo/empty/error distinctions, non-color-only legends, accessible descriptions, and compact fallback panels.

Feature-specific meaning remains governed by each feature specification.

## 8. Architecture contract

- one authoritative controller/state owner per public feature route;
- explicit request, render, and update boundaries;
- no new global `window.fetch` replacement for feature coordination;
- no new document-wide `MutationObserver` as primary state management;
- no duplicate current/legacy entry for the same accepted route without a documented reason;
- obsolete layers retire only after equivalent contract and browser gates pass;
- URL, Back/Forward, provider, request-count, output, and degraded-state contracts remain protected.

## 9. Readiness and smoke coverage

The permanent all-public matrix enumerates every repository-owned public route and covers identity, metadata, provider binding/request separation, controls, accessible names, required widths, overflow, representative states, feature interactions, readiness ownership, and production smoke ownership.

Watchlist, About, Support, Changelog, Channel, and other owned routes may not remain absent merely because separate feature workflows exist.

## 10. Type safety and CI

The repository-level `strict: true` intent must not remain indefinitely weakened by command-line overrides. Phase 11 migrates the browser and server/Functions boundaries in bounded stages, adds explicit payload guards, avoids blanket `any` or non-null assertions, preserves behavior gates, and removes overrides only when each scope is clean.

CI consolidation must reduce duplication without reducing protection. Only latest-head results count; obsolete runs cancel; unique feature gates remain; one all-public browser matrix covers page-wide coherence; every retired workflow names its replacement assertions.

## 11. Monitoring and maintenance

Phase 11 locks deployment identity checks, provider Status checks, collector freshness/capacity observation, failure runbooks, artifact/evidence ownership, escalation rules, and weekly/monthly/quarterly maintenance. Existing Status APIs and GitHub Actions are preferred over unnecessary cron work.

## 12. Non-goals

This program does not authorize new APIs, D1 schemas, bindings, collector fields, cron, retention changes, exact sessions, category/stream-language analytics, combined providers, accounts, cloud sync, alerts, AI interpretation, localization runtime, or a new major feature.

## 13. Acceptance

Phase 10–11 are accepted only when reproduced defects have permanent gates; all owned routes have unified acceptance ownership; required widths/accessibility pass; Day Flow, Battle Lines, Channel, Watchlist, shell, and state grammar pass provider regressions; obsolete layers are retired or documented; staged strict-null gates pass; CI, monitoring, runbooks, and maintenance are permanent; Preview/production acceptance passes where public behavior changed; and temporary notes are closed correctly.