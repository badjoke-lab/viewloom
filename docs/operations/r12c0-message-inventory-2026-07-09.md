# R12C-0 message inventory — 2026-07-09

Status: complete
Phase: Phase 12
Workstream: R12C-0
Machine-readable inventory: `../audits/r12c0-message-inventory.json`
Human-readable inventory: `../audits/r12c0-message-inventory.md`

## Inventory completed

R12C-0 collected and classified:

```text
Portal product identity messages
About purpose and limitation messages
Twitch and Kick provider-home descriptions
Heatmap / Day Flow / Battle Lines / History roles
Channel / Local Watchlist / Status utility roles
collection cadence and retention wording
Twitch and Kick coverage boundaries
provider-separation explanation
viewer-count and viewer-minutes boundaries
state semantics
Status / methodology / Changelog / Support / legal routes
FAQ source material
English terminology candidates
current generic share asset
CI-generated screenshot evidence source
R12C-1 message gaps
R12C-2 asset gaps
```

## Current source messages preserved

```text
Portal kicker:
Live-stream data, separated by platform

Portal headline:
Observe the field. Then follow the movement.

About boundary:
ViewLoom does not claim complete platform coverage. It records a bounded observed field, marks limitations, and gives each kind of movement its own view.
```

These are source messages, not automatic final launch-copy approval.

## Feature-role baseline

```text
Heatmap       Now
Day Flow      Today
Battle Lines  Rivalry
History       Trends
Channel       One retained channel footprint
Watchlist     Browser-local saved evidence
Status        Freshness, coverage, source mode, and limitations
```

## Launch evidence boundaries

```text
Collection cadence: 5 minutes
Rollup retention: up to 180 days
Twitch: Top 300 observed window
Kick: Top 100 observed candidates
Cross-provider total/ranking: forbidden
Official analytics claim: forbidden
Unique-viewer claim: forbidden
Exact creator revenue claim: forbidden
Exact session reconstruction claim: forbidden
```

## Asset decision

Current repo-owned generic share asset:

```text
apps/web/public/og/viewloom.svg
1200x630
```

Current Public Browser Audit screenshots are CI acceptance artifacts at 1440x1000, 820x1180, 390x844, and 360x800. They are not a curated repo-owned launch package.

R12C-2 therefore still needs curated desktop/mobile and representative feature screenshots plus an asset manifest and bounded caption set.

## Message gaps handed to R12C-1

```text
approved one-line description
approved short listing description
approved long description
unified FAQ
plain-language Kick candidate-coverage explanation
single evidence-bounded retention explanation
launch-package link map
Channel role decision
Local Watchlist role decision
```

## Decision

R12C-0 is complete. R12C-1 launch copy and FAQ is the next active workstream.

R12C-1 must remain evidence-bounded, preserve Twitch/Kick separation, and avoid unsupported coverage, official-analytics, unique-viewer, revenue, exact-session, and cross-platform ranking claims.

Phase 12A remains blocked until R12C-3 closes Phase 12.
