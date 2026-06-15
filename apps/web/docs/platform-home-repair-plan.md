# Platform Home Repair Plan

Status: fixed implementation schedule

This document freezes the repair plan for `/twitch/` and `/kick/` before implementation resumes on the deferred product roadmap.

## Goal

Each provider home becomes a platform briefing page that answers, without opening another page:

1. Is the provider data healthy now?
2. How many live streams and viewers are currently observed?
3. Who is largest or rising now?
4. What happened today?
5. What changed across recent completed days?
6. Which ViewLoom feature should be opened for deeper inspection?

The provider home is not a duplicate Heatmap, Day Flow, Battle Lines, or History implementation. It summarizes those views and links into them.

## Current defects to remove

- Hero KPI cells render unexplained dashes.
- The current-field chart is decorative and does not communicate axes, values, or series meaning.
- `What changed` contains implementation copy rather than provider signals.
- Status is presented as a fifth analysis feature card.
- Twitch and Kick share nearly identical copy even when available signals and coverage differ.
- Header, data strip, source, freshness, and collector language can disagree.

## Final provider-home structure

The completed Twitch and Kick pages use the same component structure and provider-specific data.

1. Compact provider hero
2. Four current KPI cells
3. Clickable provider data-status strip
4. Four analysis feature cards only: Heatmap, Day Flow, Battle Lines, History
5. Live Now ranking
6. Current signals
7. Today summary and movement
8. Recent Trends using completed days
9. Latest provider signals
10. ViewLoom updates from the Changelog layer when available
11. Provider-specific coverage note
12. Existing footer and legal/independence copy

Status remains accessible from the header/status strip and is not a fifth analysis feature.

## Truth and state rules

Allowed page states are `loading`, `fresh`, `partial`, `stale`, `empty`, `demo`, and `error`.

- `empty` is a healthy real observation with no qualifying records; it is not demo.
- `stale` keeps the last normal data and explains its age.
- `partial` shows data while naming the coverage limitation.
- `demo` is visibly labeled everywhere that demo values appear.
- `error` must not silently replace real values with fixtures.
- Unsupported provider signals render `Unavailable` or are omitted; they never render a fake zero.
- A bare em dash is not an acceptable final explanation for an unavailable KPI.
- All totals must be labeled as observed values, never provider-wide totals.

## Provider separation

The layout and component contract are shared. The following remain provider-specific:

- top limit and page coverage
- collector and provider source notes
- activity availability
- unavailable signals
- partial-state reasons
- route and stream links
- accent color

Twitch and Kick values must never be combined on either provider home.

## Home payload direction

The implementation target is one lightweight provider-home payload per provider:

- `/api/twitch-home`
- `/api/kick-home`

The payload should assemble already-derived snapshot, day, battle, history, and coverage summaries. The browser must not download raw minute snapshots or independently scan all feature APIs to rebuild the page.

Required payload groups:

- provider state, source, freshness, and coverage
- current observed totals and top streams
- current signals
- today peak, peak time, top viewer-minutes stream, and battle events when available
- latest completed-day summary and recent trend points
- explicit notes and unsupported-signal reasons

## Platform Home schedule

### Home PR 1 — Contract and QA

- freeze this plan
- expand the Home QA contract
- remove Status from the required analysis-card labels
- require the fixed schedule and state semantics in verification

### Home PR 2 — Real home payloads

- add `/api/twitch-home` and `/api/kick-home`
- define and validate the shared payload contract
- assemble real status, current, today, recent, and coverage summaries
- add explicit loading/empty/partial/stale/demo/error fixture coverage

### Home PR 3 — Shared provider-home UI

- replace empty hero KPI cells
- replace the decorative current-field surface
- make the status strip clickable
- render exactly four analysis cards
- add Live Now, Current signals, Today, and Recent Trends
- keep Twitch and Kick on the same shared component structure

### Home PR 4 — Provider differences, mobile, and final QA

- add Latest signals and ViewLoom updates surfaces
- handle Kick-specific unsupported signals and coverage notes
- finish mobile hierarchy and accessibility
- update SEO copy
- run browser acceptance against Twitch and Kick

## Fixed schedule after Platform Home

### Changelog

1. Changelog foundation
2. Changelog page UI
3. Changelog data polish and repair-period backfill

### Deferred feature roadmap

1. Deep Link
2. Copyable Reports
3. History additional rankings
4. Compare Periods
5. Watchlist Lite
6. Channel Index
7. Channel Pages
8. Search
9. Export
10. Page-local Alerts
11. Data Lane
12. Kick coverage refinement

## Merge reporting rule

After every merge, the work report must state:

- the complete fixed schedule
- the current completed/in-progress/next position
- the merged PR number and merge commit
- what changed for users and what did not change yet
- the verification result
- the exact next PR before implementation continues

## Acceptance direction

The completed pages should match the approved briefing-dashboard direction:

- dark ViewLoom shell retained
- purple Twitch accent and green Kick accent
- information-dense but readable desktop grid
- meaningful real values instead of placeholders
- four analysis cards
- data-bearing Live Now, Today, and Recent Trends sections
- separate provider signals and ViewLoom product updates
- reduced mobile information density rather than a desktop grid stacked unchanged
