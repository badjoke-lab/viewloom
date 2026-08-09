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

## Post-U10G authorized Twitch Day Flow category boundary

PR #758 later authorized a public Twitch-only Day Flow Category control. Issue #759 records the architecture alignment required after that authorization. This does not reopen the general U10G permission to replace browser globals.

The retained architecture contract now recognizes exactly one provider-specific exception:

- only the Twitch Day Flow bootstrap may load `day-flow-category-preview-entry.ts` before the shared Day Flow controller;
- that boundary may wrap `window.fetch` only to add the selected `category` to same-origin `/api/day-flow` requests and must delegate every other request unchanged;
- that boundary may wrap `history.replaceState` only to retain the Twitch Day Flow `category` URL state on the current pathname and remove the retired `categoryPreview` parameter after public interaction;
- `URLSearchParams.prototype.get` must never be replaced;
- Kick Day Flow and both Battle Lines routes must retain native `fetch`, `history.replaceState`, and `URLSearchParams.prototype.get` identities;
- the shared Day Flow controller remains the only request/state/controller owner and still contains the single feature `fetch(` call;
- initial load must still produce exactly one provider-correct Day Flow request and zero cross-provider requests;
- the public category boundary must expose `data-dayflow-category-preview="public"`, remain Twitch-only, and must not authorize another provider, route, or feature to install a similar wrapper.

This is a scoped compatibility boundary for the already-authorized public Twitch Category filter, not a general relaxation of U10G.

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

U10G consolidated browser-side feature ownership and retired obsolete compatibility/hotfix entries. It did not authorize new user-facing features, APIs, storage, bindings, collectors, cron, retention, output fields, localization runtime, provider combination, or production acceptance. The later #758/#759 Twitch Day Flow category boundary is limited to the explicit exception above and does not alter those infrastructure or provider-separation boundaries.
