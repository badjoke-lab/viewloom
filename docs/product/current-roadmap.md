# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-08

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active and provider-separated on unchanged five-minute collectors.
- Provider-scoped semantic handling was accepted in PR #699.
- The accepted Twitch stability window completed from `2026-07-31T17:00:00.000Z` through `2026-08-07T17:00:00.000Z`.
- The governed final read-only audit passed all `2016 / 2016` expected slots with zero missing, duplicate, or invalid buckets and was frozen in PR #736.
- Final category-reference coverage was `0.995353`, unresolved category IDs were `0`, collector error runs were `0`, and Twitch/Kick provider leakage was `0`.
- The separate final-mode decision in PR #737 authorized hidden Twitch Heatmap category-filter revalidation only.
- Production hidden-filter revalidation passed all five desktop/mobile/provider-separation scenarios and was frozen in PR #739 / merge `ef4f2ba3ea5bbbb739ac8d6941dad074fa05591d`.

## Current gate: Twitch Heatmap category-filter public cutover

The final audit and hidden production revalidation are accepted. The current work is the separate Twitch-only public cutover.

Public behavior authorized by `docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json`:

- expose Category and Top controls on the normal Twitch Heatmap route;
- default to `All categories` and `Top 50`;
- allow Top `20`, `50`, and `100`;
- filter by provider category before Top-N slicing;
- preserve `category` and `top` in the URL;
- accept old `categoryPreview=1` links without requiring that parameter;
- preserve explicit unknown/unavailable states and the unfiltered fallback when category metadata is unavailable.

## Accepted semantics

- Identity remains provider-scoped: `(provider, categoryProviderId)`.
- Only complete provider-ID/name pairs create a category reference and dictionary entry.
- Incomplete pairs remain null coverage.
- Synthetic, name-only, and cross-provider mappings remain prohibited.
- Combined-provider category rankings remain prohibited.

## Active deliverable

Deploy the Twitch-only public category-filter cutover through the existing main-to-Cloudflare-Pages path, run production browser acceptance on the normal route, and freeze exact deployment and browser evidence.

## Following gates

1. merge the Twitch-only public cutover candidate;
2. deploy it through the controlled Pages workflow;
3. verify normal Twitch desktop/mobile category controls, URL state, real filtering, fallback, and provider separation in production;
4. freeze and accept public-cutover production evidence;
5. close the Twitch Heatmap category-filter rollout issues;
6. consider Day Flow and History category views separately; Kick category UI remains a separate decision.

## Hard boundaries

- No Kick category UI in this cutover.
- No collector, Worker, D1 schema/data, binding, cadence, retention, or backfill change.
- No synthetic or cross-provider category mapping, totals, or rankings.
- The existing provider-separated collection paths remain unchanged.
- Public navigation outside the Twitch Heatmap page is not added by this cutover.
