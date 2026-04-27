# Battle Lines QA Checklist

This checklist is the completion gate for the Twitch Battle Lines Wide page.

## Terminal gate

Run from the repository root.

```bash
pnpm install
pnpm build:web
```

Expected result:

- Vite build succeeds.
- No TypeScript compile error.
- No missing import error.
- Twitch Battle Lines route is included in the build output.

## Desktop browser gate

Open:

```text
/twitch/battle-lines/
```

Pass conditions:

- Page title remains `Battle Lines`.
- Hero heading remains `Battle Lines`.
- The chart is the visual center of the page.
- Primary summary is one compact card, not a card wall.
- Status note clearly shows live, partial, stale, empty, error, or demo state.
- Viewers / Indexed switch updates the chart scale.
- Top 3 / Top 5 / Top 10 changes visible context lines without making primary pair unreadable.
- 1m / 5m / 10m control does not break the page.
- Refresh does not blank the page.
- Clicking the chart changes the selected time and Time Inspector values.
- Jump to live returns to the latest bucket.
- Reversal rows select the matching pair and time.
- Secondary battle rows select the matching pair.
- Missing/not observed buckets are not drawn as continuous real data.

## Mobile browser gate

Check at 360px width.

Pass conditions:

- No horizontal page overflow.
- Controls do not cover the chart.
- Chart remains readable.
- Lower-priority legend/context information is reduced.
- Time Inspector is readable.
- Reversals, Other battles, and Feed do not create a long dense wall.
- Status and coverage notes remain short enough to scan.

## Data-state gate

Check these states manually or with mocked API responses.

- Live
- Partial
- Stale
- Empty
- Error
- Demo fallback

Pass conditions:

- Empty does not look like a broken page.
- Error does not look like live data.
- Demo fallback is clearly marked.
- Stale is clearly marked.
- Partial explains that only observed channels are included.

## Current scope boundary

This checklist completes the Twitch Battle Lines Wide page only.

Not included in this completion gate:

- Kick Battle Lines migration
- Split layout
- advanced add-rival search
- long-term history/trends integration
