# Phase 10 U10E — responsive and accessibility

Status: active
Branch: `work-quality-u10e-responsive`
Entry main commit: `0c55dd9d5f9d25a7254944d048a98dcd0a7efdd2`
Exact next branch after U10E: `work-quality-u10f-readiness`

## Scope

U10E applies the shared responsive and accessibility contract to the representative cross-site routes identified by U10A:

- Portal
- Twitch and Kick Day Flow
- Twitch and Kick Battle Lines
- Twitch and Kick Channel
- Twitch and Kick Local Watchlist

Required widths are 1440, 820, 390, and 360 pixels.

## Required outcomes

- no page-level horizontal overflow;
- mobile interactive targets are at least 44px;
- important management or publishing actions are at least 48px;
- controls retain stable accessible names;
- first keyboard entry reaches a visible action with a visible focus indicator;
- Day Flow UTC date inputs retain their visible accessible label;
- forced-color and reduced-motion scenarios remain usable;
- Twitch and Kick requests and data remain separate.

## Change boundary

U10E changes responsive and accessibility presentation only. APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, localization runtime, and provider separation remain unchanged.
