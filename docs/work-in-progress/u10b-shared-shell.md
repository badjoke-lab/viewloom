# ViewLoom U10B shared shell

Status: active
Phase: U10B
Branch: `work-quality-u10b-shell`
Entry main commit: `71400fbf8818e761e270f28c144cc5356380a0b8`
Exact next branch after merge and closeout: `work-quality-u10c-visualization`
U10C branch created: no

## Scope

U10B owns only the common public shell:

- masthead and brand context;
- global navigation and current-route ownership;
- mobile navigation behavior;
- portal, Twitch, and Kick identity presentation;
- shared status semantics;
- shared footer disclaimer and core links;
- repository and browser acceptance for 20 built routes.

Authoritative files:

```text
apps/web/src/shared-shell.ts
apps/web/src/shared-shell.css
apps/web/src/mock-site.ts
apps/web/src/provider-home.ts
```

The browser matrix covers 20 routes at 1440px and 390px for 40 scenarios. It verifies navigation order, current route, provider context, footer copy, status semantics, mobile open/close, Escape focus return, link close behavior, and absence of inline navigation styles.

U10B does not change feature visualizations, Day Flow or Battle Lines analysis logic, Channel no-id behavior, Watchlist readiness, APIs, D1, bindings, collectors, cron, retention, output schemas, localization runtime, or provider separation.
