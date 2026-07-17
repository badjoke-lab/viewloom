# 12A-4-15 Twitch category canary read-only storage preflight

## Status

Accepted evidence candidate in PR #599. The exact production observation passed every read-only gate. The contract remains `accepted_candidate` until PR #599's merge SHA is recorded in a separate finalization PR.

No Twitch category canary trigger exists, and runtime category capture is not authorized.

## Accepted observation

- source commit: `a8af5e3d3bad24e1994312f2877e470276b3f517`
- workflow run: `29598193753`
- workflow job: `87943655515`
- artifact: `8413901173`
- artifact digest: `sha256:ec0bd67698f93f104120aa626a854df027cb6d8a013469a4b6e8dd26a58f3225`
- observed at: `2026-07-17T16:57:55.343Z`
- evidence digest: `sha256:0c7de9e6d71027b9b040c348f017d413908e631b01718d347b72d2ae8700f943`
- outcome: `accepted_candidate`

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

The accepted observation used:

- direct Cloudflare API `GET` requests only;
- D1 `SELECT` statements only.

It performed no Worker deployment or deletion, no Worker settings mutation, no D1 write, no migration, no flag change, no trigger creation, no runtime capture, and no Kick change.

## Retirement

PR #599 removes:

- the original one-time observation request;
- the reporting request;
- the diagnostic marker;
- the reporting production workflow;
- the push-triggered production jobs from the original preflight workflow.

The remaining workflow is pull-request verification only and contains no production credentials or production operation.

## Next gate

After PR #599 merges, a separate finalization PR must record its exact merge SHA and change the contract from `accepted_candidate` to `accepted`.

Only after that finalization may a separate one-file Twitch canary trigger be considered. The trigger must pin the accepted preflight PR, merge SHA, observation timestamp, and evidence digest and must still pass the 60-minute freshness rule at start. No automatic start or permanent enablement is authorized.
