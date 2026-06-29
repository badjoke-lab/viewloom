# ViewLoom U10C visualization grammar

Status: active
Phase: U10C
Branch: `work-quality-u10c-visualization`
Entry main commit: `7456e4d14c89708f11ca6a691b60cdfd59a70f31`
Exact next branch after merge and closeout: `work-quality-u10d-analysis-coherence`
U10D branch created: no

## Scope

U10C standardizes how the four provider visualization families explain themselves without changing their analysis meaning:

- Heatmap;
- Day Flow;
- Battle Lines;
- History.

Both Twitch and Kick routes are included.

```text
Visualization routes: 8
Required widths: 1440 / 820 / 390 / 360
Browser scenarios: 32
```

The shared grammar owns:

- metric and unit naming;
- UTC date/time context;
- scale and baseline explanation;
- selection and exact-detail explanation;
- loading, fresh, partial, stale, missing, empty, demo, and error state presentation;
- non-color-only reading guidance;
- chart-stage accessible descriptions;
- one cross-feature browser acceptance matrix at 1440, 820, 390, and 360px.

## Boundaries

U10C does not change recommendation ownership, selected-time state ownership, Day Flow first-render defaults, Channel no-id behavior, Watchlist readiness, APIs, D1, bindings, collectors, cron, retention, output schemas, localization runtime, or provider separation.

Battle Lines recommendation and selected-time coherence remain U10D. Day Flow first-render coherence remains U10D. Target-size repair remains U10E.

## Acceptance

Each of the eight routes must expose one shared reading guide with Scale, Time, Selection, Detail, and State cells. The current metric must update the Scale cell. The chart stage must reference the guide with `aria-describedby`, expose a normalized visualization state, and remain keyboard/touch compatible through the existing feature controller.

The browser matrix covers eight routes at four required widths for 32 scenarios and verifies provider separation, guide structure, metric synchronization, state semantics, accessible stage ownership, and no page-level horizontal overflow.
