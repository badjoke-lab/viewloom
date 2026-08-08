# Phase 12A-4 category parallel execution

Status: active WIP  
Tracking issues: #623 / #635

## Current position

- Twitch and Kick permanent category capture are active and provider-separated on unchanged five-minute cadences.
- Provider-scoped semantic handling was accepted in PR #699.
- The revised Twitch seven-day window completed at `2026-08-07T17:00:00.000Z`.
- The final read-only audit passed `2016 / 2016` slots and was frozen in PR #736.
- PR #737 authorized hidden Twitch category-filter production revalidation only.
- The hidden Twitch Heatmap category filter passed five production browser scenarios and was frozen in PR #739 / `ef4f2ba3ea5bbbb739ac8d6941dad074fa05591d`.

## Current gate

Twitch-only public Heatmap category-filter cutover.

```text
provider: twitch
route: /twitch/heatmap/
default category: all
default top: 50
allowed top: 20 / 50 / 100
filter order: category before Top N
legacy categoryPreview=1 URL: compatible, not required
Kick category UI: disabled
```

## Accepted semantic rules

1. Identity remains provider-scoped.
2. Only complete provider-ID/name pairs create references.
3. Incomplete pairs remain null coverage.
4. Synthetic, name-only, and cross-provider mappings are prohibited.
5. Combined-provider category rankings are prohibited.

## Current implementation boundary

The public cutover may change only Twitch Heatmap presentation/API exposure metadata needed to surface the already-tested filter. It must not alter collection, storage, category identity, or provider separation.

## Next gate

Merge the public cutover only after local/CI gates pass, deploy through the controlled Pages path, then verify the normal production Twitch Heatmap route on desktop and mobile. Freeze exact deployment and production browser evidence in a separate acceptance PR.

## Required boundaries

- No Kick category UI.
- No collector, Worker, D1 mutation/schema, binding, cadence, retention, or backfill change.
- No synthetic or cross-provider identity, totals, or rankings.
- Do not close #635 or #623 until deployed public production acceptance is frozen.
