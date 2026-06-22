# ViewLoom History Archives H3 contract

Status: H3 implementation contract

History Archives separates Daily, Peaks, and Battles into one active subview at a time and preserves provider-specific data boundaries.

## Required behavior

- Daily defaults to the latest nine matching days and keeps filter/toggle behavior.
- Peaks defaults to Top 10 and marks the highest observed peak as featured.
- Battles defaults to Top 10 and marks the closest daily aggregate matchup as featured.
- Battle type labels are derived only from retained daily closeness values.
- No reversal or exact event time is inferred from day-level aggregates.
- Valid archive cards use the dark ViewLoom surface system.
- Archive switching does not issue another History API request.
- Twitch and Kick routes, API calls, links, values, and claims remain separate.
- Desktop and mobile layouts have no page-level horizontal overflow.

## Hierarchy labels

Daily:

- `Latest matching day`
- `Observed day`

Peaks:

- `Highest peak`
- `Observed peak`

Battles:

- `Closest daily matchup`
- `Very close day`
- `Close day`
- `Competitive day`
- `Daily matchup` when closeness is unavailable

## Non-goals

No D1 schema, collector, cron, retention, API route, new metric, event reconstruction, cross-provider total, or Cloudflare configuration change.
