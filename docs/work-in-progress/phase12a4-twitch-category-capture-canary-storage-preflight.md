# 12A-4-15 Twitch category canary read-only storage preflight

## Status

Accepted. PR #599 froze the exact successful evidence and retired every production observation path. Its merge SHA is `785a271a7b95808e01478b9fb3846028229faa24`.

No Twitch category canary trigger exists, runtime category capture is not authorized, and permanent category enablement remains blocked.

## Accepted observation

- source commit: `a8af5e3d3bad24e1994312f2877e470276b3f517`
- workflow run: `29598193753`
- workflow job: `87943655515`
- artifact: `8413901173`
- artifact digest: `sha256:ec0bd67698f93f104120aa626a854df027cb6d8a013469a4b6e8dd26a58f3225`
- observed at: `2026-07-17T16:57:55.343Z`
- evidence digest: `sha256:0c7de9e6d71027b9b040c348f017d413908e631b01718d347b72d2ae8700f943`
- outcome: `accepted_candidate` in the immutable observed evidence
- final contract status: `accepted`

The initial reporting run exposed a Wrangler output parser defect. PR #598 replaced the parser with a balanced JSON boundary extractor and added prefix, suffix, ANSI, nested-object, and string-brace fixtures. The parser-fixed production observation then succeeded.

## Storage evidence

- current Twitch D1: `325.90 MB`
- projected Twitch 90-day size: `374.22 MB`
- projected Twitch headroom: `75.78 MB`
- current account-wide D1: `3665.34 MB`
- projected account-wide D1: `3713.66 MB`
- projected account-wide headroom: `894.34 MB`

All storage thresholds passed:

- projected Twitch size at or below `440 MB`;
- Twitch headroom at or above `10 MB`;
- account-wide headroom at or above `500 MB`.

## Data and runtime evidence

- all required category tables present;
- provider leakage rows: `0`;
- canary bindings absent;
- direct permanent `CATEGORY_CAPTURE_ENABLED` absent;
- latest normal Twitch snapshot age: `1.93 minutes`;
- latest snapshot source: `real`;
- latest snapshot stream count: `300`;
- latest snapshot total viewers: `1,347,962`;
- latest snapshot authenticated, non-empty, and accepted;
- Twitch category dictionary rows remain `0` before the canary;
- category coverage remains `unavailable` before the canary, with zero observed and missing category samples.

## Read-only boundary

The accepted observation used direct Cloudflare API `GET` requests and D1 `SELECT` statements only.

It performed no Worker deployment or deletion, no Worker settings mutation, no D1 write, no migration, no flag change, no trigger creation, no runtime capture, and no Kick change.

## Retired paths

PR #599 removed the original observation request, reporting request, diagnostic marker, reporting production workflow, and all push-triggered production jobs from the remaining preflight workflow.

The remaining workflow is pull-request verification only and contains no production credentials or production operation.

## Next gate

A separate exact one-file Twitch canary trigger may now be designed. It must pin:

- preflight acceptance PR `#599`;
- preflight acceptance merge SHA `785a271a7b95808e01478b9fb3846028229faa24`;
- observation time `2026-07-17T16:57:55.343Z`;
- evidence digest `sha256:0c7de9e6d71027b9b040c348f017d413908e631b01718d347b72d2ae8700f943`.

The trigger inspector still rejects evidence older than 60 minutes at the start event. Therefore a later trigger requires a fresh accepted storage observation or an explicitly revised freshness gate; this acceptance does not silently bypass that rule.

No automatic Twitch start, permanent enablement, cadence change, retention change, backfill, or cross-provider analytics is authorized.
