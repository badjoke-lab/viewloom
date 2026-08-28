# Kick Stream Map Country live join contract v0.1

## Purpose

Define the production-independent join from the Kick live population to reviewed Kick Country evidence before any public API, production persistence, or Map activation.

This is the next layer after `kick-stream-map-evidence-persistence-contract-v0.1.md`. It does not weaken that contract.

## Population boundary

- The input population is a **Kick-only live population**.
- Twitch live rows are not part of this result set.
- Twitch and Kick viewer counts, populations, geography evidence, or coverage are not aggregated.

## Identity boundary

1. Livestream V2 `channel.slug` may locate the matching official Channels row by normalized slug equality.
2. The canonical join from that Channels row to reviewed Kick evidence uses Channels `broadcaster_user_id` only.
3. A slug/login is lookup/display metadata: **slug is not a stable identity**.
4. Missing or ambiguous Channels matches fail closed to `unmapped`.
5. Missing `broadcaster_user_id` fails closed to `unmapped` even if the slug happens to match an evidence-like value.
6. Provider must remain `kick` at every join boundary. **Twitch evidence is never copied** into Kick.

## Reviewed evidence boundary

The live join consumes already-reviewed Kick evidence; it does not perform automatic geography inference.

Expected terminal review semantics are preserved:
- accepted reviewed Country -> `mapped`
- no qualifying reviewed Country or unavailable stable join -> `unmapped`
- reviewed non-person exclusion -> `excluded`
- contradictory qualifying reviewed base evidence -> `conflict`

The public/core terminal state set is therefore **mapped / unmapped / excluded / conflict**.

Country placement still requires a reviewed two-letter Country code. City is not inferred from Country. Current/temporary evidence is not converted to Home/Base Country.

## Fail-closed cases

The reference core must fail closed when:
- no Kick Channels row matches the live slug,
- more than one Kick Channels row matches the live slug,
- the matched row lacks `broadcaster_user_id`,
- no reviewed Kick evidence matches that stable ID,
- multiple reviewed evidence records ambiguously claim the same stable ID,
- only Twitch evidence exists for the value,
- reviewed evidence is not an accepted Country placement.

## Reference implementation scope

`scripts/kick-stream-map-country-live-join-core.mjs` is a pure, side-effect-free reference core. It accepts fixture-shaped arrays and returns deterministic terminal states. It performs no provider request and no persistence.

The fixture covers at least:
1. stable-ID mapped join,
2. slug-only identity rejection,
3. provider-mismatched Channels rejection,
4. Twitch evidence non-reuse,
5. reviewed conflict,
6. reviewed non-person exclusion,
7. reviewed unmapped evidence.

## Mutation and deployment boundary

This contract authorizes none of the following:
- **No production deploy**
- **No D1 write**
- **No schema change**
- **No collector cadence change**
- no raw retention change
- no paid API call
- no public Kick Stream Map activation
- no automatic Country/City/Current acceptance

A later API/UI or persistence PR must preserve provider separation and pass its own gate before production activation.
