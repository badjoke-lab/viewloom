# Japanese Data Status candidates — J6a contract

Date: 2026-09-11  
Program: Japanese localization  
Stage: J6a — Data Status candidates

## Candidate routes

- `/ja/twitch/status/`
- `/ja/kick/status/`

Both candidates remain `noindex,follow`, self-canonical, outside the public sitemap, without public `hreflang`, and without public language switching until J10.

## Runtime ownership

Japanese Data Status does not introduce a localized API or a second Status controller.

- Twitch continues to use `/api/twitch-status` with `DB_TWITCH_HOT`.
- Kick continues to use `/api/kick-status` with `DB_KICK_HOT`.
- `status-current-shell-entry.ts` remains the network/request owner.
- `status-ja-presentation.ts` is locale-gated presentation only and owns no `fetch()` or `/api/*` path.
- The shared shell localizes internal links only when the equivalent Japanese route is explicitly available.

## Semantics preserved

J6a does not change:

- collector behavior;
- collection cadence;
- D1 schema or writes;
- retention or backfill;
- provider separation;
- freshness thresholds;
- `fresh` / `partial` / `empty` / `stale` / `demo` / `error` semantics;
- `empty` versus `demo` distinction;
- coverage limits or source-mode meaning;
- sanitized debug payload values.

## Candidate inventory after J6a

- Vite HTML inputs: 42
- inventory entries including explicit 404: 43
- indexable routes: 23
- noindex routes: 19
- sitemap routes: 23
- Japanese candidates: 15
- browser scenarios: 168 across four viewports

## J6 split

J6 is intentionally implemented as bounded sub-stages:

1. J6a — Data Status
2. J6b — Channel
3. J6c — Local Watchlist

This keeps utility-route runtime ownership and regression gates isolated rather than landing six new candidates in one change.

## Release boundary

J6a is candidate-only. Public Japanese indexing, sitemap entries, reciprocal `hreflang`, and public language switching remain forbidden until the coordinated J10 release gate.
