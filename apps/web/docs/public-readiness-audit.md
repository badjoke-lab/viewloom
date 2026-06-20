# ViewLoom public readiness audit

This audit checks the built public site without contacting Cloudflare or production services.

## Hard failures

- a configured public page is missing from the Vite build;
- title, description, canonical URL, one H1, global navigation, or footer is missing;
- canonical URL or `data-provider` does not match the route;
- indexable routes are absent from the sitemap;
- provider feature tabs cross Twitch and Kick routes;
- a built asset referenced by HTML is missing;
- the retired `livefield.pages.dev` domain or static `Stream A` / `Stream B` mock labels remain in public HTML.

## Warnings

- a utility channel route is indexable without an explicit `noindex` directive;
- optional Open Graph or Twitter metadata is incomplete;
- a local route cannot be resolved to another built HTML page;
- robots.txt does not advertise the sitemap.

Warnings are recorded but do not fail CI. The JSON and Markdown reports are uploaded as workflow artifacts.

## Boundaries

The audit does not deploy, inspect production, query provider APIs, change a database, or validate real collector data. Passing means the repository build is structurally ready for a later production verification step.
