# Twitch Stream Map City UI gate v0.1

Issue: #1060

This gate exposes the already-merged City API contract in the public Twitch Stream Map UI without changing data acquisition, reviewed evidence, storage, or collector cadence.

## Public activation state

- The Country / City geography selector is part of the public Twitch Stream Map UI.
- City requests are explicit through `?geography=city` and the City API contract reports `publicCityUiActivated: true`.
- Current / IRL remains unavailable and continues to report `currentLocationActivated: false`.
- A City reference point represents a reviewed City aggregate reference only; it is not a creator exact, home, or current location.
- City aggregates without reviewed reference geometry remain available through the list-first fallback.

## User-visible geography modes

- Country is the default and preserves the existing `/api/twitch-stream-map` request.
- City is explicit and requests `/api/twitch-stream-map?geography=city` while preserving the existing population query parameters.
- Current / IRL remains unavailable in this gate.

## City semantics

- City placement uses only `home_base` and `declared_location` evidence as enforced by the API contract.
- `current_location` is not used for base City placement.
- Country-only rows remain explicitly accounted as `country_only` at City resolution.
- Base City conflicts remain fail-closed and are not plotted.
- The UI must expose the API's unstable identity state rather than treating login as a stable Twitch user ID.
- No address, latitude, longitude, GPS trace, or equivalent precise creator location may be rendered.

## Independence

Geography mode is orthogonal to population and evidence filters. Changing Country/City must not mutate evidence acceptance or persistence.

## Non-goals

- no production deploy from this gate alone;
- no D1 write or schema change;
- no collector cadence change;
- no Twitch acquisition change;
- no Current / IRL activation;
- no Kick/Twitch evidence copying or aggregation.
