# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-02

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active and provider-separated on unchanged five-minute collectors.
- Corrected Twitch category-source-v2 observation completed successfully in run `30620512044` and was frozen in PR #697.
- Temporary observation execution paths were retired in PR #698.
- Provider-scoped semantic handling was accepted in PR #699 / merge `ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e`.
- The revised seven-day stability clock was accepted in PR #700 / merge `d2316f10ba970818a47605a76a9ee9f235c517a4`.

### Current gate: active seven-day Twitch stability accumulation

Accepted half-open window:

```text
start: 2026-07-31T17:00:00.000Z (2026-08-01 02:00 JST)
end-exclusive: 2026-08-07T17:00:00.000Z (2026-08-08 02:00 JST)
cadence: 5 minutes
expected slots: 2016
```

The existing Twitch collector continues unchanged. The clock required no start workflow, new cron, Worker deployment, checkpoint, D1 mutation, binding change, or operator action.

## Accepted semantics

- Identity is provider-scoped: `(provider, categoryProviderId)`.
- Only complete provider-ID/name pairs create a category reference and dictionary entry.
- Incomplete pairs remain null coverage.
- Synthetic, name-only, and cross-provider mappings are prohibited.
- Combined-provider category rankings remain prohibited.

## Active deliverable

Accumulate the accepted window without changing runtime behavior. At or after the end boundary, execute the governed final read-only audit and freeze the result for separate acceptance.

## Following gates

1. complete the accepted seven-day window;
2. final read-only audit for all 2016 expected slots;
3. final evidence freeze and separate acceptance;
4. separate final-mode decision;
5. separate public category-filter cutover.

## Hard boundaries

- No final audit or final mode before `2026-08-07T17:00:00.000Z`.
- No observation rerun, checkpoint rerun, historical backfill, threshold relaxation, synthetic mapping, or clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change during accumulation.
- Existing unfiltered Heatmap remains the fallback.
