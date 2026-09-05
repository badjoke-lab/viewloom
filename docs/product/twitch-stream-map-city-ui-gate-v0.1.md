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

## C6 public presentation acceptance

- In City mode, the shared `current_location` evidence checkbox is disabled and unchecked because Current / IRL placement is not active at City resolution.
- Reviewed City aggregate reference points use the `city_aggregate_reference` role; aggregates without reviewed geometry remain `list_only`.
- `Mapped City streams` appears before `Why streams are unmapped`, so successful mapped results are presented before failure accounting.
- The Country results card remains hidden in City mode and the City stream results use the full results width rather than reserving an empty Country column.
- These presentation decisions do not change evidence acceptance, persistence, City placement semantics, or Country mode layout.
- The current acceptance record is `docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json`.

## Independence

Geography mode is orthogonal to population and evidence filters. Changing Country/City must not mutate evidence acceptance or persistence.

## Non-goals

- no production deploy from this gate alone;
- no D1 write or schema change;
- no collector cadence change;
- no Twitch acquisition change;
- no Current / IRL activation;
- no Kick/Twitch evidence copying or aggregation.
