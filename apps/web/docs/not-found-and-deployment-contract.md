# Not-found and deployment identity contract

## Explicit 404 behavior

ViewLoom is a multipage public site, not a single-page application router. The built site must include a top-level `404.html` file so Cloudflare Pages returns an explicit not-found response instead of serving the Portal for an unknown route.

The not-found page must:

- include `data-viewloom-not-found="v1"`;
- use `noindex,follow`;
- provide recovery links to Portal, Twitch data, and Kick data;
- avoid provider totals or cross-provider comparisons;
- be usable without JavaScript.

## Deployment identity

Each build writes `/deployment.json` from Cloudflare Pages system variables when available.

```text
schema: viewloom-deployment-v1
environment: production | preview | local
branch: Cloudflare Pages branch or null
commit_sha: Cloudflare Pages commit SHA or null
pages_url: Cloudflare Pages deployment URL or null
```

This public metadata contains no secret values. It allows production smoke checks to wait for the exact main commit rather than testing a previous deployment.

## Production smoke boundary

The smoke gate checks:

- exact deployed main SHA;
- Portal and provider routes;
- Twitch and Kick status APIs;
- separate D1 binding names and databases;
- non-stale collector status;
- explicit 404 behavior;
- absence of Preview-only probe data from production.

It does not modify D1, collectors, cron schedules, bindings, or production data.
