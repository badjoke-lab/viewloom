# R12C-1 launch copy and FAQ acceptance — 2026-07-09

Status: complete
Phase: Phase 12
Workstream: R12C-1
Source inventory: `../audits/r12c0-message-inventory.json`
English source-language package: `../product/english-launch-copy.md`
Structured package: `../audits/r12c1-launch-copy-package.json`

## Accepted package

R12C-1 now provides:

```text
one-line description
short listing description
long description
seven-role feature summary
coverage limitations
plain-language Kick candidate model explanation
provider separation explanation
5-minute collection cadence explanation
up-to-180-day daily rollup retention explanation
12-question FAQ
Status/help link package
Support/legal link package
English terminology contract
R12C-2 asset-package handoff
```

## Product identity accepted

One-line description:

> ViewLoom is an independent, unofficial live-stream data observatory for reading bounded Twitch and Kick observations through current snapshots, daily movement, rivalries, channel footprints, and retained trends.

The package keeps `independent`, `unofficial`, `observed`, `bounded`, and provider separation as required product boundaries.

## Feature roles accepted

```text
Heatmap       Now
Day Flow      Today
Battle Lines  Rivalry
History       Trends
Channel       One retained footprint
Watchlist     Saved in this browser
Status        Data health and limits
```

## Coverage and retention boundaries accepted

```text
Collection cadence: 5 minutes
Public daily rollups: up to 180 days
Twitch: configured Top 300 observed window
Kick: configured set of up to 100 observed candidates
Kick provider-wide directory claim: forbidden
Combined Twitch/Kick totals: forbidden
Cross-platform rankings: forbidden
```

The retention explanation explicitly states that up-to-180-day daily rollups do not mean every raw observation is retained for 180 days and do not create exact session records.

## FAQ accepted

The package contains 12 reusable questions and evidence-bounded answers covering:

```text
product identity
coverage boundary
Kick candidate model
provider separation
official/unofficial status
main view roles
collection cadence
historical retention
Fresh / Partial / Empty states
support influence boundary
Status and methodology routes
Local Watchlist storage
```

## Link packages accepted

Status/help:

```text
/about/
/twitch/status/
/kick/status/
/changelog/
GitHub repository
```

Support/legal:

```text
/support/
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

## Forbidden positive claims

The reusable launch package must not claim:

```text
complete platform coverage
official Twitch or Kick analytics
unique viewers
exact creator revenue
exact session reconstruction
causal explanations for audience movement
combined Twitch and Kick audience totals
cross-platform rankings
Twitch-parity Kick directory coverage
charitable donation framing for the support flow
```

## Decision

R12C-1 is complete. The English source-language package is ready for external listing reuse and for Phase 13–14 localization after the approved program reaches those phases.

The next active workstream is R12C-2 launch/share asset package.

R12C-2 must use the R12C-1 copy boundaries for screenshot captions and asset metadata. Phase 12A remains blocked until R12C-3 closes Phase 12.
