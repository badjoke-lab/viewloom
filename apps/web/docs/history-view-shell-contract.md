# ViewLoom History view shell contract

Status: H1 implementation contract

The History shell separates one provider-specific History page into three task views without changing the loaded History data contract.

## Top-level views

```text
Overview
Archives
Report & Export
```

URL state:

```text
overview: /{provider}/history/ with no `view` parameter
archives: /{provider}/history/?view=archives&archive=daily|peaks|battles
report:   /{provider}/history/?view=report
```

## Required behavior

- Overview is the default and canonical clean History URL.
- `view=overview` is normalized to the clean URL.
- Invalid `view` or `archive` values fall back safely without removing valid period, metric, custom-range, selected-day, sort, or limit parameters.
- View changes use browser history so Back and Forward restore the previous History task view.
- Period, metric, custom dates, selected day, ranking sort, and ranking limit survive view changes.
- Existing History URL replacement performed by the data shell must preserve the active `view` and `archive`.
- Switching views or archive subviews must not issue another History API request.
- Twitch and Kick stay on their current provider route and endpoint.
- All existing modules remain mounted and continue to update from the already loaded provider response.

## Provisional module placement

Overview:

- period summary and coverage summary;
- previous-period comparison;
- primary trend chart and selected-day inspector;
- calendar heat;
- Top streamers;
- detailed coverage.

Archives:

- Daily;
- Peaks;
- Battles.

Report & Export:

- full report / short post;
- share card;
- CSV / JSON export.

H1 establishes state, accessible tabs, URL behavior, and provisional containers. H2-H5 own final information density, archive presentation, report consolidation, and visual polish.

## Accessibility

- top-level and archive navigation use `role=tablist`, `role=tab`, and `role=tabpanel`;
- selected tabs expose `aria-selected=true`;
- inactive panels use the native `hidden` state;
- Arrow Left/Right and Home/End move and activate tabs;
- visible focus is preserved;
- mobile tabs remain horizontally reachable without page overflow.

## State decisions resolved in H1

- the canonical Overview URL omits `view=overview`;
- selected day and all supported analysis parameters persist across task views;
- the most recently selected archive subview is remembered for the current page session;
- direct archive URLs always serialize an explicit `archive` value;
- invalid state is normalized with `replaceState`, while user navigation uses `pushState`.

## Non-goals

No D1 schema, collector, cron, retention, API route, metric, cross-provider total, login, or Cloudflare configuration change.
