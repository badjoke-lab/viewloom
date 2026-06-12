# Mobile QA Contract

This page records the minimum mobile rendering contract for ViewLoom public pages.

## Page requirements

All public HTML pages must keep:

- viewport metadata with `width=device-width, initial-scale=1.0`
- `.site-frame`
- `.masthead`
- `.global-nav`
- a `.mobile-menu.mobile-only` button
- `data-mobile-menu`
- `aria-label="Open navigation"`
- `.page` or `.page--full`
- `.footer`

Feature pages must keep their mobile-critical local surfaces:

- feature navigation via `.feature-tabs`
- visual pages keep `.layout-split`
- Heatmap keeps `.heatmap-wrap`
- Day Flow and Battle Lines keep `.toolbar`
- Status and History keep `.metric-ledger`

## CSS requirements

The shared CSS must keep responsive rules for:

- hiding `.global-nav` on narrow screens
- showing `.mobile-menu` / `.mobile-only`
- reducing page padding on mobile
- collapsing `.layout-split` and `.provider-overview`
- making `.data-strip` two-column on mobile
- allowing `.feature-tabs` and `.toolbar` to scroll horizontally
- making `.footer` stack on mobile

A future change that removes mobile menu markup or the shared responsive breakpoints is a regression.
