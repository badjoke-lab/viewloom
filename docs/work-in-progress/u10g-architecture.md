# Phase 10 U10G — architecture consolidation

Status: active
Branch: `work-quality-u10g-architecture`
Entry main commit: `db93ca69ebdc5e2ac6a308fa5d60580bbeecfc27`
Exact next branch after U10G: `work-quality-u10h-acceptance`

## Reproduced architecture findings

- Day Flow loads `day-flow-current-shell-entry.ts` and `day-flow-layout-summary.ts` as independent page entries.
- The Day Flow secondary entry performs a second feature API request, observes summary DOM mutations, and maintains separate layout state.
- Battle Lines loads four feature coordination entries in addition to the shared shell.
- `battle-lines-loading-guard.ts` replaces global `window.fetch` and observes range-control mutations.
- `battle-lines-layout.ts` replaces `history.replaceState`, observes feature DOM mutations, and maintains separate layout state.
- `battle-lines-deep-link-bridge.ts` replaces `URLSearchParams.prototype.get` and `history.replaceState`.

## Required outcomes

- Day Flow has one request/state/controller owner per provider route.
- Enhanced Day Flow summary renders from the primary payload without a second request or MutationObserver.
- Battle Lines has one request/state/controller owner per provider route.
- Battle Lines request timeout, date visibility, layout, split-rail rendering, and canonical selected-time URL are invoked explicitly by the primary controller.
- No feature coordination code replaces `window.fetch`, `history.replaceState`, or `URLSearchParams.prototype.get`.
- No document-wide or feature-wide MutationObserver remains as primary state management.
- Layout-only changes do not request feature data.
- Direct `time` links and legacy `point` links resolve to one selected bucket; canonical URLs retain `time` and remove `point`.
- Twitch and Kick continue using separate routes and endpoints.
- APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, and localization runtime remain unchanged.

## Change boundary

U10G may consolidate browser-side feature ownership and retire obsolete compatibility/hotfix entries. It does not authorize new user-facing features, APIs, storage, bindings, collectors, cron, retention, output fields, localization runtime, provider combination, or production acceptance.
