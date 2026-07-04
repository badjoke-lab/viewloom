# Phase 10 U10G — architecture consolidation

Status: complete
Branch: `work-quality-u10g-architecture`
Entry main commit: `db93ca69ebdc5e2ac6a308fa5d60580bbeecfc27`
Merged PR: #470
Merge commit: `62dab7b6076c15b85c3d893589df22388753c1bc`
Exact next branch after U10G: `work-quality-u10h-acceptance`

## Reproduced architecture findings

- Day Flow loaded `day-flow-current-shell-entry.ts` and `day-flow-layout-summary.ts` as independent page entries.
- The Day Flow secondary entry performed a second feature API request, observed summary DOM mutations, and maintained separate layout state.
- Battle Lines loaded four feature coordination entries in addition to the shared shell.
- `battle-lines-loading-guard.ts` replaced global `window.fetch` and observed range-control mutations.
- `battle-lines-layout.ts` replaced `history.replaceState`, observed feature DOM mutations, and maintained separate layout state.
- `battle-lines-deep-link-bridge.ts` replaced `URLSearchParams.prototype.get` and `history.replaceState`.

## Completed outcomes

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

## Evidence

```text
PR: #470
Head: 231270cee3d9ec5006b03508d7ab42c256a892b1
Merge: 62dab7b6076c15b85c3d893589df22388753c1bc
Quality U10G Architecture: pass
U10G browser scenarios: 8
Artifact: 8076053343
Digest: sha256:787b17923ee24ff5ca2ba546759a8a9846002fdd0c428e6180d9ea9c68dd2644
```

## Change boundary

U10G consolidated browser-side feature ownership and retired obsolete compatibility/hotfix entries. It did not authorize new user-facing features, APIs, storage, bindings, collectors, cron, retention, output fields, localization runtime, provider combination, or production acceptance.
