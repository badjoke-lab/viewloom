# Phase 12A-4 category parallel execution

Status: completed for Twitch Heatmap public rollout  
Tracking issues: #623 / #635 / #659

## Final position

- Twitch and Kick permanent category capture remain active and provider-separated on unchanged five-minute cadences.
- Provider-scoped semantic handling was accepted in PR #699.
- The final Twitch seven-day audit passed `2016 / 2016` expected slots and was frozen in PR #736.
- Hidden Twitch Heatmap category-filter production revalidation passed and was accepted in PR #739.
- PR #740 exposed the accepted Twitch Category + Top controls on the normal Heatmap route.
- The initial public deployment was rejected because the 390px mobile page expanded to 474px.
- PR #741 repaired only the public control intrinsic width.
- Accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53` deployed successfully in run `31244148642`.
- Public browser acceptance run `31244148651` passed Twitch desktop, Twitch mobile, unknown-category, and Kick-isolation scenarios with zero horizontal overflow.

## Public Twitch Heatmap contract

```text
route: /twitch/heatmap/
category default: all
Top default: 50
Top choices: 20 / 50 / 100
filter order: category before Top N
URL state: category + top
legacy categoryPreview=1: compatible, not required
unknown category: explicit empty state
category unavailable: honest fallback behavior
Kick category controls: disabled
```

## Preserved semantic rules

1. Identity remains provider-scoped.
2. Only complete provider-ID/name pairs create references.
3. Incomplete pairs remain null coverage.
4. Synthetic, name-only, and cross-provider mappings are prohibited.
5. Combined-provider category rankings are prohibited.

## Closeout boundary

This WIP is complete for the Twitch Heatmap category-filter rollout. Parent program #623 remains open for separately authorized follow-up surfaces.

Not authorized by this completion:

- Kick category UI;
- Day Flow category UI;
- History category UI;
- collector or Worker changes;
- D1 schema/data changes;
- cadence, retention, or backfill changes;
- cross-provider category identity, totals, or rankings.
