# Phase 10 U10F — public readiness and channel entry

Status: active
Branch: `work-quality-u10f-readiness`
Entry main commit: `f50431d6e5fdb7a1ea9e35a6bf900a9076481cf9`
Exact next branch after U10F: `work-quality-u10g-architecture`

## Scope

U10F resolves the remaining readiness findings from the permanent U10A baseline:

- derive General Public Readiness from the repository-owned public route inventory and include both Local Watchlist routes;
- assign Production Smoke ownership to About, Support, Changelog, both Channel routes, and both Local Watchlist routes in addition to the existing portal and provider routes;
- replace the Channel missing-id presentation with one focused provider-safe task that returns the user to the matching provider History page;
- suppress period, task, copy, external-channel, analysis, report, and scope controls while no channel id exists;
- prove that missing-id entry performs zero History data requests, never crosses providers, remains usable at 1440, 820, 390, and 360 pixels, and preserves the U10E responsive contract.

## Required outcomes

- Public Readiness audits all 20 repository-owned HTML routes from the route inventory rather than a separate manually maintained provider array.
- Twitch and Kick Watchlist routes are required by the general readiness gate.
- Production Smoke owns 20 repository-owned HTML routes and retains provider Status/API checks and explicit 404 checks.
- Channel missing-id entry has one visible provider-safe primary action.
- Missing-id entry makes zero Twitch or Kick History requests.
- Irrelevant Channel controls and analysis panels are not visible or focusable without a channel id.
- No page-level horizontal overflow occurs in the eight provider/viewport missing-id scenarios.
- APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, localization runtime, and provider separation remain unchanged.

## Change boundary

U10F changes route ownership, readiness acceptance, production smoke configuration, and Channel missing-id presentation only. It does not add channel search, a new API, storage, bindings, collector work, cron, retention, output fields, localization runtime, or provider combination.
