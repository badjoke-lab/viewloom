# Portal and Provider Home QA Contract

This page records the production contract for the portal and provider home pages.

## Portal

- The portal keeps the current dark shell, `data-provider="portal"`, `.portal-grid`, separate Twitch/Kick panels, and `.signal-list`.
- The portal must not show combined Twitch/Kick totals as if they are one provider.
- Portal links must continue to open `/twitch/` and `/kick/` as separate observation sites.

## Provider-home role

The Twitch and Kick home pages are platform briefing pages, not static feature directories and not compressed duplicates of every analysis page.

A completed provider home must answer:

- whether current provider data is healthy
- what is currently observed
- who is largest or rising now
- what happened today
- what changed across recent completed days
- where to go for deeper analysis

## Required completed-page sections

The completed provider-home implementation must contain:

1. Compact provider hero
2. Current observed KPI group
3. Clickable provider data-status strip
4. Exactly four analysis feature cards: Heatmap, Day Flow, Battle Lines, and History
5. Live Now
6. Current signals
7. Today
8. Recent Trends
9. Latest provider signals
10. ViewLoom updates
11. Provider-specific coverage note

Status must remain linked from the provider home, but Status is not a fifth analysis feature card.

## Data truth

- All totals must be labeled as observed values, not provider-wide totals.
- Final KPI cells must not use unexplained em dashes as the only unavailable-state copy.
- Decorative charts without meaningful labels, data, or state semantics are not accepted as completed visualizations.
- Static fake counts, `Stream A` rows, hard-coded freshness, and silently substituted fixtures are regressions.
- `empty` means a healthy real observation with no qualifying data and must not be displayed as demo.
- `stale` keeps the last normal data and explains its age.
- `partial` names the provider coverage limitation.
- `demo` is visibly labeled.
- `error` does not silently replace real values with demo values.
- Unsupported provider signals are omitted or shown as `Unavailable`; they are not displayed as zero.

Allowed provider-home states are:

- loading
- fresh
- partial
- stale
- empty
- demo
- error

## Provider separation

- Twitch and Kick home pages keep `data-provider="twitch"` and `data-provider="kick"` respectively.
- Both pages use the same structural component contract.
- Provider source, coverage, top limit, activity availability, unavailable signals, route links, and partial-state reasons remain provider-specific.
- Twitch and Kick values are never combined on either provider home.

## Navigation

Provider home pages must link to:

- Heatmap
- Day Flow
- Battle Lines
- History
- Status

The first four are analysis cards. Status is reached through the status/header surface rather than a fifth analysis card.

## Mobile

- Mobile keeps the same information hierarchy but reduces ranking rows, chart labels, and secondary detail.
- The completed mobile page must not be a wide desktop dashboard merely stacked unchanged.
- Horizontal data tables must not be required to understand the provider-home summary.

## Implementation source of truth

The fixed implementation sequence and payload direction are recorded in `docs/platform-home-repair-plan.md`.
A future change that restores old overview cards, fake live counts, mock portal labels, decorative placeholder charts, or Status as a fifth analysis feature card is a regression.
