# History P9H0 baseline contract

Status: active known-failure contract
Created: 2026-06-26
Branch: `work-history-ui-h0-baseline`
Permanent owner trace: `../../../docs/audits/history-p9h0-ownership.md`
Verifier: `../scripts/verify-history-p9h0-baseline.mjs`

## Purpose

Freeze the current Twitch/Kick History entry composition, primary state owner, known metric/focus/task defects, and compatibility-layer footprint before P9H1 product repair.

## Required route composition

Both History HTML entries load:

```text
history-usability-pass.ts
history-current-shell-entry.ts
```

in that order, with provider-specific body identity and endpoints retained.

## Required current known failures

Until their scheduled repair PR, the verifier expects:

- `renderSummary()` does not receive the selected metric and still emits Viewer-minutes-specific primary facts;
- `renderSelectedDay()` does not receive the selected metric and still exposes both metrics without one selected-metric primary fact;
- P8B retains the keyboard-entry P1 record;
- P8B retains the task-hierarchy P1 record.

These assertions are not acceptance of the behavior. They are expected-failure guards so defects cannot be hidden or partially changed without updating the scheduled repair contract.

## Required ownership inventory

The verifier requires the current import order and current fetch-wrapper owners to remain explicitly named. It also requires the current shell rehome/replaceState mechanism and observer-based enhancement layers to remain visible until they are deliberately repaired or retired.

## Repair transition

- P9H1 replaces metric known-failure assertions with repaired metric assertions.
- P9H2 adds complete chart/day interaction assertions.
- P9H3 replaces task hierarchy known-failure assertions with Overview hierarchy assertions.
- P9H5 replaces keyboard-entry known-failure evidence with passing browser assertions.
- P9H6 rejects reintroduction of visual-only metric switching and undocumented ownership layers.

## Boundaries

No API, D1, binding, collector, cron, retention, output-schema, provider-combination, Preview, or localization runtime change is authorized by this contract.