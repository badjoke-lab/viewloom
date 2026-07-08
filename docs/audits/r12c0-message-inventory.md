# R12C-0 English message inventory

Status: complete
Phase: Phase 12
Workstream: R12C-0
Updated: 2026-07-09
Machine-readable inventory: `r12c0-message-inventory.json`

## Current product identity source material

```text
Portal kicker:
Live-stream data, separated by platform

Portal headline:
Observe the field. Then follow the movement.

Portal lede:
See who is largest now, follow audience movement through the day, compare rival streams, and review retained trends. Twitch and Kick observations always remain separate.

About headline:
A narrow tool, built around distinct questions.

About boundary:
ViewLoom does not claim complete platform coverage. It records a bounded observed field, marks limitations, and gives each kind of movement its own view.
```

These are current public-source messages. R12C-1 may select, normalize, or rewrite them into a launch package, but R12C-0 does not automatically designate every current sentence as approved launch copy.

## Feature-role source material

```text
Heatmap       Now       Who is largest, rising, or active right now.
Day Flow      Today     How observed audiences moved through the UTC day.
Battle Lines  Rivalry   Where rival streams closed gaps, surged, or changed order.
History       Trends    How peaks, rankings, and audience volume changed over time.
Channel       Utility   One retained channel footprint.
Watchlist     Local     Browser-local saved evidence.
Status        Health    Freshness, coverage, source mode, and limitations.
```

Provider Home adds a second usable wording layer:

```text
Heatmap       See where observed viewers are largest and which streams are moving now.
Day Flow      Read the day as audience terrain across observed streams.
Battle Lines  Compare observed live-stream gaps, reversals, and rivalries.
History       Review retained rollups, top streamers, peaks, and trends.
```

## Required evidence boundaries for launch copy

```text
Collection cadence: 5 minutes
Rollup retention: up to 180 days
Twitch boundary: Top 300 observed window
Kick boundary: Top 100 observed candidates
Twitch/Kick combination: forbidden
Official analytics claim: forbidden
Unique-viewer claim: forbidden
Exact revenue claim: forbidden
Exact session reconstruction claim: forbidden
```

Viewer counts are public observed values collected on a schedule. Viewer-minutes are derived from repeated snapshots and sample intervals.

Twitch and Kick remain separate across collectors, coverage models, routes, storage, retained data, rankings, exports, and analytical claims.

## Help, Status, Support, and legal route inventory

```text
/about/                    Method and limits
/twitch/status/            Twitch data health and coverage
/kick/status/              Kick data health and coverage
/changelog/                Public change history
/support/                  Support flow
/contact/                  Contact and correction/payment-support route
/terms/                    Terms
/privacy/                  Privacy
/refund-policy/             Refund Policy
/commercial-disclosure/    Commercial Disclosure
```

## FAQ source material found

R12C-1 has enough evidence to answer at least these questions without inventing new facts:

```text
What is ViewLoom?
Does ViewLoom cover all live streams?
Are Twitch and Kick combined?
Are these official platform analytics?
What is each view for?
How often is data collected?
How long are public rollups retained?
What do Fresh, Partial, and Empty mean?
Does support affect rankings or coverage?
Where can data health be checked?
Where is Local Watchlist data stored?
```

## Terminology candidate set

Preferred source terms for R12C-1:

```text
live-stream data observatory
independent
unofficial
observed data
observed field
observed window
observed candidates
platform-separated
current snapshot
UTC day
audience movement
rivalry
reversal
gap
retained trends
viewer-minutes
data status
coverage limits
Local Watchlist
```

Terms that need explicit qualification:

```text
share
ranking
coverage
real-time
```

Avoid or forbid:

```text
complete platform coverage
official analytics
unique viewers
exact creator revenue
exact session reconstruction
combined Twitch and Kick audience total
cross-platform ranking
Twitch-parity Kick directory coverage
donation / charitable donation wording for the support flow
```

## Share asset inventory

Current repo-owned share asset:

```text
apps/web/public/og/viewloom.svg
1200x630
generic Open Graph / summary card
```

It is usable as a generic identity card but is not a representative product screenshot.

The current Public Browser Audit generates full-page screenshots for every owned route at:

```text
1440x1000
820x1180
390x844
360x800
```

Those screenshots are acceptance artifacts. They are not a curated, versioned launch/share asset package.

R12C-2 therefore still needs:

```text
curated current desktop product screenshot
curated current mobile product screenshot
representative Heatmap screenshot
representative Day Flow screenshot
representative Battle Lines screenshot
representative History screenshot
asset manifest with route / viewport / date / intended use
bounded caption set
```

## R12C-1 message gaps

Required:

```text
one approved one-line description
one approved short listing description
one approved long description
unified FAQ
plain-language Kick candidate-coverage explanation
one evidence-bounded retention explanation
launch-package link map
```

Recommended:

```text
clarify the role of Channel in the launch feature summary
clarify the role of Local Watchlist in the launch feature summary
```

## Decision

R12C-0 is complete. The current English source messages, boundaries, routes, FAQ material, terminology candidates, existing share asset, CI screenshot evidence source, and missing launch assets have been inventoried.

The next workstream is R12C-1 launch copy and FAQ. R12C-1 must remain evidence-bounded and must not begin Phase 12A work.
