# ViewLoom search-state indexing policy — 2026-09-10

Status: implementation candidate

## Decision

The clean Day Flow and Battle Lines feature URLs remain the only indexable search landing pages:

- `https://www.viewloom.net/twitch/day-flow/`
- `https://www.viewloom.net/kick/day-flow/`
- `https://www.viewloom.net/twitch/battle-lines/`
- `https://www.viewloom.net/kick/battle-lines/`

URLs under those four routes that carry query-string UI state remain functional and shareable, but must not become independent search-result documents. The edge response therefore adds:

```text
X-Robots-Tag: noindex, follow
```

for HTML responses on those four routes whenever a query string is present.

The clean route keeps its existing self-canonical and indexable HTML. Query state is not stripped, redirected, or rewritten by this SEO policy, so existing deep-link behavior remains intact.

## Why

Search Console already showed inconsistent treatment of UI-state URLs: representative Day Flow date URLs were classified as redirect/consolidation cases, while some Kick Battle Lines `battle` + `date` URLs were individually indexed despite the page declaring the clean Battle Lines canonical. Those parameter URLs do not have unique server-rendered search copy, title, or H1, so treating them as separate search documents would create parameter/index sprawl rather than useful landing pages.

## Scope

This policy covers only Day Flow and Battle Lines query-state pages for Twitch and Kick.

It does not change:

- clean-route canonical URLs;
- sitemap membership;
- Day Flow or Battle Lines UI state contracts;
- deep-link parameters or History-generated dated links;
- APIs, collectors, D1, schema, bindings, cadence, retention, backfill, or provider boundaries;
- Heatmap, History, Stream Map, Channel, Watchlist, or Status indexing policy.

## Verification contract

`apps/web/scripts/verify-seo-qa.mjs` requires the four route boundaries, the query-string gate, HTML-only handling, and the exact `X-Robots-Tag` directive in `apps/web/functions/_middleware.ts`.

Production acceptance requires the normal web/function typecheck/build gates plus an HTTP response check showing:

- clean feature route: no search-state `X-Robots-Tag`;
- same feature route with query state: `X-Robots-Tag: noindex, follow`;
- query-state page remains HTTP 200 and usable;
- canonical remains the clean feature URL.
