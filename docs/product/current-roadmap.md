# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-08

## Current milestone: 12A — free-tier long-run hardening

### Completed in the Twitch category rollout

- Twitch and Kick permanent category capture remain active and provider-separated on unchanged five-minute collectors.
- Provider-scoped category semantics were accepted in PR #699.
- The accepted Twitch seven-day window completed at `2026-08-07T17:00:00.000Z`.
- The final read-only audit passed `2016 / 2016` slots with zero missing, duplicate, invalid, or consecutive-missing buckets and was accepted in PR #736.
- Final category-reference coverage was `0.995353`; unresolved category IDs, collector error runs, and Twitch/Kick leakage were all `0`.
- PR #737 authorized hidden Twitch Heatmap filter revalidation only.
- Five hidden production browser scenarios passed and were accepted in PR #739.
- PR #740 published the accepted Category + Top controls on the normal Twitch Heatmap route.
- The first public production acceptance correctly rejected a 390px mobile overflow (`474 / 390`).
- PR #741 fixed only the intrinsic mobile control width; accepted production SHA is `b006f45d0676c9ff3e05e5d6727458e43802de53`.
- Cloudflare Pages deployment run `31244148642` succeeded.
- Public production acceptance run `31244148651` passed on the first attempt after the repair: Twitch desktop, Twitch 390px mobile, unknown-category handling, and Kick isolation all passed with no horizontal overflow.

## Current gate: post-rollout category program handoff

The Twitch Heatmap category-filter rollout is complete after the public production evidence is frozen in `docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json`.

Current public Twitch Heatmap behavior:

- Category controls are available on `/twitch/heatmap/`;
- default category is `All categories`;
- default Top is `50`;
- Top `20`, `50`, and `100` are supported;
- category filtering occurs before Top-N slicing;
- `category` and `top` remain URL state;
- old `categoryPreview=1` links remain compatible but are no longer required;
- unknown/unavailable category states remain explicit and honest.

## Accepted semantics and boundaries

- Identity remains provider-scoped: `(provider, categoryProviderId)`.
- Only complete provider-ID/name pairs create category references.
- Synthetic, name-only, and cross-provider mappings remain prohibited.
- Combined-provider category totals and rankings remain prohibited.
- Kick category UI is not authorized by the Twitch rollout.
- No collector, Worker, D1 schema/data, binding, cadence, retention, or backfill change was part of the public cutover.

## Following gates

1. close the completed Twitch replacement audit (#659);
2. close the completed Twitch Heatmap category-filter rollout (#635);
3. keep parent category program #623 open;
4. decide any Day Flow category view separately;
5. decide any History category view separately;
6. decide any Kick category UI separately.

No additional category surface is automatically authorized by the Twitch Heatmap rollout.
