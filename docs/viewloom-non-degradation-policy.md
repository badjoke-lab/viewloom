# ViewLoom Non-Degradation Policy

Status: mandatory baseline  
Scope: ViewLoom / Twitch data / Kick data / Cloudflare Free recovery  
Created: 2026-05-15

## 1. Purpose

This document fixes the recovery baseline for ViewLoom.

ViewLoom may need to run on Cloudflare Free, but Cloudflare Free compatibility must not be used as a reason to reduce product quality, page scope, interaction quality, visual quality, data honesty, or feature intent.

The project must preserve the originally agreed ViewLoom feature quality and recover the site toward that target.

## 2. Hard rule

Cloudflare Free compatibility may only change backend implementation strategy.

It must not reduce:

- UI quality
- interaction quality
- page layout quality
- feature scope
- chart readability
- data-state honesty
- platform-label correctness
- Twitch/Kick separation clarity
- the agreed meaning of each major page

## 3. What may change under Cloudflare Free

The following changes are allowed because they do not lower user-facing product quality:

- use smaller API payloads
- use derived page payloads instead of raw snapshot dumps
- use daily or bucket rollups
- cache stable historical payloads
- reduce unnecessary repeated D1 reads
- compute past-day views from fixed aggregate payloads
- report stale / partial / empty / demo / error honestly
- defer expensive internal recomputation if the current page state remains truthful

## 4. What is forbidden

The following changes are forbidden, even if they would make Cloudflare Free operation easier:

- turning Heatmap into a simple card list
- removing the Canvas / Camera / LOD Heatmap direction
- removing Heatmap Wide mode as the primary completion target
- removing Day Flow Full / Top Focus
- removing Day Flow Volume / Share
- removing Others handling from Day Flow instead of treating it properly
- removing Time Focus from Day Flow
- turning Battle Lines into a simple line chart without selected-time inspection
- removing Battle Lines Time Inspector
- removing Battle Lines gap band
- merging missing / offline / not observed into one fake value
- turning History & Trends into a simple daily link list
- removing History summary cards, trend chart, rankings, or daily archive
- leaving Status as placeholder-only
- hiding demo fallback behind real-looking UI
- showing empty data as demo
- showing not-ready Kick data as if it were real
- using official-looking labels such as `Twitch ViewLoom` or `Kick ViewLoom`
- using `Compare` as the main Battle Lines role label where `Rivalry` is required

## 5. Page-level fixed quality baseline

### 5.1 Heatmap

Heatmap must remain the Now page.

Required baseline:

- Canvas / Camera / Redraw direction
- LOD / semantic zoom direction
- Wide-first completion
- pan / zoom / click interactions without click-drag conflict
- selected stream updates reliably
- normal page scrolling must not be unnecessarily hijacked
- mobile must provide an intentional map-move interaction model

### 5.2 Day Flow

Day Flow must remain the Today page.

Required baseline:

- Wide / Split terminology
- Wide-first completion
- Metric: Volume / Share
- Scope: Full / Top Focus
- Others retained and treated honestly
- Time Focus retained
- stale / partial / empty / demo / error states shown clearly

### 5.3 Battle Lines / Rivalry Radar

Battle Lines must remain the Rivalry page.

Required baseline:

- Wide-first completion
- Chart-first layout
- Recommended / Custom / Inspect state model
- Viewers / Indexed metric model
- selected-time cursor
- click / tap / scrub time inspection
- Time Inspector
- gap band
- reversal / secondary / feed sections without chip clutter
- missing / offline / not observed separation

### 5.4 History & Trends

History & Trends must remain the Trends page and the fourth major page candidate.

Required baseline:

- Last 7 days
- Last 30 days
- custom range where supported
- Viewer-minutes / Peak viewers
- summary cards
- main trend chart
- top streamers
- daily archive cards
- Day Flow / Battle Lines deep links
- coverage note

### 5.5 Status

Status must be the data-trust page, not a placeholder page.

Required baseline:

- platform-specific status pages where applicable
- collector state
- last success
- latest snapshot
- coverage
- source mode: real / stale / demo
- feature data matrix
- state definitions
- known limitations
- no secrets, tokens, or unsafe debug dumps

## 6. Platform labeling baseline

ViewLoom is the product name.

Twitch and Kick must be used as observed data sources, not as official product prefixes.

Required labels:

- `Twitch data`
- `Kick data`
- `TWITCH DATA · NOW`
- `TWITCH DATA · TODAY`
- `TWITCH DATA · RIVALRY`
- `TWITCH DATA · TRENDS`
- `TWITCH DATA · STATUS`
- `KICK DATA · NOW`
- `KICK DATA · TODAY`
- `KICK DATA · RIVALRY`
- `KICK DATA · TRENDS`
- `KICK DATA · STATUS`

Forbidden labels:

- `Twitch ViewLoom`
- `Kick ViewLoom`
- `ViewLoom Twitch`
- `ViewLoom Kick`
- `Official Twitch data`
- `Official Kick data`
- `Powered by Twitch`
- `Powered by Kick`

## 7. Data honesty rule

Every page must distinguish the following states when applicable:

- real
- stale
- partial
- empty
- demo
- error
- not_ready

Important distinctions:

- empty is not demo
- stale is not fake
- partial is not failure
- demo is never real
- not_ready must not be presented as working data

## 8. Current mandatory recovery target

The recovery work must remove ViewLoom's dependency on legacy `livefield.pages.dev` feature proxies for core Twitch pages.

Mandatory target:

- `/api/day-flow` must become ViewLoom-owned
- `/api/battle-lines` must become ViewLoom-owned
- Status must expose the real current state
- Heatmap Canvas must become the normal user-facing renderer when ready
- old naming and official-risk labels must be removed from source, not only patched after build

## 9. PR gate

A PR must not be accepted as a quality recovery PR unless it states:

- which user-facing specification it preserves
- whether it changes backend-only behavior
- whether it changes UI or feature scope
- how demo / empty / stale / partial are handled
- whether any `livefield.pages.dev` dependency remains
- whether old official-risk labels remain

## 10. Short version

Cloudflare Free can force a thinner backend.

It cannot justify a worse ViewLoom.
