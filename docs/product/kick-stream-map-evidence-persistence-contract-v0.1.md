# Kick Stream Map evidence persistence and join contract v0.1

Issue: #1057
Source probe run: 32824733495
Source main: af2a6230168111dcbebf29ce6e74f2abbf2daf05
Artifact: kick-stream-map-source-probe-32824733495
Artifact id: 9554496050
Artifact digest: sha256:7a48f2d4e2a82b1ea4c191befe629f4d95ed71c083cec3eaddd04308dde77aa2

## Purpose

Freeze the empirically observed Kick join and evidence boundary before any production persistence change.

## Observed provider shape

The bounded official-source probe observed 100 Livestream V2 rows and 10 successful Channels lookups.

Livestream V2:
- nested `channel.slug`: 100/100
- top-level `broadcaster_user_id`: 0/100
- top-level `user_id`: 0/100
- top-level `channel_id`: 0/100
- `title`: 100/100
- `custom_tags`: 0/100

Channels:
- `slug`: 10/10
- `broadcaster_user_id`: 10/10
- `channel_description`: key present 10/10, non-empty 3/10
- `custom_tags`: 0/10

## Identity and join contract

1. A Livestream V2 row may be joined to Channels by exact normalized equality of Livestream `channel.slug` and Channels `slug`.
2. The stable Kick identity is Channels `broadcaster_user_id` when the joined Channels row provides it.
3. A slug/login is a join key and display identifier only. It must not be represented as a stable Kick user ID.
4. If the join is absent, ambiguous, or the Channels stable ID is absent, stable identity is unavailable and the row fails closed for canonical evidence mutation.
5. Twitch identity and evidence records are never copied into a Kick identity.

## Evidence source classes

Provider-specific evidence provenance remains separated as:
- `account_profile`: official Channels `channel_description`
- `live_title`: official Livestream V2 `title`
- `tag`: only if a currently supported official response actually returns a tag field in a later measured run
- `official_external`: attributable official external source
- `manual_review`: bounded reviewed external evidence

Absence of `custom_tags` in run 32824733495 must be represented as unavailable for that run. It must not be backfilled from the deprecated public `kick.com/api/v2/channels/{slug}` endpoint.

## Persistence boundary

This contract does not authorize production persistence.

Before a later production gate, raw title/profile/tag text must not be retained merely for possible future inference. A later proposal must specify bounded retention/redaction and storage cost first.

Allowed durable contract metadata may include:
- provider = `kick`
- stable Kick user ID when available
- slug used for the measured join
- evidence source class
- source URL or official endpoint class where appropriate
- reviewed/observed timestamps
- terminal review outcome
- derived country/city claim only after manual validator acceptance

## Geography acceptance rules

- No automatic geography acceptance from title, profile text, language, category, slug, display name, timezone, nationality, birthplace, event venue alone, or weak aggregator output.
- Country/City base evidence semantics remain `home_base` / `declared_location` only.
- Current/temporary location belongs to the separate freshness/expiry contract and never mutates home/base automatically.
- No precise address, GPS trace, latitude, or longitude publication.
- Conflicts fail closed to unmapped.

## Mutation boundary

This contract itself authorizes none of the following:
- production collector change
- D1 write
- D1 schema change
- collector cadence change
- public Kick Stream Map activation
- legacy endpoint fallback
- automatic geography inference

A separate accepted implementation gate is required for any production persistence.