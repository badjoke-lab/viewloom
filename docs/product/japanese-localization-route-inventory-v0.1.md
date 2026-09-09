# ViewLoom Japanese localization route inventory v0.1

Status: active J0 route inventory  
Source baseline: main `f32b2b939285329a979d32c0af8f84ebb0b7a335`  
Vite HTML inputs: 27  
Current sitemap/indexable routes: 23  
Current noindex utility/detail routes outside sitemap: 4  

## 1. Purpose

Freeze the English HTML route set that the Japanese localization lane must cover. This is the parity checklist for J3-J9.

The inventory is derived from the current `apps/web/vite.config.ts` input map and `apps/web/public/sitemap.xml` rather than from an older design document.

## 2. Indexable English routes -> Japanese parity targets

These 23 routes are currently in the public sitemap. Their Japanese counterparts become indexable only at J10.

| English route | Japanese target | Migration stage |
| --- | --- | --- |
| `/` | `/ja/` | J3 |
| `/about/` | `/ja/about/` | J7 |
| `/support/` | `/ja/support/` | J7 |
| `/changelog/` | `/ja/changelog/` | J7 |
| `/contact/` | `/ja/contact/` | J7 |
| `/terms/` | `/ja/terms/` | J7 |
| `/privacy/` | `/ja/privacy/` | J7 |
| `/refund-policy/` | `/ja/refund-policy/` | J7 |
| `/commercial-disclosure/` | `/ja/commercial-disclosure/` | J7 |
| `/twitch/` | `/ja/twitch/` | J3 |
| `/twitch/heatmap/` | `/ja/twitch/heatmap/` | J4 |
| `/twitch/day-flow/` | `/ja/twitch/day-flow/` | J4 |
| `/twitch/battle-lines/` | `/ja/twitch/battle-lines/` | J4 |
| `/twitch/history/` | `/ja/twitch/history/` | J4 |
| `/twitch/map/` | `/ja/twitch/map/` | J5 |
| `/twitch/status/` | `/ja/twitch/status/` | J6 |
| `/kick/` | `/ja/kick/` | J3 |
| `/kick/heatmap/` | `/ja/kick/heatmap/` | J4 |
| `/kick/day-flow/` | `/ja/kick/day-flow/` | J4 |
| `/kick/battle-lines/` | `/ja/kick/battle-lines/` | J4 |
| `/kick/history/` | `/ja/kick/history/` | J4 |
| `/kick/map/` | `/ja/kick/map/` | J5 |
| `/kick/status/` | `/ja/kick/status/` | J6 |

## 3. Current noindex routes -> Japanese noindex parity targets

These routes are Vite production HTML inputs but are intentionally not in the public sitemap. Current channel/watchlist pages use `noindex,follow`; Japanese parity must preserve that indexing policy unless separately changed by a future SEO decision.

| English route | Japanese target | Migration stage | J10 index policy |
| --- | --- | --- | --- |
| `/twitch/channel/` | `/ja/twitch/channel/` | J6 | remain `noindex,follow` |
| `/twitch/watchlist/` | `/ja/twitch/watchlist/` | J6 | remain `noindex,follow` |
| `/kick/channel/` | `/ja/kick/channel/` | J6 | remain `noindex,follow` |
| `/kick/watchlist/` | `/ja/kick/watchlist/` | J6 | remain `noindex,follow` |

## 4. Total parity target

```text
current Vite HTML inputs                27
current sitemap/indexable routes        23
current noindex HTML routes              4
Japanese HTML parity target             27
Japanese J10 sitemap additions          23
Japanese routes that remain noindex      4
```

J10 therefore does not mean "put every Japanese HTML route into the sitemap." It means mirror the current English indexing contract: 23 indexable Japanese routes and 4 Japanese noindex utility/detail routes.

## 5. Excluded from localized route generation

Do not create locale-prefixed equivalents for:

- `/api/*`;
- `/src/*`;
- `/assets/*`;
- `/og/*`;
- external provider URLs;
- external contact/form URLs;
- raw data/API endpoints.

## 6. Query/hash parity

Japanese route switching should preserve page-valid query/hash state.

Examples:

```text
/twitch/map/?geography=city
-> /ja/twitch/map/?geography=city

/kick/history/?period=30d
-> /ja/kick/history/?period=30d
```

A later migration branch must validate the actual supported query contract of each page rather than preserve arbitrary unknown parameters blindly.

## 7. Release acceptance use

J9 compares the built candidate against this inventory and must fail if:

- an English target lacks its Japanese counterpart;
- a Japanese route has the wrong index/noindex policy;
- a route switch falls back to a different feature/provider unexpectedly;
- public Japanese sitemap/hreflang is enabled before all 23 indexable targets are ready.
