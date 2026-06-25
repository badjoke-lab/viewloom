# ViewLoom public surface inventory

Status: completed Phase 8 P8A inventory
Version: 1.0
Updated: 2026-06-26
Base commit: `2d1b23ec9cb506212c4fefc828a8c3524d52183b`
Next branch: `work-public-browser-audit`

## 1. Machine-readable package

The canonical inventory root is:

```text
docs/audits/public-surface-inventory.json
```

It references provider route files, shared surface profiles, gate groups, and the explicit gap ledger. The package is validated by:

```text
scripts/verify-public-surface-inventory.mjs
.github/workflows/public-surface-inventory.yml
```

The inventory records repository-owned routes and current evidence. It does not treat an existing workflow name or a successful build as proof that every public interaction is usable.

## 2. Inventory totals

```text
Vite HTML inputs                 20
Explicit not-found page           1
Owned inventory entries          21
Indexable routes                 16
Explicit noindex routes           4
Sitemap routes                   16
Public Readiness configured      18
Production Smoke page routes     13
```

Twitch and Kick remain separated through route, API, binding, storage, output, and coverage ownership.

```text
Twitch binding: DB_TWITCH_HOT
Kick binding:   DB_KICK_HOT
```

## 3. Route matrix

| Route | Owner profile | API source | Search | Current acceptance |
|---|---|---|---|---|
| `/` | Portal | Twitch Home + Kick Home | index | partial |
| `/about/` | Static content | none | index | partial |
| `/support/` | Static content | none | index | partial |
| `/changelog/` | Changelog | static JSON | index | partial |
| `/twitch/` | Provider Home | Twitch Home | index | partial |
| `/kick/` | Provider Home | Kick Home | index | partial |
| `/twitch/heatmap/` | Heatmap | Twitch Heatmap | index | partial |
| `/kick/heatmap/` | Heatmap | Kick Heatmap | index | partial |
| `/twitch/day-flow/` | Day Flow | Twitch Day Flow | index | partial |
| `/kick/day-flow/` | Day Flow | Kick Day Flow | index | partial |
| `/twitch/battle-lines/` | Battle Lines | Twitch Battle Lines | index | partial |
| `/kick/battle-lines/` | Battle Lines | Kick Battle Lines | index | partial |
| `/twitch/history/` | History | Twitch History | index | known P1 defects |
| `/kick/history/` | History | Kick History | index | known P1 defects |
| `/twitch/channel/` | Channel | Twitch History reuse | noindex | complete for v1 contract |
| `/kick/channel/` | Channel | Kick History reuse | noindex | complete for v1 contract |
| `/twitch/watchlist/` | Watchlist | Twitch Heatmap + History | noindex | complete for v1 contract |
| `/kick/watchlist/` | Watchlist | Kick Heatmap + History | noindex | complete for v1 contract |
| `/twitch/status/` | Status | Twitch Status | index | partial |
| `/kick/status/` | Status | Kick Status | index | partial |
| unknown path | Not Found | none | noindex | partial |

`complete for v1 contract` means that the accepted feature contract has local, hosted, or production evidence appropriate to that feature. It does not exempt the route from the cross-site P8B viewport and unusual-content audit.

## 4. History inventory

Both History routes are owned by the existing History response and enhancement stack.

```text
Twitch API: /api/history
Kick API:   /api/kick-history
```

Recorded controls and tasks:

```text
Period:
  Last 7 days
  Last 30 days
  custom from/to

Metric:
  viewer_minutes
  peak_viewers

Top-level tasks:
  Overview
  Archives
  Report & Export

Archive tasks:
  Daily
  Peaks
  Battles

State and navigation:
  selected day
  ranking sort
  ranking limit
  direct URL state
  Back / Forward responsibility

Outputs:
  report
  short post
  share card
  PNG
  CSV
  JSON
```

Recorded states:

```text
loading
real
partial
stale
empty
missing
demo
error
in_progress
```

History has broad legacy contract and browser workflows, but the inventory deliberately retains the approved P1 classification. Existing gates do not prove that metric switching changes all dependent surfaces or that the chart exposes an acceptable readable scale, ticks, units, and day interaction.

## 5. Acceptance coverage findings

### Existing strengths

- Public Readiness verifies built metadata, canonical ownership, feature tabs, local links, sitemap membership, analytics, and explicit 404 output.
- Production Smoke verifies exact deployed `main` identity, 13 primary public routes, separate Twitch/Kick Status APIs, separate D1 bindings, collector freshness, and explicit 404 behavior.
- History, Channel, Watchlist, and Status have feature-specific contract and browser workflows.
- Watchlist has dedicated hosted Preview and production acceptance.
- Channel and the previous History baseline have permanent production acceptance records.

### Explicit gaps

1. No single permanent browser matrix covers every major route at `1440`, `820`, `390`, and `360` pixels.
2. Portal, provider homes, Heatmap, Day Flow, Battle Lines, content pages, and 404 lack one complete state-and-viewport gate.
3. Public Readiness configures 18 pages and omits both Watchlist routes even though Vite builds them.
4. Production Smoke omits About, Support, Changelog, both Channel routes, and both Watchlist routes. Channel and Watchlist have separate records; the three content routes do not.
5. History remains a known P1 surface despite broad old workflow coverage.
6. There is no repository-owned Contact, Terms, Privacy, Refund Policy, or Commercial Disclosure route.
7. Support refers to a refund policy without linking to a dedicated repository-owned policy page.

These findings are inventory facts. P8A does not repair them.

## 6. Missing public surfaces

```text
/contact/                 missing; external form currently used
/terms/                   missing
/privacy/                 missing
/refund-policy/           missing; support copy only
/commercial-disclosure/   missing
```

The roadmap keeps these in Phase 12 unless P8B or release-readiness evidence promotes a narrower earlier blocker.

## 7. P8B handoff

P8B must convert this static ownership inventory into browser evidence.

Required viewport matrix:

```text
1440px
820px
390px
360px
```

Required state matrix where applicable:

```text
real/fresh
partial
stale
empty
missing
demo
error
loading
storage unavailable
long content
```

P8B must classify every reproduced problem as P0, P1, P2, or P3 and identify the affected route, state, viewport, owner file, existing gate, and missing assertion. The pre-approved History defects remain P1 and are not re-opened for approval.
