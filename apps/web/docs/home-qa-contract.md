# Portal and Provider Home QA Contract

This page records the production contract for the portal and provider home pages.

## Portal role

The portal is the lightweight ViewLoom entrance. It explains the observation model, shows separate Twitch and Kick briefing cards, and routes users into the appropriate provider site and analysis view.

A completed portal must contain:

1. A compact ViewLoom hero and operating-model facts
2. Two provider briefing cards, one for Twitch and one for Kick
3. Provider-specific status, update age, observed stream count, observed viewer count, largest observed stream, and coverage note
4. Exactly four analysis view cards: Heatmap, Day Flow, Battle Lines, and History
5. A short data-boundaries explanation
6. Separate links to `/twitch/` and `/kick/`

The portal must fetch `/api/twitch-home` and `/api/kick-home` independently. It must never add, average, rank, or otherwise combine Twitch and Kick values into a cross-platform total.

The portal must not contain:

- fake live counts or static provider totals
- a fifth Status analysis card
- duplicate provider-home sections
- heavy charts or raw minute snapshots
- internal QA notes, implementation notes, or release notes

Status remains available from each provider card and provider site.

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
3. Clickable provider data-status strip with the single provider coverage note
4. Exactly four analysis feature cards: Heatmap, Day Flow, Battle Lines, and History
5. Live Now
6. Current signals
7. Today
8. Recent Trends

Status must remain linked from the provider home, but Status is not a fifth analysis feature card.

Provider limitations must not be repeated in separate bottom sections. Internal release notes, implementation summaries, QA notes, and temporary ViewLoom updates do not belong on the provider home. Reviewed product milestones belong on `/changelog/`.

## Data truth

- All totals must be labeled as observed values, not provider-wide totals.
- Final KPI cells must not use unexplained em dashes as the only unavailable-state copy.
- Decorative charts without meaningful labels, data, or state semantics are not accepted as completed visualizations.
- Static fake counts, `Stream A` rows, hard-coded freshness, and silently substituted fixtures are regressions.
- `empty` means a healthy real observation with no qualifying data and must not be displayed as demo.
- `stale` keeps the last normal data and explains its age.
- `partial` is reserved for an actual source or collection limitation. The configured Twitch Top 300 boundary is expected coverage and must not be presented as a collector-health failure.
- `demo` is visibly labeled.
- `error` does not silently replace real values with demo values.
- Unsupported provider signals are omitted or linked to their full analysis page; internal phrases such as `Unavailable in Home payload` are forbidden.
- A five-minute collector must not be marked stale after only four minutes. Twitch and Kick Home use a ten-minute stale threshold.
- If every current stream lacks title/category context, the Context column is hidden and the limitation is explained once below the table.

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
- Provider source, coverage, top limit, activity availability, unavailable signals, and route links remain provider-specific.
- Twitch and Kick values are never combined on either provider home or the portal.
- Twitch source is presented as Helix-backed observation. Kick source is presented as authenticated or candidate-feed observation.

## Home payload contract

- `/api/twitch-home` reads `DB_TWITCH_HOT` only.
- `/api/kick-home` reads `DB_KICK_HOT` only.
- Both endpoints return `viewloom-home-v1`.
- The browser receives a lightweight summary rather than raw minute snapshots.
- Current movement is derived from the latest two snapshots.
- Today peak is read from the current UTC day.
- Recent Trends use retained daily rollups and prefer completed days.
- Missing activity and reversal data are marked `unavailable`, not zero.
- API failures return `state: error` and do not substitute fixtures.
- Responses use `cache-control: no-store`.

The detailed schema is fixed in `docs/home-payload-contract.md`.
State examples are fixed in `fixtures/home-payload-states.json`.

## Navigation

Provider home pages must link to:

- Heatmap
- Day Flow
- Battle Lines
- History
- Status

The first four are analysis cards. Status is reached through the status/header surface rather than a fifth analysis card.

The portal must expose separate routes for both providers for each of the four analysis views. It must not imply that the resulting values are directly comparable across providers.

## Mobile

- Mobile keeps the same information hierarchy but reduces ranking rows, chart labels, and secondary detail.
- The completed mobile page must not be a wide desktop dashboard merely stacked unchanged.
- Horizontal data tables must not be required to understand the provider-home or portal summary.
- Mobile navigation exposes and updates `aria-expanded` correctly.
- Provider briefing cards and analysis cards collapse without hiding their primary action.

## Implementation source of truth

The fixed implementation sequence and payload direction are recorded in `docs/platform-home-repair-plan.md`.
A future change that restores old overview cards, fake live counts, mock portal labels, decorative placeholder charts, duplicated coverage sections, internal release notes, Status as a fifth analysis feature card, or combined Twitch/Kick totals is a regression.
